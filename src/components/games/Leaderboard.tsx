import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Zap, Bomb, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface LeaderboardProps {
  scores: Record<GameType, GameScore[]>;
  loading: boolean;
  currentProfileId: string | null;
}

const getMedalColor = (rank: number) => {
  switch (rank) {
    case 0: return "text-yellow-500";
    case 1: return "text-gray-400";
    case 2: return "text-amber-600";
    default: return "text-muted-foreground";
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
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No scores yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scores.map((score, index) => (
        <div
          key={score.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            score.profile_id === currentProfileId ? "bg-primary/10" : "bg-muted/50"
          )}
        >
          <div className="w-8 flex justify-center">
            {index < 3 ? (
              <Medal className={cn("h-5 w-5", getMedalColor(index))} />
            ) : (
              <span className="text-sm text-muted-foreground font-medium">
                {index + 1}
              </span>
            )}
          </div>
          
          <Avatar className="h-8 w-8">
            <AvatarFallback 
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: score.profiles?.avatar_color || "#3B82F6" }}
            >
              {score.profiles?.display_name?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          
          <span className="flex-1 font-medium truncate">
            {score.profiles?.display_name || "Unknown"}
          </span>
          
          <span className="font-bold text-primary">
            {formatScore(score.score)}
          </span>
        </div>
      ))}
    </div>
  );
};

const GAME_TABS: { key: GameType; label: string; icon: string; format: (s: number) => string }[] = [
  { key: "snake", label: "Snake", icon: "🐍", format: (s) => `${s} pts` },
  { key: "tetris", label: "Tetris", icon: "🎮", format: (s) => `${s} pts` },
  { key: "pacman", label: "Pacman", icon: "👻", format: (s) => `${s} pts` },
  { key: "bounce", label: "Bounce", icon: "🏓", format: (s) => `${s} pts` },
  { key: "minesweeper", label: "Mines", icon: "💣", format: (s) => `${s} wins` },
  { key: "puzzle", label: "Puzzle", icon: "🧩", format: (s) => `${s} pts` },
  { key: "spider", label: "Spider", icon: "🕷️", format: (s) => `${s} pts` },
  { key: "defender", label: "Defender", icon: "🚀", format: (s) => `${s} pts` },
  { key: "reaction", label: "Reaction", icon: "⚡", format: (s) => `${s}ms` },
];

const Leaderboard = ({ scores, loading, currentProfileId }: LeaderboardProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="snake" className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-2 mb-4">
            {GAME_TABS.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
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
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
