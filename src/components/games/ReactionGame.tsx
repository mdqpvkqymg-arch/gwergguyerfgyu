import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type GameState = "waiting" | "ready" | "go" | "clicked" | "too-early";

const ReactionGame = () => {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem("bestReactionTime");
    return saved ? parseInt(saved) : null;
  });
  const [attempts, setAttempts] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setGameState("ready");
    setReactionTime(null);
    
    const delay = Math.random() * 3000 + 2000;
    timeoutRef.current = setTimeout(() => {
      setGameState("go");
      setStartTime(Date.now());
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (gameState === "waiting") {
      startGame();
    } else if (gameState === "ready") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("too-early");
    } else if (gameState === "go") {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setAttempts(prev => [...prev.slice(-4), time]);
      setGameState("clicked");
      
      if (!bestTime || time < bestTime) {
        setBestTime(time);
        localStorage.setItem("bestReactionTime", time.toString());
      }
    } else if (gameState === "too-early" || gameState === "clicked") {
      startGame();
    }
  }, [gameState, startTime, bestTime, startGame]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const averageTime = attempts.length > 0 
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    : null;

  const getBackgroundClass = () => {
    switch (gameState) {
      case "ready": return "bg-red-500";
      case "go": return "bg-green-500";
      case "too-early": return "bg-yellow-500";
      default: return "bg-primary";
    }
  };

  const getMessage = () => {
    switch (gameState) {
      case "waiting": return "Click to Start";
      case "ready": return "Wait for green...";
      case "go": return "CLICK NOW!";
      case "too-early": return "Too early! Click to retry";
      case "clicked": return `${reactionTime}ms`;
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Reaction Time Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Click as fast as you can when the color changes to green!
          </p>
        </CardContent>
      </Card>

      <div
        onClick={handleClick}
        className={cn(
          "h-64 rounded-xl flex items-center justify-center cursor-pointer transition-colors select-none",
          getBackgroundClass()
        )}
      >
        <span className="text-4xl font-bold text-white">
          {getMessage()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Trophy className="h-4 w-4" />
              Best Time
            </div>
            <p className="text-2xl font-bold">
              {bestTime ? `${bestTime}ms` : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <RotateCcw className="h-4 w-4" />
              Average (last 5)
            </div>
            <p className="text-2xl font-bold">
              {averageTime ? `${averageTime}ms` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {attempts.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Recent attempts:</p>
            <div className="flex gap-2 flex-wrap">
              {attempts.map((time, i) => (
                <span 
                  key={i}
                  className="px-3 py-1 rounded-full bg-muted text-sm font-medium"
                >
                  {time}ms
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReactionGame;
