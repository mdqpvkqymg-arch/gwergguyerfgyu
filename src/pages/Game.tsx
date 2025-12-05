import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Bomb, Trophy } from "lucide-react";
import ReactionGame from "@/components/games/ReactionGame";
import SnakeGame from "@/components/games/SnakeGame";
import MinesweeperGame from "@/components/games/MinesweeperGame";
import Leaderboard from "@/components/games/Leaderboard";
import { useGameScores } from "@/hooks/useGameScores";
import { supabase } from "@/integrations/supabase/client";

const Game = () => {
  const navigate = useNavigate();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const { scores, loading, submitScore } = useGameScores(currentProfileId);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (profile) {
          setCurrentProfileId(profile.id);
        }
      }
    };
    
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>

        <Tabs defaultValue="snake" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="snake" className="flex items-center gap-1 text-xs sm:text-sm">
              🐍 <span className="hidden sm:inline">Snake</span>
            </TabsTrigger>
            <TabsTrigger value="minesweeper" className="flex items-center gap-1 text-xs sm:text-sm">
              <Bomb className="h-4 w-4" />
              <span className="hidden sm:inline">Mines</span>
            </TabsTrigger>
            <TabsTrigger value="reaction" className="flex items-center gap-1 text-xs sm:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Reaction</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-1 text-xs sm:text-sm">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Scores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snake">
            <SnakeGame onScoreSubmit={(score) => submitScore("snake", score)} />
          </TabsContent>

          <TabsContent value="minesweeper">
            <MinesweeperGame onScoreSubmit={(score) => submitScore("minesweeper", score)} />
          </TabsContent>

          <TabsContent value="reaction">
            <ReactionGame onScoreSubmit={(score) => submitScore("reaction", score)} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard 
              scores={scores} 
              loading={loading} 
              currentProfileId={currentProfileId} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Game;
