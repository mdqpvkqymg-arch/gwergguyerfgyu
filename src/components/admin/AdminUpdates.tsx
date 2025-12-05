import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useUpdates, Update } from "@/hooks/useUpdates";
import { formatDistanceToNow } from "date-fns";

export const AdminUpdates = () => {
  const { updates, loading, refetch } = useUpdates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase.from("updates").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
    });

    if (error) {
      toast.error("Failed to create update");
      return;
    }

    toast.success("Update created!");
    setNewTitle("");
    setNewContent("");
    setIsCreating(false);
    refetch();
  };

  const handleEdit = (update: Update) => {
    setEditingId(update.id);
    setEditTitle(update.title);
    setEditContent(update.content);
  };

  const handleSave = async () => {
    if (!editingId || !editTitle.trim() || !editContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const { error } = await supabase
      .from("updates")
      .update({ title: editTitle.trim(), content: editContent.trim() })
      .eq("id", editingId);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    toast.success("Update saved!");
    setEditingId(null);
    refetch();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("updates").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      return;
    }

    toast.success("Update deleted!");
    refetch();
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading updates...</p>;
  }

  return (
    <div className="space-y-4">
      {isCreating ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">New Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Save className="h-4 w-4 mr-2" />
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Update
        </Button>
      )}

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-4 pr-4">
          {updates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No updates yet. Create your first one!
            </p>
          ) : (
            updates.map((update) => (
              <Card key={update.id}>
                <CardContent className="pt-6">
                  {editingId === update.id ? (
                    <div className="space-y-4">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{update.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(update.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(update)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(update.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {update.content}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
