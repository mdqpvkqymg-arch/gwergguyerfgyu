import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MessageCircle, Users, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  members: Array<{
    profile_id: string;
    profiles: {
      display_name: string;
      avatar_color: string;
    };
  }>;
}

interface ConversationsListProps {
  conversations: Conversation[];
  currentProfileId: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => Promise<boolean>;
  unreadCounts?: Record<string, number>;
}

const ConversationsList = ({
  conversations,
  currentProfileId,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  unreadCounts = {},
}: ConversationsListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleDeleteClick = (convId: string) => {
    setConversationToDelete(convId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (conversationToDelete) {
      await onDeleteConversation(conversationToDelete);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const getConversationDisplay = (conv: Conversation) => {
    if (conv.is_group) {
      return {
        name: conv.name || "Group Chat",
        avatarText: conv.name?.substring(0, 2).toUpperCase() || "GC",
        color: "bg-purple-500",
      };
    }

    const otherMember = conv.members.find(
      (m) => m.profile_id !== currentProfileId
    );
    if (!otherMember) {
      return { name: "Unknown", avatarText: "??", color: "bg-gray-500" };
    }

    return {
      name: otherMember.profiles.display_name,
      avatarText: otherMember.profiles.display_name.substring(0, 2).toUpperCase(),
      color: otherMember.profiles.avatar_color,
    };
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h3 className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wide">
          Conversations
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conv) => {
          const display = getConversationDisplay(conv);
          return (
            <ContextMenu key={conv.id}>
              <ContextMenuTrigger>
                <div
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-sidebar-accent",
                    selectedConversationId === conv.id && "bg-sidebar-accent"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={cn("text-sm font-semibold text-white", display.color)}>
                      {display.avatarText}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {display.name}
                      </p>
                      {conv.is_group && <Users className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {conv.members.length} member{conv.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {unreadCounts[conv.id] > 0 && (
                    <div className="flex-shrink-0 min-w-5 h-5 px-1.5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-foreground">
                        {unreadCounts[conv.id] > 99 ? "99+" : unreadCounts[conv.id]}
                      </span>
                    </div>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => handleDeleteClick(conv.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete conversation
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        {conversations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new conversation to get started</p>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages for everyone. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConversationsList;
