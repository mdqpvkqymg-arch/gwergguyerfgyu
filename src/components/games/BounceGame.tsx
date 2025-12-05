import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Heart } from "lucide-react";

interface BounceGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 54;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 4;

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Brick {
  x: number;
  y: number;
  color: string;
  active: boolean;
}

const BRICK_COLORS = [
  "hsl(0, 70%, 50%)",
  "hsl(30, 70%, 50%)",
  "hsl(60, 70%, 50%)",
  "hsl(120, 70%, 50%)",
  "hsl(200, 70%, 50%)",
];

const BounceGame = ({ onScoreSubmit }: BounceGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddleX, setPaddleX] = useState(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [ball, setBall] = useState<Ball>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 4, dy: -4 });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameover" | "won">("idle");
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("bounce_high_score");
    return saved ? parseInt(saved) : 0;
  });
  
  const paddleXRef = useRef(paddleX);
  const gameLoopRef = useRef<number | null>(null);

  const initBricks = useCallback((lvl: number) => {
    const newBricks: Brick[] = [];
    const startY = 50;
    const startX = (CANVAS_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_GAP) - BRICK_GAP)) / 2;
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: startX + col * (BRICK_WIDTH + BRICK_GAP),
          y: startY + row * (BRICK_HEIGHT + BRICK_GAP),
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          active: true,
        });
      }
    }
    return newBricks;
  }, []);

  const resetBall = useCallback(() => {
    const speed = 4 + level * 0.5;
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: (Math.random() > 0.5 ? 1 : -1) * speed,
      dy: -speed,
    });
  }, [level]);

  const startGame = useCallback(() => {
    setBricks(initBricks(1));
    setPaddleX(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
    paddleXRef.current = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    setScore(0);
    setLives(3);
    setLevel(1);
    resetBall();
    setGameState("playing");
  }, [initBricks, resetBall]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = "hsl(240, 20%, 10%)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw bricks
    bricks.forEach(brick => {
      if (!brick.active) return;
      ctx.fillStyle = brick.color;
      ctx.beginPath();
      ctx.roundRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
      ctx.fill();
      
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_WIDTH - 4, 4);
    });
    
    // Draw paddle
    const gradient = ctx.createLinearGradient(paddleXRef.current, CANVAS_HEIGHT - 30, paddleXRef.current, CANVAS_HEIGHT - 30 + PADDLE_HEIGHT);
    gradient.addColorStop(0, "hsl(var(--primary))");
    gradient.addColorStop(1, "hsl(var(--primary) / 0.7)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddleXRef.current, CANVAS_HEIGHT - 30, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_RADIUS);
    ballGradient.addColorStop(0, "white");
    ballGradient.addColorStop(1, "hsl(var(--primary))");
    ctx.fillStyle = ballGradient;
    ctx.fill();
  }, [ball, bricks]);

  const tick = useCallback(() => {
    if (gameState !== "playing") return;
    
    setBall(prevBall => {
      let { x, y, dx, dy } = prevBall;
      
      // Move ball
      x += dx;
      y += dy;
      
      // Wall collisions
      if (x <= BALL_RADIUS || x >= CANVAS_WIDTH - BALL_RADIUS) {
        dx = -dx;
        x = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, x));
      }
      if (y <= BALL_RADIUS) {
        dy = -dy;
        y = BALL_RADIUS;
      }
      
      // Paddle collision
      const paddleTop = CANVAS_HEIGHT - 30;
      if (
        y + BALL_RADIUS >= paddleTop &&
        y - BALL_RADIUS <= paddleTop + PADDLE_HEIGHT &&
        x >= paddleXRef.current &&
        x <= paddleXRef.current + PADDLE_WIDTH
      ) {
        dy = -Math.abs(dy);
        // Add angle based on where ball hits paddle
        const hitPos = (x - paddleXRef.current) / PADDLE_WIDTH;
        dx = (hitPos - 0.5) * 10;
        y = paddleTop - BALL_RADIUS;
      }
      
      // Brick collisions
      setBricks(prevBricks => {
        const newBricks = [...prevBricks];
        let hit = false;
        
        for (let i = 0; i < newBricks.length; i++) {
          const brick = newBricks[i];
          if (!brick.active) continue;
          
          if (
            x + BALL_RADIUS > brick.x &&
            x - BALL_RADIUS < brick.x + BRICK_WIDTH &&
            y + BALL_RADIUS > brick.y &&
            y - BALL_RADIUS < brick.y + BRICK_HEIGHT
          ) {
            newBricks[i] = { ...brick, active: false };
            hit = true;
            setScore(s => s + 10);
            
            // Determine collision side
            const overlapLeft = (x + BALL_RADIUS) - brick.x;
            const overlapRight = (brick.x + BRICK_WIDTH) - (x - BALL_RADIUS);
            const overlapTop = (y + BALL_RADIUS) - brick.y;
            const overlapBottom = (brick.y + BRICK_HEIGHT) - (y - BALL_RADIUS);
            
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            
            if (minOverlapX < minOverlapY) {
              dx = -dx;
            } else {
              dy = -dy;
            }
            break;
          }
        }
        
        // Check win
        if (newBricks.every(b => !b.active)) {
          setLevel(l => l + 1);
          setGameState("won");
        }
        
        return hit ? newBricks : prevBricks;
      });
      
      // Bottom - lose life
      if (y >= CANVAS_HEIGHT + BALL_RADIUS) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameState("gameover");
          } else {
            // Reset ball position after a short delay
            setTimeout(() => {
              setBall({
                x: CANVAS_WIDTH / 2,
                y: CANVAS_HEIGHT - 50,
                dx: (Math.random() > 0.5 ? 1 : -1) * (4 + level * 0.5),
                dy: -(4 + level * 0.5),
              });
            }, 500);
          }
          return newLives;
        });
        return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50, dx: 0, dy: 0 };
      }
      
      return { x, y, dx, dy };
    });
  }, [gameState, level]);

  useEffect(() => {
    if (gameState === "gameover" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("bounce_high_score", score.toString());
      onScoreSubmit?.(score);
    }
  }, [gameState, score, highScore, onScoreSubmit]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      draw();
      return;
    }
    
    let lastTime = 0;
    const gameLoop = (time: number) => {
      if (time - lastTime > 16) {
        tick();
        draw();
        lastTime = time;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, tick, draw]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || gameState !== "playing") return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
      setPaddleX(newX);
      paddleXRef.current = newX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || gameState !== "playing") return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const newX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
      setPaddleX(newX);
      paddleXRef.current = newX;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      if (e.key === "ArrowLeft" || e.key === "a") {
        const newX = Math.max(0, paddleXRef.current - 20);
        setPaddleX(newX);
        paddleXRef.current = newX;
      } else if (e.key === "ArrowRight" || e.key === "d") {
        const newX = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, paddleXRef.current + 20);
        setPaddleX(newX);
        paddleXRef.current = newX;
      } else if (e.key === "p" || e.key === "P") {
        setGameState(prev => prev === "playing" ? "paused" : "playing");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState]);

  const nextLevel = () => {
    setBricks(initBricks(level));
    resetBall();
    setGameState("playing");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">🏓 Bounce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center items-start">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-primary/30 rounded-lg"
              />
              
              {(gameState === "idle" || gameState === "gameover" || gameState === "paused" || gameState === "won") && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                  <div className="text-center space-y-3">
                    {gameState === "gameover" && (
                      <div className="text-red-500 text-2xl font-bold">GAME OVER</div>
                    )}
                    {gameState === "won" && (
                      <div className="text-green-500 text-2xl font-bold">LEVEL {level - 1} COMPLETE!</div>
                    )}
                    {gameState === "paused" && (
                      <div className="text-yellow-500 text-2xl font-bold">PAUSED</div>
                    )}
                    
                    <div className="flex gap-2 justify-center">
                      {gameState === "won" ? (
                        <Button onClick={nextLevel}>
                          <Play className="h-4 w-4 mr-2" />
                          Next Level
                        </Button>
                      ) : gameState === "paused" ? (
                        <Button onClick={() => setGameState("playing")}>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      ) : (
                        <Button onClick={startGame}>
                          <Play className="h-4 w-4 mr-2" />
                          {gameState === "idle" ? "Start Game" : "Play Again"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 min-w-[90px]">
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Score</div>
                  <div className="text-lg font-bold text-primary">{score}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="text-lg font-bold">{level}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Lives</div>
                  <div className="flex gap-1 justify-center mt-1">
                    {Array(lives).fill(0).map((_, i) => (
                      <Heart key={i} className="h-4 w-4 text-red-500 fill-red-500" />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Best</div>
                  <div className="text-lg font-bold text-amber-500">{highScore}</div>
                </CardContent>
              </Card>
              
              {gameState === "playing" && (
                <>
                  <Button onClick={() => setGameState("paused")} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                  <Button onClick={startGame} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restart
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Mouse/Touch or Arrow keys to move • P to pause
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BounceGame;
