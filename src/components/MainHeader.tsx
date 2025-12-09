import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Plus,
  UserPlus,
  Gamepad2,
  Bot,
  Megaphone,
  LogOut,
  Menu,
  Home,
  Zap,
} from "lucide-react";

interface MainHeaderProps {
  currentProfileName: string;
  avatarColor: string;
  showAddMembers: boolean;
  onAddMembersClick: () => void;
  onNewChatClick: () => void;
  onLogout: () => void;
}

export const MainHeader = ({
  currentProfileName,
  avatarColor,
  showAddMembers,
  onAddMembersClick,
  onNewChatClick,
  onLogout,
}: MainHeaderProps) => {
  const isAdmin = currentProfileName.toLowerCase() === "mike";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 px-4 md:px-6 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Link to="/" className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl blur-md opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="relative h-11 w-11 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg border border-white/30 transition-all duration-300 group-hover:scale-105">
              <span className="text-xl font-black text-white drop-shadow-md">S</span>
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white/50 animate-pulse shadow-lg shadow-emerald-400/50" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              Scalk
            </h1>
            <p className="text-xs text-white/60 hidden sm:block font-medium">Real-time Chat</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          {showAddMembers && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddMembersClick}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChatClick}
            className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <div className="h-6 w-px bg-white/20 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Link to="/game" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-emerald-300" />
              <span>Games</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <Link to="/ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-300" />
              <span>AI</span>
            </Link>
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Link to="/admin" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-rose-300" />
                <span>Admin</span>
              </Link>
            </Button>
          )}
          <div className="h-6 w-px bg-white/20 mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-white hover:bg-white/10 pl-2 pr-3"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner ring-2 ring-white/20"
                  style={{ backgroundColor: avatarColor }}
                >
                  {currentProfileName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xl:inline max-w-[100px] truncate text-white/90">
                  {currentProfileName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 backdrop-blur-xl bg-white/90 border-white/30">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{currentProfileName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3 text-emerald-500" /> Online
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChatClick}
            className="h-9 w-9 text-white hover:bg-white/10"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white/90 border-white/30">
              <div className="px-2 py-2 flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {currentProfileName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{currentProfileName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-500" /> Online
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </DropdownMenuItem>
              {showAddMembers && (
                <DropdownMenuItem onClick={onAddMembersClick}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Members
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onNewChatClick}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/game" className="flex items-center">
                  <Gamepad2 className="h-4 w-4 mr-2 text-emerald-500" />
                  Games
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/ai" className="flex items-center">
                  <Bot className="h-4 w-4 mr-2 text-purple-500" />
                  AI Assistant
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center">
                    <Megaphone className="h-4 w-4 mr-2 text-rose-500" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
