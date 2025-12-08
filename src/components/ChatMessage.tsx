import { memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  sender: string;
  timestamp: string;
  isCurrentUser?: boolean;
  avatarColor: string;
}

const ChatMessage = memo(({ message, sender, timestamp, isCurrentUser, avatarColor }: ChatMessageProps) => {
  return (
    <div className={cn("flex gap-3 mb-4", isCurrentUser && "flex-row-reverse")}>
      <Avatar className={cn("h-10 w-10 ring-2 ring-white/20")}>
        <AvatarFallback className={cn("font-semibold text-white", avatarColor)}>
          {sender.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex flex-col max-w-[70%] min-w-0", isCurrentUser && "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{sender}</span>
          <span className="text-xs text-white/50">{timestamp}</span>
        </div>
        
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl shadow-lg overflow-hidden backdrop-blur-md transition-all duration-200",
            isCurrentUser
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-sm"
              : "bg-white/20 text-white border border-white/20 rounded-bl-sm"
          )}
        >
          <p className="text-sm leading-relaxed break-all whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
