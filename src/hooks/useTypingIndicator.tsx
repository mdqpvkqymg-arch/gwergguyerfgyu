import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingUser {
  profileId: string;
  displayName: string;
}

export const useTypingIndicator = (
  conversationId: string | null,
  currentProfileId: string | null,
  currentDisplayName: string
) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId || !currentProfileId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const { profileId, displayName, isTyping } = payload.payload;
        
        if (profileId === currentProfileId) return;

        setTypingUsers((current) => {
          if (isTyping) {
            if (!current.some((u) => u.profileId === profileId)) {
              return [...current, { profileId, displayName }];
            }
            return current;
          } else {
            return current.filter((u) => u.profileId !== profileId);
          }
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, currentProfileId]);

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !currentProfileId) return;

      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          profileId: currentProfileId,
          displayName: currentDisplayName,
          isTyping,
        },
      });
    },
    [currentProfileId, currentDisplayName]
  );

  const handleTyping = useCallback(() => {
    sendTypingIndicator(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  }, [sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(false);
  }, [sendTypingIndicator]);

  return { typingUsers, handleTyping, stopTyping };
};
