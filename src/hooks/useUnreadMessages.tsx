import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UnreadCount {
  conversationId: string;
  count: number;
}

export const useUnreadMessages = (currentProfileId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchUnreadCounts = useCallback(async () => {
    if (!currentProfileId) return;

    // Get all read receipts for current user
    const { data: receipts, error: receiptsError } = await supabase
      .from("conversation_read_receipts")
      .select("conversation_id, last_read_at")
      .eq("profile_id", currentProfileId);

    if (receiptsError) {
      console.error("Error fetching read receipts:", receiptsError);
      return;
    }

    // Get all conversations the user is part of
    const { data: memberships, error: membershipsError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("profile_id", currentProfileId);

    if (membershipsError) {
      console.error("Error fetching memberships:", membershipsError);
      return;
    }

    const receiptMap = new Map(
      receipts?.map((r) => [r.conversation_id, r.last_read_at]) || []
    );

    const counts: Record<string, number> = {};

    // For each conversation, count unread messages
    for (const membership of memberships || []) {
      const lastReadAt = receiptMap.get(membership.conversation_id);

      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", membership.conversation_id)
        .neq("sender_id", currentProfileId);

      if (lastReadAt) {
        query = query.gt("created_at", lastReadAt);
      }

      const { count, error } = await query;

      if (!error && count !== null) {
        counts[membership.conversation_id] = count;
      }
    }

    setUnreadCounts(counts);
  }, [currentProfileId]);

  useEffect(() => {
    fetchUnreadCounts();

    // Subscribe to new messages to update counts
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCounts]);

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!currentProfileId) return;

      const { error } = await supabase
        .from("conversation_read_receipts")
        .upsert(
          {
            conversation_id: conversationId,
            profile_id: currentProfileId,
            last_read_at: new Date().toISOString(),
          },
          {
            onConflict: "conversation_id,profile_id",
          }
        );

      if (error) {
        console.error("Error marking as read:", error);
        return;
      }

      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));
    },
    [currentProfileId]
  );

  return { unreadCounts, markAsRead, refreshUnreadCounts: fetchUnreadCounts };
};
