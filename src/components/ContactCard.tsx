import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface ContactCardProps {
  id: string;
  name: string;
  avatarColor: string;
  isOnline?: boolean;
  isImportant?: boolean;
  onToggleImportant?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

const ContactCard = ({
  name,
  avatarColor,
  isOnline,
  isImportant,
  onToggleImportant,
  onClick,
  compact = false,
}: ContactCardProps) => {
  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      >
        <div className="relative">
          <Avatar className="h-14 w-14 ring-2 ring-background shadow-md">
            <AvatarFallback
              style={{ backgroundColor: avatarColor }}
              className="text-white font-bold text-lg"
            >
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground truncate max-w-full text-center">
          {name}
        </span>
        {onToggleImportant && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleImportant();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star
              className={cn(
                "h-4 w-4 transition-colors",
                isImportant
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground hover:text-yellow-400"
              )}
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="relative">
        <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
          <AvatarFallback
            style={{ backgroundColor: avatarColor }}
            className="text-white font-semibold"
          >
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-card rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{name}</p>
        <p className="text-sm text-muted-foreground">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
      {onToggleImportant && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleImportant();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-accent rounded-full"
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              isImportant
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            )}
          />
        </button>
      )}
    </div>
  );
};

export default ContactCard;
