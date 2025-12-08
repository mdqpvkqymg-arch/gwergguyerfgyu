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

const UserItem = ({ user, currentUserId }: { user: User; currentUserId: string }) => (
  <div
    className={cn(
      "flex items-center gap-3 p-2 rounded-xl transition-all duration-300",
      "hover:bg-white/15 cursor-pointer",
      user.id === currentUserId && "bg-white/10"
    )}
  >
    <div className="relative">
      <Avatar className="h-9 w-9 ring-2 ring-white/20">
        <AvatarFallback className={cn("text-sm font-semibold text-white", user.avatarColor)}>
          {user.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {user.isOnline && (
        <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-400 border-2 border-white/30 rounded-full shadow-lg" />
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {user.name}
        {user.id === currentUserId && " (You)"}
      </p>
      <p className="text-xs text-white/50">
        {user.isOnline ? "Online" : "Offline"}
      </p>
    </div>
  </div>
);

const UsersList = ({ users, currentUserId }: UsersListProps) => {
  const onlineUsers = users.filter(u => u.isOnline);
  const offlineUsers = users.filter(u => !u.isOnline);

  return (
    <div className="w-64 backdrop-blur-xl bg-white/10 border-l border-white/20 p-4 hidden lg:block overflow-y-auto relative z-10">
      <h3 className="text-sm font-semibold text-white/90 mb-4 uppercase tracking-wide">
        Online ({onlineUsers.length})
      </h3>
      
      <div className="space-y-2 mb-6">
        {onlineUsers.length > 0 ? (
          onlineUsers.map((user) => (
            <UserItem key={user.id} user={user} currentUserId={currentUserId} />
          ))
        ) : (
          <p className="text-xs text-white/50 italic">No users online</p>
        )}
      </div>

      {offlineUsers.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-white/90 mb-4 uppercase tracking-wide">
            Offline ({offlineUsers.length})
          </h3>
          
          <div className="space-y-2">
            {offlineUsers.map((user) => (
              <UserItem key={user.id} user={user} currentUserId={currentUserId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UsersList;
