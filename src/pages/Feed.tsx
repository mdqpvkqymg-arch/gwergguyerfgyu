import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/feed/PostCard";
import CreatePostDialog from "@/components/feed/CreatePostDialog";

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

const Feed = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setCurrentProfileId(profile.id);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPosts = async () => {
    if (!currentProfileId) return;

    const { data: postsData, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles(display_name, avatar_color, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    // Fetch likes and comments counts
    const postsWithCounts = await Promise.all(
      (postsData || []).map(async (post) => {
        const [likesResult, commentsResult, userLikeResult] = await Promise.all([
          supabase.from("post_likes").select("id", { count: "exact" }).eq("post_id", post.id),
          supabase.from("post_comments").select("id", { count: "exact" }).eq("post_id", post.id),
          supabase.from("post_likes").select("id").eq("post_id", post.id).eq("profile_id", currentProfileId).maybeSingle(),
        ]);

        return {
          ...post,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0,
          user_liked: !!userLikeResult.data,
        } as Post;
      })
    );

    // Weighted random shuffle based on engagement
    const shuffledPosts = weightedRandomShuffle(postsWithCounts);
    setPosts(shuffledPosts);
    setLoading(false);
  };

  // Weighted random shuffle - higher engagement = higher chance to appear earlier
  const weightedRandomShuffle = (posts: Post[]): Post[] => {
    if (posts.length === 0) return [];
    
    const result: Post[] = [];
    const remaining = [...posts];
    
    while (remaining.length > 0) {
      // Calculate weights based on engagement (likes + comments + 1 to avoid zero weight)
      const weights = remaining.map(post => post.likes_count + post.comments_count + 1);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      // Pick a random post based on weights
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;
      
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }
      
      result.push(remaining[selectedIndex]);
      remaining.splice(selectedIndex, 1);
    }
    
    return result;
  };

  useEffect(() => {
    if (currentProfileId) {
      fetchPosts();
    }
  }, [currentProfileId]);

  // Realtime subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          fetchPosts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_likes" },
        () => {
          fetchPosts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProfileId]);

  if (!user || !currentProfileId) {
    return null;
  }

  return (
    <div className="min-h-screen home-gradient relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-pink-300/30 top-[-10%] left-[-10%]" style={{ animationDelay: "0s" }} />
      <div className="orb w-80 h-80 bg-orange-400/30 top-[50%] right-[-5%]" style={{ animationDelay: "5s" }} />
      <div className="orb w-64 h-64 bg-rose-400/30 bottom-[-10%] left-[30%]" style={{ animationDelay: "10s" }} />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Home className="w-5 h-5 text-white" />
            </button>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500">
                <span className="text-xl font-bold text-white">Feed</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Post
          </Button>
        </div>
      </header>

      {/* Feed content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus className="w-10 h-10 text-white/70" />
            </div>
            <p className="text-lg font-medium text-white">No posts yet</p>
            <p className="text-sm mt-2 text-white/60">Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentProfileId={currentProfileId}
              onRefresh={fetchPosts}
            />
          ))
        )}
      </main>

      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        currentProfileId={currentProfileId}
        userId={user.id}
        onPostCreated={fetchPosts}
      />
    </div>
  );
};

export default Feed;
