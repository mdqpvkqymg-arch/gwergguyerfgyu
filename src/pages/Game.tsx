import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Bomb, Trophy } from "lucide-react";
import ReactionGame from "@/components/games/ReactionGame";
import SnakeGame from "@/components/games/SnakeGame";
import MinesweeperGame from "@/components/games/MinesweeperGame";
import ExternalGameEmbed from "@/components/games/ExternalGameEmbed";
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
          <TabsList className="flex flex-wrap gap-1 h-auto p-2 mb-6">
            <TabsTrigger value="snake" className="text-xs">🐍 Snake</TabsTrigger>
            <TabsTrigger value="minesweeper" className="text-xs"><Bomb className="h-3 w-3 mr-1" />Mines</TabsTrigger>
            <TabsTrigger value="reaction" className="text-xs"><Zap className="h-3 w-3 mr-1" />Reaction</TabsTrigger>
            <TabsTrigger value="kartbros" className="text-xs">🏎️ Kart Bros</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs"><Trophy className="h-3 w-3 mr-1" />Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="snake"><SnakeGame onScoreSubmit={(score) => submitScore("snake", score)} /></TabsContent>
          <TabsContent value="minesweeper"><MinesweeperGame onScoreSubmit={(score) => submitScore("minesweeper", score)} /></TabsContent>
          <TabsContent value="reaction"><ReactionGame onScoreSubmit={(score) => submitScore("reaction", score)} /></TabsContent>
          <TabsContent value="kartbros">
            <ExternalGameEmbed
              src="https://cdn.vietdp.com/file/vietdp-games/games/t52025/kart-bros-io/index.html"
              title="Kart Bros"
              developer="Vietdp Games"
              description="Kart Bros is a fun multiplayer kart racing game. Race against others and become the champion!"
            />
          </TabsContent>
          <TabsContent value="leaderboard"><Leaderboard scores={scores} loading={loading} currentProfileId={currentProfileId} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Game;
