import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Trophy, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface GameScore {
  id: string;
  profile_id: string;
  game_type: string;
  score: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_color: string;
  };
}

export const AdminScores = () => {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState("all");

  const fetchScores = async () => {
    const { data, error } = await supabase
      .from("game_scores")
      .select("*, profiles(display_name, avatar_color)")
      .order("score", { ascending: false });

    if (!error && data) {
      setScores(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleDeleteScore = async (id: string) => {
    const { error } = await supabase.from("game_scores").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete score");
      return;
    }
    toast.success("Score deleted");
    fetchScores();
  };

  const gameTypes = ["all", ...new Set(scores.map((s) => s.game_type))];

  const filteredScores =
    selectedGame === "all"
      ? scores
      : scores.filter((s) => s.game_type === selectedGame);

  const getGameColor = (type: string) => {
    switch (type) {
      case "snake":
        return "bg-game-snake/20 text-game-snake border-game-snake/30";
      case "minesweeper":
        return "bg-game-minesweeper/20 text-game-minesweeper border-game-minesweeper/30";
      case "reaction":
        return "bg-game-reaction/20 text-game-reaction border-game-reaction/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading scores...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          <Trophy className="h-3 w-3 mr-1" />
          {scores.length} total scores
        </Badge>
      </div>

      <Tabs value={selectedGame} onValueChange={setSelectedGame}>
        <TabsList>
          {gameTypes.map((type) => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type === "all" ? "All Games" : type}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedGame} className="mt-4">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-3 pr-4">
              {filteredScores.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No scores found
                </p>
              ) : (
                filteredScores.map((score, index) => (
                  <Card key={score.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: score.profiles?.avatar_color || "#666" }}
                        >
                          {score.profiles?.display_name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {score.profiles?.display_name || "Unknown"}
                            </h3>
                            <Badge variant="outline" className={`text-xs capitalize ${getGameColor(score.game_type)}`}>
                              <Gamepad2 className="h-3 w-3 mr-1" />
                              {score.game_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(score.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{score.score.toLocaleString()}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteScore(score.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
