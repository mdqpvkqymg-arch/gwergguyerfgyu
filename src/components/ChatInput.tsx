import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  userId: string;
}

const SPAM_CONFIG = {
  cooldownMs: 1000, // 1 second between messages
  maxMessages: 5, // max messages in time window
  timeWindowMs: 10000, // 10 second window
  maxMessageLength: 5000, // max characters per message
};

const ChatInput = ({ onSendMessage, onTyping, onStopTyping, userId }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isCooldown, setIsCooldown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messageTimestamps = useRef<number[]>([]);
  const lastMessage = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload({ bucket: "chat-attachments" });

  const checkSpam = (): boolean => {
    const now = Date.now();
    const trimmedMessage = message.trim();
    
    // Check message length
    if (trimmedMessage.length > SPAM_CONFIG.maxMessageLength) {
      toast.error(`Message too long. Maximum ${SPAM_CONFIG.maxMessageLength} characters.`);
      return true;
    }

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
    if (trimmedMessage.toLowerCase() === lastMessage.current.toLowerCase()) {
      toast.error("Please don't send duplicate messages.");
      return true;
    }

    return false;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedImage) return;
    
    if (isCooldown) {
      toast.error("Please wait before sending another message.");
      return;
    }

    if (message.trim() && checkSpam()) return;

    // Record this message
    messageTimestamps.current.push(Date.now());
    if (message.trim()) {
      lastMessage.current = message.trim().toLowerCase();
    }

    // Start cooldown
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), SPAM_CONFIG.cooldownMs);

    let imageUrl: string | undefined;
    if (selectedImage) {
      const url = await uploadImage(selectedImage, userId);
      if (url) {
        imageUrl = url;
      }
    }

    onStopTyping?.();
    onSendMessage(message.trim() || "📷 Photo", imageUrl);
    setMessage("");
    clearImage();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value) {
      onTyping?.();
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border-t border-white/20">
      {imagePreview && (
        <div className="p-3 border-b border-white/10">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-20 object-cover rounded-lg border border-white/20"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          className="text-white/70 hover:text-white hover:bg-white/10"
          disabled={uploading}
        >
          <Image className="h-5 w-5" />
        </Button>
        <Input
          value={message}
          onChange={handleChange}
          placeholder="Type your message..."
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30 focus-visible:border-white/30"
          maxLength={SPAM_CONFIG.maxMessageLength}
        />
        <Button 
          type="submit" 
          size="icon"
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105"
          disabled={(!message.trim() && !selectedImage) || isCooldown || uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
