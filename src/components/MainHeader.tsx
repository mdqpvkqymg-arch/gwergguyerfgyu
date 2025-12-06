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
  Sparkles,
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
    <header className="bg-gradient-to-r from-card via-card to-card/95 border-b border-border px-4 md:px-6 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-11 w-11 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/20">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
              Scalk
              <Sparkles className="h-4 w-4 text-primary hidden md:inline" />
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Real-time Chat</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {showAddMembers && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddMembersClick}
              className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChatClick}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-accent/80 transition-all duration-200"
          >
            <Link to="/game" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-orange-500" />
              <span>Games</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-accent/80 transition-all duration-200"
          >
            <Link to="/ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-500" />
              <span>AI</span>
            </Link>
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-accent/80 transition-all duration-200"
            >
              <Link to="/admin" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-500" />
                <span>Admin</span>
              </Link>
            </Button>
          )}
          <div className="h-6 w-px bg-border mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-muted/80 pl-2 pr-3"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
                  style={{ backgroundColor: avatarColor }}
                >
                  {currentProfileName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xl:inline max-w-[100px] truncate">
                  {currentProfileName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{currentProfileName}</p>
                <p className="text-xs text-muted-foreground">Online</p>
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
            className="h-9 w-9"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                    <Zap className="h-3 w-3 text-green-500" /> Online
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
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
                  <Gamepad2 className="h-4 w-4 mr-2 text-orange-500" />
                  Games
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/ai" className="flex items-center">
                  <Bot className="h-4 w-4 mr-2 text-violet-500" />
                  AI Assistant
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center">
                    <Megaphone className="h-4 w-4 mr-2 text-emerald-500" />
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
