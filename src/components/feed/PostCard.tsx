import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import PostComments from "./PostComments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  profile_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: "image" | "video" | "external_video" | null;
  external_video_url: string | null;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_color: string;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  user_liked: boolean;
}

interface PostCardProps {
  post: Post;
  currentProfileId: string;
  onRefresh: () => void;
}

const getEmbedUrl = (url: string): string | null => {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // TikTok - return original URL for blockquote embed
  if (url.includes("tiktok.com")) {
    return url;
  }

  return null;
};

const PostCard = ({ post, currentProfileId, onRefresh }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    try {
      if (post.user_liked) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("profile_id", currentProfileId);
      } else {
        await supabase.from("post_likes").insert({
          post_id: post.id,
          profile_id: currentProfileId,
        });
      }
      onRefresh();
    } catch (error) {
      toast.error("Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      toast.success("Post deleted");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  const embedUrl = post.external_video_url ? getEmbedUrl(post.external_video_url) : null;
  const isTikTok = post.external_video_url?.includes("tiktok.com");

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            {post.profiles.avatar_url ? (
              <img src={post.profiles.avatar_url} alt={post.profiles.display_name} className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback style={{ backgroundColor: post.profiles.avatar_color }} className="text-white font-semibold">
                {post.profiles.display_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="font-semibold text-white">{post.profiles.display_name}</p>
            <p className="text-xs text-white/50">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {post.profile_id === currentProfileId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-white/20">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Media */}
      {post.media_type === "image" && post.media_url && (
        <div className="relative">
          <img
            src={post.media_url}
            alt="Post"
            className="w-full max-h-[600px] object-cover"
          />
        </div>
      )}

      {post.media_type === "video" && post.media_url && (
        <div className="relative">
          <video
            src={post.media_url}
            controls
            className="w-full max-h-[600px] object-contain bg-black"
          />
        </div>
      )}

      {post.media_type === "external_video" && embedUrl && !isTikTok && (
        <div className="relative aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {post.media_type === "external_video" && isTikTok && post.external_video_url && (
        <div className="p-4">
          <a
            href={post.external_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline text-sm"
          >
            View TikTok video
          </a>
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-3">
          <p className="text-white whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-white/10">
        <button
          onClick={handleLike}
          disabled={liking}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <Heart
            className={`h-6 w-6 transition-all ${post.user_liked ? "fill-pink-500 text-pink-500 scale-110" : ""}`}
          />
          <span className="text-sm font-medium">{post.likes_count}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-sm font-medium">{post.comments_count}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <PostComments
          postId={post.id}
          currentProfileId={currentProfileId}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default PostCard;
