import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  isOnline: boolean;
  avatarColor: string;
}

interface UsersListProps {
  users: User[];
  currentUserId: string;
}

const UsersList = ({ users, currentUserId }: UsersListProps) => {
  return (
    <div className="w-64 bg-sidebar border-l border-sidebar-border p-4 hidden lg:block">
      <h3 className="text-sm font-semibold text-sidebar-foreground mb-4 uppercase tracking-wide">
        Online Users ({users.filter(u => u.isOnline).length})
      </h3>
      
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent cursor-pointer",
              user.id === currentUserId && "bg-sidebar-accent/50"
            )}
          >
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className={cn("text-sm font-semibold", user.avatarColor)}>
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-sidebar rounded-full" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name}
                {user.id === currentUserId && " (You)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
