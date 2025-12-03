import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  members: Array<{
    profile_id: string;
    profiles: {
      display_name: string;
      avatar_color: string;
    };
  }>;
}

export const useConversations = (currentProfileId: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProfileId) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          conversation_members!inner(
            profile_id,
            profiles(display_name, avatar_color)
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to load conversations");
        return;
      }

      // Map conversation_members to members
      const mappedData = (data || []).map((conv: any) => ({
        ...conv,
        members: conv.conversation_members,
      }));

      setConversations(mappedData);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to conversation changes
    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfileId]);

  const createConversation = async (
    memberIds: string[],
    isGroup: boolean,
    name?: string
  ) => {
    try {
      // Use database function to create conversation atomically
      const { data, error } = await supabase.rpc("create_conversation", {
        p_member_ids: memberIds,
        p_is_group: isGroup,
        p_name: isGroup ? name : null,
      });

      if (error) throw error;

      toast.success("Conversation created");
      return data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
      return null;
    }
  };

  return { conversations, loading, createConversation };
};
