import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import UsersList from "@/components/UsersList";
import { Button } from "@/components/ui/button";
import { LogOut, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

    // Fetch messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(display_name, avatar_color)")
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(data || []);
    };

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

    fetchMessages();
    fetchProfiles();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
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
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    if (!currentProfile) return;

    const { error } = await supabase.from("messages").insert({
      content: messageText,
      sender_id: currentProfile.id,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (!user || !currentProfile) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
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
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
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
        </div>

        <ChatInput onSendMessage={handleSendMessage} />
      </div>

      <UsersList
        users={profiles.map((p) => ({
          id: p.id,
          name: p.display_name,
          isOnline: true,
          avatarColor: p.avatar_color,
        }))}
        currentUserId={currentProfile.id}
      />
    </div>
  );
};

export default Index;
