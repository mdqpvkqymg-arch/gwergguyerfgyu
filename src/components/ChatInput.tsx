import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

const SPAM_CONFIG = {
  cooldownMs: 1000, // 1 second between messages
  maxMessages: 5, // max messages in time window
  timeWindowMs: 10000, // 10 second window
};

const ChatInput = ({ onSendMessage, onTyping, onStopTyping }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isCooldown, setIsCooldown] = useState(false);
  const messageTimestamps = useRef<number[]>([]);
  const lastMessage = useRef<string>("");

  const checkSpam = (): boolean => {
    const now = Date.now();
    
    // Remove old timestamps outside the time window
    messageTimestamps.current = messageTimestamps.current.filter(
      (ts) => now - ts < SPAM_CONFIG.timeWindowMs
    );

    // Check if too many messages in time window
    if (messageTimestamps.current.length >= SPAM_CONFIG.maxMessages) {
      toast.error("Slow down! You're sending messages too fast.");
      return true;
    }

    // Check for duplicate consecutive messages
    if (message.trim().toLowerCase() === lastMessage.current.toLowerCase()) {
      toast.error("Please don't send duplicate messages.");
      return true;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    if (isCooldown) {
      toast.error("Please wait before sending another message.");
      return;
    }

    if (checkSpam()) return;

    // Record this message
    messageTimestamps.current.push(Date.now());
    lastMessage.current = message.trim().toLowerCase();

    // Start cooldown
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), SPAM_CONFIG.cooldownMs);

    onStopTyping?.();
    onSendMessage(message);
    setMessage("");
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
        disabled={!message.trim() || isCooldown}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ChatInput;
