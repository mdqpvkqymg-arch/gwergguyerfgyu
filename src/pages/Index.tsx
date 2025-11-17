import { useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import UsersList from "@/components/UsersList";
import { MessageCircle } from "lucide-react";

interface Message {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  senderId: string;
}

const Index = () => {
  const currentUserId = "user1";
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      message: "Hey everyone! Welcome to Scalk! 👋",
      sender: "Alice Johnson",
      timestamp: "10:30 AM",
      senderId: "user2",
    },
    {
      id: "2",
      message: "Hi Alice! This looks amazing!",
      sender: "You",
      timestamp: "10:31 AM",
      senderId: currentUserId,
    },
    {
      id: "3",
      message: "Really loving the clean interface here!",
      sender: "Bob Smith",
      timestamp: "10:32 AM",
      senderId: "user3",
    },
  ]);

  const users = [
    { id: currentUserId, name: "You", isOnline: true, avatarColor: "bg-primary text-primary-foreground" },
    { id: "user2", name: "Alice Johnson", isOnline: true, avatarColor: "bg-accent text-accent-foreground" },
    { id: "user3", name: "Bob Smith", isOnline: true, avatarColor: "bg-secondary text-secondary-foreground" },
    { id: "user4", name: "Carol White", isOnline: false, avatarColor: "bg-muted text-muted-foreground" },
  ];

  const getAvatarColor = (senderId: string) => {
    const user = users.find(u => u.id === senderId);
    return user?.avatarColor || "bg-muted text-muted-foreground";
  };

  const handleSendMessage = (messageText: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      message: messageText,
      sender: "You",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: currentUserId,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Scalk</h1>
              <p className="text-sm text-muted-foreground">Modern messaging made simple</p>
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-1">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg.message}
              sender={msg.sender}
              timestamp={msg.timestamp}
              isCurrentUser={msg.senderId === currentUserId}
              avatarColor={getAvatarColor(msg.senderId)}
            />
          ))}
        </div>

        {/* Input Area */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>

      {/* Users Sidebar */}
      <UsersList users={users} currentUserId={currentUserId} />
    </div>
  );
};

export default Index;
