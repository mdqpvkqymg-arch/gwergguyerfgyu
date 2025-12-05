import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

const ChatInput = ({ onSendMessage, onTyping, onStopTyping }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onStopTyping?.();
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value) {
      onTyping?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 bg-card border-t border-border">
      <Input
        value={message}
        onChange={handleChange}
        placeholder="Type your message..."
        className="flex-1 bg-background border-input focus-visible:ring-primary"
      />
      <Button 
        type="submit" 
        size="icon"
        className="bg-primary hover:bg-primary/90 transition-all duration-200"
        disabled={!message.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;
