import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string;
  avatar_color: string;
}

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: Profile[];
  existingMemberIds: string[];
  onAddMembers: (memberIds: string[]) => void;
}

const AddMembersDialog = ({
  open,
  onOpenChange,
  profiles,
  existingMemberIds,
  onAddMembers,
}: AddMembersDialogProps) => {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const availableProfiles = profiles.filter(
    (p) => !existingMemberIds.includes(p.id)
  );

  const toggleMember = (profileId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleAdd = () => {
    if (selectedMembers.length > 0) {
      onAddMembers(selectedMembers);
      setSelectedMembers([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {availableProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No more users available to add
            </p>
          ) : (
            availableProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => toggleMember(profile.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-accent",
                  selectedMembers.includes(profile.id) && "bg-accent"
                )}
              >
                <Checkbox
                  checked={selectedMembers.includes(profile.id)}
                  onCheckedChange={() => toggleMember(profile.id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    style={{ backgroundColor: profile.avatar_color }}
                    className="text-white text-xs font-semibold"
                  >
                    {profile.display_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{profile.display_name}</span>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedMembers.length === 0}>
            Add ({selectedMembers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMembersDialog;
