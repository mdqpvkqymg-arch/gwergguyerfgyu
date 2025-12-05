import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  typingUsers: Array<{ profileId: string; displayName: string }>;
}

const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName} is typing`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`;
    }
    return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`;
  };

  return (
    <div className="flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span
          className={cn(
            "w-2 h-2 bg-primary rounded-full animate-bounce",
            "[animation-delay:0ms]"
          )}
        />
        <span
          className={cn(
            "w-2 h-2 bg-primary rounded-full animate-bounce",
            "[animation-delay:150ms]"
          )}
        />
        <span
          className={cn(
            "w-2 h-2 bg-primary rounded-full animate-bounce",
            "[animation-delay:300ms]"
          )}
        />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator;
