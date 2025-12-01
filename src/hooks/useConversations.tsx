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
    if (!currentProfileId) {
      console.error("No current profile ID");
      toast.error("Profile not loaded");
      return null;
    }

    try {
      // Check authentication and session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("No active session:", sessionError);
        toast.error("You must be logged in to create a conversation");
        return null;
      }

      console.log("Creating conversation with session:", {
        userId: session.user.id,
        hasAccessToken: !!session.access_token,
        isGroup,
        memberCount: memberIds.length
      });

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          name: isGroup ? name : null,
          is_group: isGroup,
        })
        .select()
        .single();

      if (convError) {
        console.error("Conversation creation error:", {
          message: convError.message,
          details: convError.details,
          hint: convError.hint,
          code: convError.code
        });
        throw convError;
      }

      // Add members (including current user)
      const allMemberIds = [...new Set([currentProfileId, ...memberIds])];
      const { error: membersError } = await supabase
        .from("conversation_members")
        .insert(
          allMemberIds.map((id) => ({
            conversation_id: conversation.id,
            profile_id: id,
          }))
        );

      if (membersError) throw membersError;

      toast.success("Conversation created");
      return conversation.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
      return null;
    }
  };

  return { conversations, loading, createConversation };
};
