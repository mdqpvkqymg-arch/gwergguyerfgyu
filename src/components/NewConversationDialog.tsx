import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Profile[];
  currentProfileId: string;
  onCreateConversation: (memberIds: string[], isGroup: boolean, name?: string) => void;
}

const NewConversationDialog = ({
  open,
  onOpenChange,
  profiles,
  currentProfileId,
  onCreateConversation,
}: NewConversationDialogProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const otherProfiles = profiles.filter((p) => p.id !== currentProfileId);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return otherProfiles;
    return otherProfiles.filter((p) =>
      p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [otherProfiles, searchQuery]);

  const toggleMember = (profileId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleCreate = () => {
    if (selectedMembers.length === 0) return;

    const shouldBeGroup = selectedMembers.length > 1 || isGroup;
    onCreateConversation(selectedMembers, shouldBeGroup, groupName || undefined);
    
    // Reset form
    setSelectedMembers([]);
    setGroupName("");
    setIsGroup(false);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {selectedMembers.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name (Optional)</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Select People</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people..."
                className="pl-9"
              />
            </div>
            <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => toggleMember(profile.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                    "hover:bg-accent",
                    selectedMembers.includes(profile.id) && "bg-accent"
                  )}
                >
                  <Checkbox
                    checked={selectedMembers.includes(profile.id)}
                    onCheckedChange={() => toggleMember(profile.id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn("text-xs font-semibold", profile.avatar_color)}>
                      {profile.display_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{profile.display_name}</span>
                </div>
              ))}

              {filteredProfiles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? "No matching users found" : "No other users available"}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={selectedMembers.length === 0}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
