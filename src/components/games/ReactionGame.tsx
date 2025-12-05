import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Trophy, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type GameState = "waiting" | "ready" | "go" | "clicked" | "too-early";

interface ReactionGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const ReactionGame = ({ onScoreSubmit }: ReactionGameProps) => {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem("bestReactionTime");
    return saved ? parseInt(saved) : null;
  });
  const [attempts, setAttempts] = useState<number[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setGameState("ready");
    setReactionTime(null);
    setIsNewBest(false);
    
    const delay = Math.random() * 3000 + 2000;
    timeoutRef.current = setTimeout(() => {
      setGameState("go");
      setStartTime(Date.now());
    }, delay);
  }, []);

  const handleClick = useCallback(async () => {
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
        setIsNewBest(true);
        localStorage.setItem("bestReactionTime", time.toString());
        
        if (onScoreSubmit) {
          const success = await onScoreSubmit(time);
          if (success) {
            toast.success("New best time submitted to leaderboard!");
          }
        }
      }
    } else if (gameState === "too-early" || gameState === "clicked") {
      startGame();
    }
  }, [gameState, startTime, bestTime, startGame, onScoreSubmit]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const averageTime = attempts.length > 0 
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    : null;

  const getBackgroundStyle = () => {
    switch (gameState) {
      case "ready": 
        return {
          background: 'linear-gradient(135deg, hsl(0, 72%, 45%), hsl(0, 72%, 35%))',
          boxShadow: '0 0 60px hsl(0, 72%, 50% / 0.4), inset 0 0 60px hsl(0, 72%, 30% / 0.3)',
        };
      case "go": 
        return {
          background: 'linear-gradient(135deg, hsl(142, 76%, 45%), hsl(142, 76%, 35%))',
          boxShadow: '0 0 60px hsl(142, 76%, 50% / 0.5), inset 0 0 60px hsl(142, 76%, 30% / 0.3)',
        };
      case "too-early": 
        return {
          background: 'linear-gradient(135deg, hsl(45, 93%, 50%), hsl(35, 93%, 45%))',
          boxShadow: '0 0 60px hsl(45, 93%, 58% / 0.4), inset 0 0 60px hsl(45, 93%, 40% / 0.3)',
        };
      case "clicked":
        return {
          background: isNewBest 
            ? 'linear-gradient(135deg, hsl(280, 80%, 50%), hsl(320, 80%, 45%))'
            : 'linear-gradient(135deg, hsl(195, 85%, 45%), hsl(210, 85%, 40%))',
          boxShadow: isNewBest
            ? '0 0 80px hsl(280, 80%, 50% / 0.5), inset 0 0 60px hsl(280, 80%, 30% / 0.3)'
            : '0 0 60px hsl(195, 85%, 50% / 0.4), inset 0 0 60px hsl(195, 85%, 30% / 0.3)',
        };
      default: 
        return {
          background: 'linear-gradient(135deg, hsl(215, 25%, 20%), hsl(215, 30%, 15%))',
          boxShadow: '0 0 40px hsl(195, 85%, 50% / 0.2), inset 0 0 60px hsl(215, 25%, 10% / 0.5)',
        };
    }
  };

  const getMessage = () => {
    switch (gameState) {
      case "waiting": return { text: "Click to Start", sub: "Test your reflexes!" };
      case "ready": return { text: "Wait...", sub: "Get ready for green" };
      case "go": return { text: "CLICK!", sub: "NOW!" };
      case "too-early": return { text: "Too Early!", sub: "Click to retry" };
      case "clicked": return { 
        text: `${reactionTime}ms`, 
        sub: isNewBest ? "🎉 New Best!" : "Click to try again" 
      };
    }
  };

  const getTimeRating = (time: number): { label: string; color: string } => {
    if (time < 200) return { label: "Incredible!", color: "text-purple-400" };
    if (time < 250) return { label: "Amazing!", color: "text-emerald-400" };
    if (time < 300) return { label: "Great!", color: "text-cyan-400" };
    if (time < 400) return { label: "Good", color: "text-amber-400" };
    return { label: "Keep practicing", color: "text-muted-foreground" };
  };

  const message = getMessage();

  return (
    <div>
      <Card className="mb-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-400" />
            <span className="text-amber-200">Reaction Time</span>
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
          "h-72 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none border-2 border-white/10",
          gameState === "go" && "animate-reaction-pulse"
        )}
        style={getBackgroundStyle()}
      >
        <span className={cn(
          "text-5xl font-bold text-white mb-2 transition-all",
          gameState === "clicked" && isNewBest && "animate-score-pop",
          gameState === "go" && "drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
        )}>
          {message.text}
        </span>
        <span className={cn(
          "text-lg text-white/80",
          gameState === "clicked" && isNewBest && "text-yellow-200"
        )}>
          {message.sub}
        </span>
        {gameState === "clicked" && reactionTime && (
          <span className={cn("text-sm mt-2 font-medium", getTimeRating(reactionTime).color)}>
            {getTimeRating(reactionTime).label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span className="text-sm">Best Time</span>
            </div>
            <p className="text-3xl font-bold text-amber-400">
              {bestTime ? (
                <>
                  {bestTime}
                  <span className="text-lg text-amber-400/70">ms</span>
                </>
              ) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Timer className="h-5 w-5 text-cyan-400" />
              <span className="text-sm">Average (last 5)</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">
              {averageTime ? (
                <>
                  {averageTime}
                  <span className="text-lg text-cyan-400/70">ms</span>
                </>
              ) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {attempts.length > 0 && (
        <Card className="mt-4 bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-3">Recent attempts</p>
            <div className="flex gap-2 flex-wrap">
              {attempts.map((time, i) => {
                const rating = getTimeRating(time);
                return (
                  <span 
                    key={i}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                      "bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/30",
                      rating.color
                    )}
                    style={{
                      textShadow: '0 0 10px currentColor',
                    }}
                  >
                    {time}ms
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReactionGame;