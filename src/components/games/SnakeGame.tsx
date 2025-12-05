import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GRID_SIZE = 20;
const CELL_SIZE = 18;
const INITIAL_SPEED = 150;

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

interface SnakeGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const SnakeGame = ({ onScoreSubmit }: SnakeGameProps) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snakeHighScore");
    return saved ? parseInt(saved) : 0;
  });
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef(score);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const handleGameOver = useCallback(async (finalScore: number) => {
    setGameOver(true);
    setIsPlaying(false);
    
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("snakeHighScore", finalScore.toString());
    }
    
    if (finalScore > 0 && onScoreSubmit) {
      const success = await onScoreSubmit(finalScore);
      if (success) {
        toast.success(`Score of ${finalScore} submitted to leaderboard!`);
      }
    }
  }, [highScore, onScoreSubmit]);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    scoreRef.current = 0;
    setIsPlaying(true);
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      
      switch (directionRef.current) {
        case "UP": head.y -= 1; break;
        case "DOWN": head.y += 1; break;
        case "LEFT": head.x -= 1; break;
        case "RIGHT": head.x += 1; break;
      }

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        handleGameOver(scoreRef.current);
        return prevSnake;
      }

      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        handleGameOver(scoreRef.current);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          return newScore;
        });
        setScoreAnimating(true);
        setTimeout(() => setScoreAnimating(false), 300);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, handleGameOver]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [isPlaying, gameOver, moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case "ArrowUp":
        case "w":
          if (directionRef.current !== "DOWN") {
            directionRef.current = "UP";
            setDirection("UP");
          }
          break;
        case "ArrowDown":
        case "s":
          if (directionRef.current !== "UP") {
            directionRef.current = "DOWN";
            setDirection("DOWN");
          }
          break;
        case "ArrowLeft":
        case "a":
          if (directionRef.current !== "RIGHT") {
            directionRef.current = "LEFT";
            setDirection("LEFT");
          }
          break;
        case "ArrowRight":
        case "d":
          if (directionRef.current !== "LEFT") {
            directionRef.current = "RIGHT";
            setDirection("RIGHT");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  const getSegmentStyle = (index: number, total: number) => {
    const opacity = Math.max(0.4, 1 - (index / total) * 0.6);
    const hue = 142 + (index * 2);
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 76%, ${50 - index * 2}%), hsl(${hue}, 76%, ${40 - index}%))`,
      opacity,
      boxShadow: index === 0 ? '0 0 12px hsl(142, 76%, 50%), 0 0 24px hsl(142, 76%, 50% / 0.3)' : 'none',
    };
  };

  return (
    <div>
      <Card className="mb-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-400">
            🐍 Snake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use arrow keys or WASD to move. Eat food to grow!
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-6 mb-2">
          <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border">
            <span className="text-muted-foreground text-sm">Score</span>
            <span className={cn(
              "font-bold text-2xl text-emerald-400 transition-transform",
              scoreAnimating && "animate-score-pop"
            )}>
              {score}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-amber-500/30">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-2xl text-amber-400">{highScore}</span>
          </div>
        </div>

        <div 
          className="relative rounded-xl overflow-hidden"
          style={{ 
            width: GRID_SIZE * CELL_SIZE + 4, 
            height: GRID_SIZE * CELL_SIZE + 4,
            background: 'linear-gradient(135deg, hsl(220, 20%, 8%), hsl(220, 25%, 12%))',
            boxShadow: '0 0 40px hsl(142, 76%, 50% / 0.1), inset 0 0 60px hsl(220, 25%, 5%)',
            border: '2px solid hsl(220, 25%, 20%)',
          }}
        >
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(hsl(220, 25%, 25%) 1px, transparent 1px),
                linear-gradient(90deg, hsl(220, 25%, 25%) 1px, transparent 1px)
              `,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            }}
          />
          
          {/* Snake */}
          {snake.map((segment, i) => (
            <div
              key={i}
              className={cn(
                "absolute rounded-md transition-all duration-75",
                i === 0 && "animate-snake-glow"
              )}
              style={{
                width: CELL_SIZE - 3,
                height: CELL_SIZE - 3,
                left: segment.x * CELL_SIZE + 3.5,
                top: segment.y * CELL_SIZE + 3.5,
                ...getSegmentStyle(i, snake.length),
              }}
            />
          ))}
          
          {/* Food */}
          <div
            className="absolute rounded-full animate-pulse-glow"
            style={{
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              left: food.x * CELL_SIZE + 4,
              top: food.y * CELL_SIZE + 4,
              background: 'radial-gradient(circle at 30% 30%, hsl(350, 89%, 70%), hsl(350, 89%, 50%))',
            }}
          />
          
          {/* Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                {gameOver && (
                  <p className="text-2xl font-bold text-red-400 mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    Game Over!
                  </p>
                )}
                <Button 
                  onClick={resetGame}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25"
                >
                  {gameOver ? <RotateCcw className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                  {gameOver ? "Play Again" : "Start Game"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 mt-4 md:hidden">
          <div />
          <Button 
            variant="outline" 
            size="lg"
            className="bg-card/50 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            onClick={() => { if (directionRef.current !== "DOWN") { directionRef.current = "UP"; setDirection("UP"); }}}
          >
            ↑
          </Button>
          <div />
          <Button 
            variant="outline" 
            size="lg"
            className="bg-card/50 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            onClick={() => { if (directionRef.current !== "RIGHT") { directionRef.current = "LEFT"; setDirection("LEFT"); }}}
          >
            ←
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="bg-card/50 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            onClick={() => { if (directionRef.current !== "UP") { directionRef.current = "DOWN"; setDirection("DOWN"); }}}
          >
            ↓
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="bg-card/50 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            onClick={() => { if (directionRef.current !== "LEFT") { directionRef.current = "RIGHT"; setDirection("RIGHT"); }}}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;