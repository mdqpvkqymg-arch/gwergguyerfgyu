import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChatInputProps {
  onSendMessage: (message: string, mediaUrl?: string, mediaType?: "image" | "video") => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  userId: string;
}

const SPAM_CONFIG = {
  cooldownMs: 1000,
  maxMessages: 5,
  timeWindowMs: 10000,
  maxMessageLength: 5000,
};

const ChatInput = ({ onSendMessage, onTyping, onStopTyping, userId }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isCooldown, setIsCooldown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const messageTimestamps = useRef<number[]>([]);
  const lastMessage = useRef<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkSpam = (): boolean => {
    const now = Date.now();
    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > SPAM_CONFIG.maxMessageLength) {
      toast.error(`Message too long. Maximum ${SPAM_CONFIG.maxMessageLength} characters.`);
      return true;
    }

    messageTimestamps.current = messageTimestamps.current.filter(
      (ts) => now - ts < SPAM_CONFIG.timeWindowMs
    );

    if (messageTimestamps.current.length >= SPAM_CONFIG.maxMessages) {
      toast.error("Slow down! You're sending messages too fast.");
      return true;
    }

    if (trimmedMessage.toLowerCase() === lastMessage.current.toLowerCase()) {
      toast.error("Please don't send duplicate messages.");
      return true;
    }

    return false;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    const maxSize = isVideo ? 50 : 5; // 50MB for video, 5MB for images
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File must be less than ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setFileType(isImage ? "image" : "video");
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;
    
    if (isCooldown) {
      toast.error("Please wait before sending another message.");
      return;
    }

    if (message.trim() && checkSpam()) return;

    messageTimestamps.current.push(Date.now());
    if (message.trim()) {
      lastMessage.current = message.trim().toLowerCase();
    }

    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), SPAM_CONFIG.cooldownMs);

    let mediaUrl: string | undefined;
    let mediaType: "image" | "video" | undefined;
    
    if (selectedFile && fileType) {
      setUploading(true);
      const url = await uploadFile(selectedFile);
      setUploading(false);
      if (url) {
        mediaUrl = url;
        mediaType = fileType;
      }
    }

    onStopTyping?.();
    const displayMessage = message.trim() || (fileType === "video" ? "🎥 Video" : "📷 Photo");
    onSendMessage(displayMessage, mediaUrl, mediaType);
    setMessage("");
    clearFile();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value) {
      onTyping?.();
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border-t border-white/20">
      {filePreview && (
        <div className="p-3 border-b border-white/10">
          <div className="relative inline-block">
            {fileType === "image" ? (
              <img
                src={filePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg border border-white/20"
              />
            ) : (
              <video
                src={filePreview}
                className="h-20 w-20 object-cover rounded-lg border border-white/20"
              />
            )}
            <button
              type="button"
              onClick={clearFile}
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
          accept="image/*,video/*"
          onChange={handleFileSelect}
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
          <Paperclip className="h-5 w-5" />
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
          disabled={(!message.trim() && !selectedFile) || isCooldown || uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
