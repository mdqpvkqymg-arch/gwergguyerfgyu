import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useUpdates, Update } from "@/hooks/useUpdates";
import { formatDistanceToNow } from "date-fns";

const Admin = () => {
  const navigate = useNavigate();
  const { updates, loading, refetch } = useUpdates();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.display_name?.toLowerCase() === "mike") {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admin only.");
        navigate("/");
      }
      setCheckingAuth(false);
    };

    checkAdmin();
  }, [navigate]);

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

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Manage Updates</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {/* Create New Update */}
        {isCreating ? (
          <Card className="mb-6">
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
          <Button onClick={() => setIsCreating(true)} className="mb-6">
            <Plus className="h-4 w-4 mr-2" />
            New Update
          </Button>
        )}

        {/* Updates List */}
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4">
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
    </div>
  );
};

export default Admin;
