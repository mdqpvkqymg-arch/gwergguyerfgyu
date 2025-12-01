import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface OnlineUser {
  id: string;
  name: string;
  isOnline: boolean;
  avatarColor: string;
}

export const usePresence = (currentProfileId: string | null, displayName: string, avatarColor: string) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!currentProfileId) return;

    const channel: RealtimeChannel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            users.push({
              id: presence.profile_id,
              name: presence.display_name,
              isOnline: true,
              avatarColor: presence.avatar_color,
            });
          });
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            profile_id: currentProfileId,
            display_name: displayName,
            avatar_color: avatarColor,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentProfileId, displayName, avatarColor]);

  return onlineUsers;
};
