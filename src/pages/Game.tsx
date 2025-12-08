import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Bomb, Trophy } from "lucide-react";
import ReactionGame from "@/components/games/ReactionGame";
import SnakeGame from "@/components/games/SnakeGame";
import MinesweeperGame from "@/components/games/MinesweeperGame";
import TetrisGame from "@/components/games/TetrisGame";
import PacmanGame from "@/components/games/PacmanGame";
import BounceGame from "@/components/games/BounceGame";
import PuzzleGame from "@/components/games/PuzzleGame";
import SpiderGame from "@/components/games/SpiderGame";
import DefenderGame from "@/components/games/DefenderGame";
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
            <TabsTrigger value="tetris" className="text-xs">🎮 Tetris</TabsTrigger>
            <TabsTrigger value="pacman" className="text-xs">👻 Pacman</TabsTrigger>
            <TabsTrigger value="bounce" className="text-xs">🏓 Bounce</TabsTrigger>
            <TabsTrigger value="minesweeper" className="text-xs"><Bomb className="h-3 w-3 mr-1" />Mines</TabsTrigger>
            <TabsTrigger value="puzzle" className="text-xs">🧩 Puzzle</TabsTrigger>
            <TabsTrigger value="spider" className="text-xs">🕷️ Spider</TabsTrigger>
            <TabsTrigger value="defender" className="text-xs">🚀 Defender</TabsTrigger>
            <TabsTrigger value="reaction" className="text-xs"><Zap className="h-3 w-3 mr-1" />Reaction</TabsTrigger>
            <TabsTrigger value="golforbit" className="text-xs">⛳ Golf Orbit</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs"><Trophy className="h-3 w-3 mr-1" />Scores</TabsTrigger>
          </TabsList>

          <TabsContent value="snake"><SnakeGame onScoreSubmit={(score) => submitScore("snake", score)} /></TabsContent>
          <TabsContent value="tetris"><TetrisGame onScoreSubmit={(score) => submitScore("tetris", score)} /></TabsContent>
          <TabsContent value="pacman"><PacmanGame onScoreSubmit={(score) => submitScore("pacman", score)} /></TabsContent>
          <TabsContent value="bounce"><BounceGame onScoreSubmit={(score) => submitScore("bounce", score)} /></TabsContent>
          <TabsContent value="minesweeper"><MinesweeperGame onScoreSubmit={(score) => submitScore("minesweeper", score)} /></TabsContent>
          <TabsContent value="puzzle"><PuzzleGame onScoreSubmit={(score) => submitScore("puzzle", score)} /></TabsContent>
          <TabsContent value="spider"><SpiderGame onScoreSubmit={(score) => submitScore("spider", score)} /></TabsContent>
          <TabsContent value="defender"><DefenderGame onScoreSubmit={(score) => submitScore("defender", score)} /></TabsContent>
          <TabsContent value="reaction"><ReactionGame onScoreSubmit={(score) => submitScore("reaction", score)} /></TabsContent>
          <TabsContent value="golforbit">
            <ExternalGameEmbed
              src="https://pizzaedition.win/assets/mainstorage/golforbit.html"
              title="Golf Orbit"
              developer="Creator"
              description="Golf Orbit is an arcade-style golf game that focuses on hitting the ball as far as possible rather than playing on traditional courses. Each swing sends the ball soaring over landscapes, earning money based on distance and collectibles picked up mid-flight."
              thumbnail="https://pizzaedition.win/images/games/golforbit-min.jpg"
            />
          </TabsContent>
          <TabsContent value="leaderboard"><Leaderboard scores={scores} loading={loading} currentProfileId={currentProfileId} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Game;
