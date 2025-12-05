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
      <Avatar className={cn("h-10 w-10 border-2", `border-${avatarColor}`)}>
        <AvatarFallback className={cn("font-semibold", avatarColor)}>
          {sender.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex flex-col max-w-[70%] min-w-0", isCurrentUser && "items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{sender}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl shadow-sm overflow-hidden",
            isCurrentUser
              ? "bg-chat-bubble-user text-primary-foreground rounded-br-sm"
              : "bg-chat-bubble-other text-card-foreground border border-border rounded-bl-sm"
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
