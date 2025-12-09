import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_color: string;
    avatar_url: string | null;
  };
}

interface PostCommentsProps {
  postId: string;
  currentProfileId: string;
  onRefresh: () => void;
}

const PostComments = ({ postId, currentProfileId, onRefresh }: PostCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*, profiles(display_name, avatar_color, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        profile_id: currentProfileId,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      onRefresh();
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
      if (error) throw error;
      fetchComments();
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="border-t border-white/10">
      {/* Comments list */}
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-white/50 text-sm py-4">No comments yet</p>
        ) : (
          <div className="p-4 space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {comment.profiles.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt={comment.profiles.display_name} className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback style={{ backgroundColor: comment.profiles.avatar_color }} className="text-white text-xs font-semibold">
                      {comment.profiles.display_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{comment.profiles.display_name}</span>
                    <span className="text-xs text-white/40">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 break-words">{comment.content}</p>
                </div>
                {comment.profile_id === currentProfileId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/50 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-white/10">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          maxLength={1000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || submitting}
          className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default PostComments;
