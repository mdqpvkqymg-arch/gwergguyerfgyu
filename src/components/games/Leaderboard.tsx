import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type GameType = "snake" | "minesweeper" | "reaction";

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

interface LeaderboardProps {
  scores: Record<GameType, GameScore[]>;
  loading: boolean;
  currentProfileId: string | null;
}

const getMedalColor = (rank: number) => {
  switch (rank) {
    case 0: return "text-yellow-400";
    case 1: return "text-gray-300";
    case 2: return "text-amber-500";
    default: return "text-white/50";
  }
};

const ScoreList = ({ 
  scores, 
  currentProfileId,
  formatScore 
}: { 
  scores: GameScore[]; 
  currentProfileId: string | null;
  formatScore: (score: number) => string;
}) => {
  if (scores.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-white/50" />
        </div>
        <p className="text-white/60">No scores yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scores.map((score, index) => (
        <div
          key={score.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl backdrop-blur-md transition-all duration-300",
            score.profile_id === currentProfileId 
              ? "bg-white/20 border border-white/30" 
              : "bg-white/10 hover:bg-white/15"
          )}
        >
          <div className="w-8 flex justify-center">
            {index < 3 ? (
              <Medal className={cn("h-5 w-5", getMedalColor(index))} />
            ) : (
              <span className="text-sm text-white/50 font-medium">
                {index + 1}
              </span>
            )}
          </div>
          
          <Avatar className="h-8 w-8 ring-2 ring-white/20">
            <AvatarFallback 
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: score.profiles?.avatar_color || "#3B82F6" }}
            >
              {score.profiles?.display_name?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          
          <span className="flex-1 font-medium truncate text-white">
            {score.profiles?.display_name || "Unknown"}
          </span>
          
          <span className="font-bold text-emerald-300">
            {formatScore(score.score)}
          </span>
        </div>
      ))}
    </div>
  );
};

const GAME_TABS: { key: GameType; label: string; icon: string; format: (s: number) => string }[] = [
  { key: "snake", label: "Snake", icon: "🐍", format: (s) => `${s} pts` },
  { key: "minesweeper", label: "Mines", icon: "💣", format: (s) => `${s} wins` },
  { key: "reaction", label: "Reaction", icon: "⚡", format: (s) => `${s}ms` },
];

const Leaderboard = ({ scores, loading, currentProfileId }: LeaderboardProps) => {
  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
        <div className="text-center text-white/60">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Weekly Leaderboard</h2>
            <p className="text-sm text-white/60">Top scores from the last 7 days</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <Tabs defaultValue="snake" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-2 mb-4 bg-white/10 border border-white/20">
            {GAME_TABS.map(tab => (
              <TabsTrigger 
                key={tab.key} 
                value={tab.key} 
                className="text-xs text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white"
              >
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {GAME_TABS.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              <ScoreList 
                scores={scores[tab.key]} 
                currentProfileId={currentProfileId}
                formatScore={tab.format}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
