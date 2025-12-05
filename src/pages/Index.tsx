import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ConversationsList from "@/components/ConversationsList";
import NewConversationDialog from "@/components/NewConversationDialog";
import AddMembersDialog from "@/components/AddMembersDialog";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle, Plus, UserPlus, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { useConversations } from "@/hooks/useConversations";
import { usePresence } from "@/hooks/usePresence";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import UsersList from "@/components/UsersList";
import TypingIndicator from "@/components/TypingIndicator";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  conversation_id: string;
  profiles: {
    display_name: string;
    avatar_color: string;
  };
}

interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { conversations, createConversation, addMembers, deleteConversation } = useConversations(currentProfile?.id || null);
  const onlineUserIds = usePresence(
    currentProfile?.id || null,
    currentProfile?.display_name || "",
    currentProfile?.avatar_color || "#3B82F6"
  );
  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(
    selectedConversationId,
    currentProfile?.id || null,
    currentProfile?.display_name || ""
  );
  const { unreadCounts, markAsRead } = useUnreadMessages(currentProfile?.id || null);

  // Memoize all users with online status to prevent recalculation on every render
  const allUsersWithStatus = useMemo(() => 
    profiles.map(profile => ({
      id: profile.id,
      name: profile.display_name,
      isOnline: onlineUserIds.some(ou => ou.id === profile.id),
      avatarColor: profile.avatar_color
    })), [profiles, onlineUserIds]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    // Fetch current user's profile
    const fetchCurrentProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      setCurrentProfile(data);
    };

    fetchCurrentProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch profiles
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");
      
      if (error) {
        console.error("Error fetching profiles:", error);
        return;
      }
      setProfiles(data || []);
    };

    fetchProfiles();
  }, [user]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    // Mark conversation as read when selected
    markAsRead(selectedConversationId);

    // Fetch messages for selected conversation
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(display_name, avatar_color)")
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, avatar_color")
            .eq("id", payload.new.sender_id)
            .single();

          setMessages((current) => [
            ...current,
            {
              ...payload.new,
              profiles: profileData,
            } as Message,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentProfile || !selectedConversationId) return;

    const { error } = await supabase.from("messages").insert({
      content: messageText,
      sender_id: currentProfile.id,
      conversation_id: selectedConversationId,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    }
  }, [currentProfile, selectedConversationId]);

  const handleCreateConversation = useCallback(async (
    memberIds: string[],
    isGroup: boolean,
    name?: string
  ) => {
    const conversationId = await createConversation(memberIds, isGroup, name);
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [createConversation]);

  const handleAddMembers = useCallback(async (memberIds: string[]) => {
    if (selectedConversationId) {
      await addMembers(selectedConversationId, memberIds);
    }
  }, [selectedConversationId, addMembers]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    const success = await deleteConversation(id);
    if (success && selectedConversationId === id) {
      setSelectedConversationId("");
    }
    return success;
  }, [deleteConversation, selectedConversationId]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  if (!user || !currentProfile) {
    return null;
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <ConversationsList
          conversations={conversations}
          currentProfileId={currentProfile.id}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          onDeleteConversation={handleDeleteConversation}
          unreadCounts={unreadCounts}
        />

        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
                  <MessageCircle className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Scalk</h1>
                  <p className="text-sm text-muted-foreground">Real-time Chat</p>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedConversation?.is_group && (
                  <Button variant="outline" size="sm" onClick={() => setAddMembersOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Members
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setNewConversationOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/game">
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Game
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            {!selectedConversationId ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-2">Choose a conversation or start a new one</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg.content}
                    sender={msg.profiles.display_name}
                    timestamp={new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    isCurrentUser={msg.sender_id === currentProfile.id}
                    avatarColor={msg.profiles.avatar_color}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {selectedConversationId && (
            <>
              <TypingIndicator typingUsers={typingUsers} />
              <ChatInput 
                onSendMessage={handleSendMessage} 
                onTyping={handleTyping}
                onStopTyping={stopTyping}
              />
            </>
          )}
        </div>

        <UsersList users={allUsersWithStatus} currentUserId={currentProfile.id} />
      </div>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        profiles={profiles.filter(p => p.id !== currentProfile.id)}
        currentProfileId={currentProfile.id}
        onCreateConversation={handleCreateConversation}
      />

      {selectedConversation?.is_group && (
        <AddMembersDialog
          open={addMembersOpen}
          onOpenChange={setAddMembersOpen}
          profiles={profiles}
          existingMemberIds={selectedConversation.members.map(m => m.profile_id)}
          onAddMembers={handleAddMembers}
        />
      )}
    </>
  );
};

export default Index;
