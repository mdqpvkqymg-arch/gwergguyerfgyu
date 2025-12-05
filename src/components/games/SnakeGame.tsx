import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
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
    
    // Submit score to leaderboard if > 0
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

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        handleGameOver(scoreRef.current);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        handleGameOver(scoreRef.current);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          return newScore;
        });
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

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
        <div className="flex gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Score:</span>
            <span className="font-bold text-xl">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-xl">{highScore}</span>
          </div>
        </div>

        <div 
          className="relative border-2 border-border rounded-lg overflow-hidden bg-muted/50"
          style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
        >
          {snake.map((segment, i) => (
            <div
              key={i}
              className="absolute bg-green-500 rounded-sm"
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: segment.x * CELL_SIZE + 1,
                top: segment.y * CELL_SIZE + 1,
                opacity: i === 0 ? 1 : 0.8,
              }}
            />
          ))}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              left: food.x * CELL_SIZE + 2,
              top: food.y * CELL_SIZE + 2,
            }}
          />
          
          {!isPlaying && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                {gameOver && <p className="text-xl font-bold text-destructive mb-2">Game Over!</p>}
                <Button onClick={resetGame}>
                  {gameOver ? <RotateCcw className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
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
            onClick={() => { if (directionRef.current !== "DOWN") { directionRef.current = "UP"; setDirection("UP"); }}}
          >
            ↑
          </Button>
          <div />
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => { if (directionRef.current !== "RIGHT") { directionRef.current = "LEFT"; setDirection("LEFT"); }}}
          >
            ←
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => { if (directionRef.current !== "UP") { directionRef.current = "DOWN"; setDirection("DOWN"); }}}
          >
            ↓
          </Button>
          <Button 
            variant="outline" 
            size="lg"
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
