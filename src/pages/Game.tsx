import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Bomb, Trophy, Home, Gamepad2 } from "lucide-react";
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
    <div className="min-h-screen home-gradient relative overflow-hidden">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-emerald-400/30 top-[-10%] left-[-10%] pointer-events-none" style={{ animationDelay: "0s" }} />
      <div className="orb w-80 h-80 bg-cyan-400/30 top-[50%] right-[-5%] pointer-events-none" style={{ animationDelay: "5s" }} />
      <div className="orb w-64 h-64 bg-teal-400/30 bottom-[-10%] left-[30%] pointer-events-none" style={{ animationDelay: "10s" }} />

      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border-b border-white/20 p-4 relative z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl blur-md opacity-50" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg border border-white/30">
                <Gamepad2 className="h-5 w-5 text-white drop-shadow-md" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Games</h1>
              <p className="text-xs text-white/60 font-medium">Play & Compete</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="snake" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-2 mb-6 backdrop-blur-xl bg-white/10 border border-white/20">
              <TabsTrigger value="snake" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">🐍 Snake</TabsTrigger>
              <TabsTrigger value="minesweeper" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white"><Bomb className="h-3 w-3 mr-1" />Mines</TabsTrigger>
              <TabsTrigger value="reaction" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white"><Zap className="h-3 w-3 mr-1" />Reaction</TabsTrigger>
              <TabsTrigger value="kartbros" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">🏎️ Kart Bros</TabsTrigger>
              <TabsTrigger value="racinglimits" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">🏁 Racing Limits</TabsTrigger>
              <TabsTrigger value="ageofwar" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white">⚔️ Age of War</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white"><Trophy className="h-3 w-3 mr-1" />Scores</TabsTrigger>
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
            <TabsContent value="racinglimits">
              <ExternalGameEmbed
                src="https://cdn.vietdp.com/file/vietdp-games/games/t52025/racing-limits/index.html"
                title="Racing Limits"
                developer="Vietdp Games"
                description="Test your racing prowess to the limit! Race through urban and highway traffic with realistic physics, precise controls, and multiple camera views."
              />
            </TabsContent>
            <TabsContent value="ageofwar">
              <ExternalGameEmbed
                src="https://masonsunblockedgames.github.io/MasonsUnblockedGames/ageofwar.html"
                title="Age of War"
                developer="Louissi"
                description="A classic strategy game where you evolve through ages, build units, and destroy the enemy base before they destroy yours!"
              />
            </TabsContent>
            <TabsContent value="leaderboard"><Leaderboard scores={scores} loading={loading} currentProfileId={currentProfileId} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Game;
