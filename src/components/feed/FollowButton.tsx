import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  profileId: string;
  currentProfileId: string;
  onFollowChange?: () => void;
}

const FollowButton = ({ profileId, currentProfileId, onFollowChange }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [profileId, currentProfileId]);

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentProfileId)
      .eq("following_id", profileId)
      .maybeSingle();

    setIsFollowing(!!data);
    setLoading(false);
  };

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentProfileId)
          .eq("following_id", profileId);
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        await supabase.from("follows").insert({
          follower_id: currentProfileId,
          following_id: profileId,
        });
        setIsFollowing(true);
        toast.success("Following");
      }
      onFollowChange?.();
    } catch (error) {
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  if (profileId === currentProfileId) return null;

  return (
    <Button
      size="sm"
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={loading}
      className={isFollowing 
        ? "border-white/30 text-white hover:bg-white/10" 
        : "bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white"
      }
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
