import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Bomb } from "lucide-react";
import ReactionGame from "@/components/games/ReactionGame";
import SnakeGame from "@/components/games/SnakeGame";
import MinesweeperGame from "@/components/games/MinesweeperGame";

const Game = () => {
  const navigate = useNavigate();

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
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="snake" className="flex items-center gap-2">
              🐍 Snake
            </TabsTrigger>
            <TabsTrigger value="minesweeper" className="flex items-center gap-2">
              <Bomb className="h-4 w-4" />
              Minesweeper
            </TabsTrigger>
            <TabsTrigger value="reaction" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Reaction
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snake">
            <SnakeGame />
          </TabsContent>

          <TabsContent value="minesweeper">
            <MinesweeperGame />
          </TabsContent>

          <TabsContent value="reaction">
            <ReactionGame />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Game;
