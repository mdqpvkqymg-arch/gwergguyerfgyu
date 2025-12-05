import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import { useUpdates } from "@/hooks/useUpdates";
import { formatDistanceToNow } from "date-fns";

const LAST_SEEN_KEY = "scalk_updates_last_seen";

export const UpdatesDialog = () => {
  const { updates, loading } = useUpdates();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || updates.length === 0) return;

    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    const latestUpdate = updates[0]?.created_at;

    // Show dialog if there are new updates since last visit
    if (!lastSeen || (latestUpdate && new Date(latestUpdate) > new Date(lastSeen))) {
      setOpen(true);
    }
  }, [loading, updates]);

  const handleClose = () => {
    setOpen(false);
    // Save current time as last seen
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
  };

  if (loading || updates.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            What's New in Scalk
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="border-b border-border pb-4 last:border-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{update.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {update.content}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
