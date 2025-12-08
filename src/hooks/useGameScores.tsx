import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type GameType = "snake" | "minesweeper" | "reaction" | "tetris" | "pacman" | "bounce" | "puzzle" | "spider" | "defender";

interface GameScore {
  id: string;
  profile_id: string;
  game_type: GameType;
  score: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_color: string;
  };
}

export const useGameScores = (currentProfileId: string | null) => {
  const [scores, setScores] = useState<Record<GameType, GameScore[]>>({
    snake: [],
    minesweeper: [],
    reaction: [],
    tetris: [],
    pacman: [],
    bounce: [],
    puzzle: [],
    spider: [],
    defender: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    // Get scores from the last 7 days only (weekly leaderboard)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from("game_scores")
      .select(`
        *,
        profiles(display_name, avatar_color)
      `)
      .gte("created_at", oneWeekAgo.toISOString())
      .order("score", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching scores:", error);
      return;
    }

    const grouped: Record<GameType, GameScore[]> = {
      snake: [],
      minesweeper: [],
      reaction: [],
      tetris: [],
      pacman: [],
      bounce: [],
      puzzle: [],
      spider: [],
      defender: [],
    };

    (data || []).forEach((score: any) => {
      const gameType = score.game_type as GameType;
      if (grouped[gameType]) {
        // For reaction, lower is better, so we'll handle sorting differently
        grouped[gameType].push(score);
      }
    });

    // Sort reaction scores ascending (lower is better)
    grouped.reaction.sort((a, b) => a.score - b.score);
    // Keep only top 10 for each game
    Object.keys(grouped).forEach(key => {
      grouped[key as GameType] = grouped[key as GameType].slice(0, 10);
    });

    setScores(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchScores();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("game_scores_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_scores",
        },
        () => {
          fetchScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScores]);

  const submitScore = useCallback(async (gameType: GameType, score: number) => {
    if (!currentProfileId) return false;

    const { error } = await supabase.from("game_scores").insert({
      profile_id: currentProfileId,
      game_type: gameType,
      score,
    });

    if (error) {
      console.error("Error submitting score:", error);
      return false;
    }

    return true;
  }, [currentProfileId]);

  return { scores, loading, submitScore, refetch: fetchScores };
};
