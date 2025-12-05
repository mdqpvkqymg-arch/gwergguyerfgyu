import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Heart } from "lucide-react";

interface DefenderGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

interface Ship {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: "basic" | "fast" | "tank";
}

const DefenderGame = ({ onScoreSubmit }: DefenderGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ship, setShip] = useState<Ship>({ x: 50, y: CANVAS_HEIGHT / 2, width: 40, height: 20 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameover">("idle");
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("defender_high_score");
    return saved ? parseInt(saved) : 0;
  });
  
  const keysRef = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const lastEnemySpawn = useRef(0);
  const shipRef = useRef(ship);

  const spawnEnemy = useCallback((currentWave: number) => {
    const types: ("basic" | "fast" | "tank")[] = ["basic", "fast", "tank"];
    const type = types[Math.floor(Math.random() * Math.min(currentWave, types.length))];
    
    const enemyConfig = {
      basic: { width: 30, height: 30, speed: 2 + currentWave * 0.2 },
      fast: { width: 20, height: 20, speed: 4 + currentWave * 0.3 },
      tank: { width: 40, height: 40, speed: 1 + currentWave * 0.1 },
    };
    
    const config = enemyConfig[type];
    
    return {
      x: CANVAS_WIDTH + config.width,
      y: Math.random() * (CANVAS_HEIGHT - config.height - 40) + 20,
      ...config,
      type,
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Background with stars
    ctx.fillStyle = "hsl(240, 30%, 5%)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % CANVAS_WIDTH;
      const y = (i * 73) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Ship
    ctx.save();
    ctx.translate(shipRef.current.x, shipRef.current.y);
    
    // Ship body
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.beginPath();
    ctx.moveTo(shipRef.current.width, shipRef.current.height / 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(10, shipRef.current.height / 2);
    ctx.lineTo(0, shipRef.current.height);
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = "hsl(30, 100%, 50%)";
    ctx.beginPath();
    ctx.ellipse(-5, shipRef.current.height / 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Bullets
    ctx.fillStyle = "hsl(60, 100%, 60%)";
    bullets.forEach(bullet => {
      ctx.beginPath();
      ctx.ellipse(bullet.x, bullet.y, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Enemies
    enemies.forEach(enemy => {
      const colors = {
        basic: "hsl(0, 70%, 50%)",
        fast: "hsl(280, 70%, 50%)",
        tank: "hsl(120, 70%, 40%)",
      };
      
      ctx.fillStyle = colors[enemy.type];
      ctx.beginPath();
      
      if (enemy.type === "basic") {
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
      } else if (enemy.type === "fast") {
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
        ctx.lineTo(enemy.x, enemy.y + enemy.height);
        ctx.closePath();
      } else {
        ctx.rect(enemy.x, enemy.y, enemy.width, enemy.height);
      }
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.4, 3, 0, Math.PI * 2);
      ctx.arc(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.4, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // HUD
    ctx.fillStyle = "white";
    ctx.font = "16px monospace";
    ctx.fillText(`Wave: ${wave}`, 10, 25);
  }, [bullets, enemies, wave]);

  const tick = useCallback(() => {
    if (gameState !== "playing") return;
    
    // Ship movement
    const speed = 5;
    let newY = shipRef.current.y;
    let newX = shipRef.current.x;
    
    if (keysRef.current.has("ArrowUp") || keysRef.current.has("w")) {
      newY = Math.max(0, newY - speed);
    }
    if (keysRef.current.has("ArrowDown") || keysRef.current.has("s")) {
      newY = Math.min(CANVAS_HEIGHT - shipRef.current.height, newY + speed);
    }
    if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
      newX = Math.max(0, newX - speed);
    }
    if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
      newX = Math.min(CANVAS_WIDTH / 3, newX + speed);
    }
    
    shipRef.current = { ...shipRef.current, x: newX, y: newY };
    setShip(shipRef.current);
    
    // Move bullets
    setBullets(prev => prev
      .map(b => ({ ...b, x: b.x + b.dx }))
      .filter(b => b.x < CANVAS_WIDTH + 10)
    );
    
    // Move enemies
    setEnemies(prev => {
      const newEnemies = prev
        .map(e => ({ ...e, x: e.x - e.speed }))
        .filter(e => e.x + e.width > 0);
      
      // Check collisions with ship
      for (const enemy of newEnemies) {
        if (
          shipRef.current.x < enemy.x + enemy.width &&
          shipRef.current.x + shipRef.current.width > enemy.x &&
          shipRef.current.y < enemy.y + enemy.height &&
          shipRef.current.y + shipRef.current.height > enemy.y
        ) {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameState("gameover");
            }
            return newLives;
          });
          return newEnemies.filter(e => e !== enemy);
        }
      }
      
      return newEnemies;
    });
    
    // Check bullet-enemy collisions
    setBullets(prevBullets => {
      const remainingBullets: Bullet[] = [];
      
      setEnemies(prevEnemies => {
        const remainingEnemies: Enemy[] = [];
        
        for (const enemy of prevEnemies) {
          let hit = false;
          
          for (const bullet of prevBullets) {
            if (
              bullet.x > enemy.x &&
              bullet.x < enemy.x + enemy.width &&
              bullet.y > enemy.y &&
              bullet.y < enemy.y + enemy.height
            ) {
              hit = true;
              const points = { basic: 10, fast: 20, tank: 30 };
              setScore(s => s + points[enemy.type]);
              break;
            }
          }
          
          if (!hit) {
            remainingEnemies.push(enemy);
          }
        }
        
        return remainingEnemies;
      });
      
      // Keep bullets that didn't hit anything
      for (const bullet of prevBullets) {
        let hitEnemy = false;
        setEnemies(prev => {
          for (const enemy of prev) {
            if (
              bullet.x > enemy.x &&
              bullet.x < enemy.x + enemy.width &&
              bullet.y > enemy.y &&
              bullet.y < enemy.y + enemy.height
            ) {
              hitEnemy = true;
              break;
            }
          }
          return prev;
        });
        if (!hitEnemy) {
          remainingBullets.push(bullet);
        }
      }
      
      return remainingBullets;
    });
    
    // Spawn enemies
    const now = Date.now();
    if (now - lastEnemySpawn.current > 1500 - wave * 100) {
      setEnemies(prev => [...prev, spawnEnemy(wave)]);
      lastEnemySpawn.current = now;
    }
    
    // Increase wave based on score
    setScore(s => {
      const newWave = Math.floor(s / 100) + 1;
      if (newWave > wave) setWave(newWave);
      return s;
    });
  }, [gameState, wave, spawnEnemy]);

  useEffect(() => {
    if (gameState === "gameover" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("defender_high_score", score.toString());
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
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === " " && gameState === "playing") {
        e.preventDefault();
        setBullets(prev => [
          ...prev,
          { x: shipRef.current.x + shipRef.current.width, y: shipRef.current.y + shipRef.current.height / 2, dx: 10 },
        ]);
      }
      
      if (e.key === "p" || e.key === "P") {
        setGameState(prev => prev === "playing" ? "paused" : prev === "paused" ? "playing" : prev);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  const startGame = () => {
    shipRef.current = { x: 50, y: CANVAS_HEIGHT / 2, width: 40, height: 20 };
    setShip(shipRef.current);
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setLives(3);
    setWave(1);
    lastEnemySpawn.current = Date.now();
    setGameState("playing");
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">🚀 Defender</CardTitle>
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
              
              {(gameState === "idle" || gameState === "gameover" || gameState === "paused") && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                  <div className="text-center space-y-3">
                    {gameState === "gameover" && (
                      <div className="text-red-500 text-2xl font-bold">GAME OVER</div>
                    )}
                    {gameState === "paused" && (
                      <div className="text-yellow-500 text-2xl font-bold">PAUSED</div>
                    )}
                    
                    <Button onClick={gameState === "paused" ? () => setGameState("playing") : startGame}>
                      <Play className="h-4 w-4 mr-2" />
                      {gameState === "idle" ? "Start Game" : gameState === "paused" ? "Resume" : "Play Again"}
                    </Button>
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
                  <div className="text-xs text-muted-foreground">Wave</div>
                  <div className="text-lg font-bold">{wave}</div>
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
            WASD/Arrows to move • Space to shoot • P to pause
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefenderGame;
