import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Heart } from "lucide-react";

interface PacmanGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const CELL_SIZE = 20;
const MAZE_WIDTH = 19;
const MAZE_HEIGHT = 21;

type Direction = "up" | "down" | "left" | "right";
type Position = { x: number; y: number };

// 0 = wall, 1 = dot, 2 = empty, 3 = power pellet, 4 = ghost house
const INITIAL_MAZE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,3,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,3,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0],
  [2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2],
  [0,0,0,0,1,0,1,0,0,4,0,0,1,0,1,0,0,0,0],
  [1,1,1,1,1,1,1,0,4,4,4,0,1,1,1,1,1,1,1],
  [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
  [2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2],
  [0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
  [0,3,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,3,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

interface Ghost {
  position: Position;
  direction: Direction;
  color: string;
  scared: boolean;
}

const PacmanGame = ({ onScoreSubmit }: PacmanGameProps) => {
  const [maze, setMaze] = useState<number[][]>([]);
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 9, y: 15 });
  const [pacmanDir, setPacmanDir] = useState<Direction>("right");
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover" | "won">("idle");
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("pacman_high_score");
    return saved ? parseInt(saved) : 0;
  });
  const [mouthOpen, setMouthOpen] = useState(true);
  
  const nextDirRef = useRef<Direction>("right");
  const gameLoopRef = useRef<number | null>(null);

  const initGame = useCallback(() => {
    setMaze(INITIAL_MAZE.map(row => [...row]));
    setPacmanPos({ x: 9, y: 15 });
    setPacmanDir("right");
    nextDirRef.current = "right";
    setGhosts([
      { position: { x: 9, y: 9 }, direction: "up", color: "hsl(0, 80%, 50%)", scared: false },
      { position: { x: 8, y: 9 }, direction: "left", color: "hsl(300, 80%, 50%)", scared: false },
      { position: { x: 10, y: 9 }, direction: "right", color: "hsl(180, 80%, 50%)", scared: false },
    ]);
    setScore(0);
    setLives(3);
  }, []);

  const isValidMove = useCallback((pos: Position, maze: number[][]): boolean => {
    if (pos.x < 0 || pos.x >= MAZE_WIDTH || pos.y < 0 || pos.y >= MAZE_HEIGHT) {
      return pos.y === 9; // Allow tunnel
    }
    return maze[pos.y]?.[pos.x] !== 0;
  }, []);

  const getNextPos = useCallback((pos: Position, dir: Direction): Position => {
    const moves: Record<Direction, Position> = {
      up: { x: pos.x, y: pos.y - 1 },
      down: { x: pos.x, y: pos.y + 1 },
      left: { x: pos.x - 1, y: pos.y },
      right: { x: pos.x + 1, y: pos.y },
    };
    const next = moves[dir];
    
    // Tunnel wrap
    if (next.x < 0) next.x = MAZE_WIDTH - 1;
    if (next.x >= MAZE_WIDTH) next.x = 0;
    
    return next;
  }, []);

  const moveGhost = useCallback((ghost: Ghost, maze: number[][]): Ghost => {
    const directions: Direction[] = ["up", "down", "left", "right"];
    const opposite: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
    
    // Try to continue in same direction, or pick random valid direction
    const validDirs = directions.filter(dir => {
      if (dir === opposite[ghost.direction]) return false;
      const next = getNextPos(ghost.position, dir);
      return isValidMove(next, maze) && maze[next.y]?.[next.x] !== 4;
    });
    
    if (validDirs.length === 0) {
      // Must turn around
      const next = getNextPos(ghost.position, opposite[ghost.direction]);
      if (isValidMove(next, maze)) {
        return { ...ghost, position: next, direction: opposite[ghost.direction] };
      }
      return ghost;
    }
    
    // Prefer current direction, else random
    const newDir = validDirs.includes(ghost.direction) && Math.random() > 0.3
      ? ghost.direction
      : validDirs[Math.floor(Math.random() * validDirs.length)];
    
    return { ...ghost, position: getNextPos(ghost.position, newDir), direction: newDir };
  }, [getNextPos, isValidMove]);

  const tick = useCallback(() => {
    if (gameState !== "playing") return;
    
    setMouthOpen(prev => !prev);
    
    // Try next direction first, then current direction
    let newPos = getNextPos(pacmanPos, nextDirRef.current);
    let actualDir = nextDirRef.current;
    
    if (!isValidMove(newPos, maze)) {
      newPos = getNextPos(pacmanPos, pacmanDir);
      actualDir = pacmanDir;
      if (!isValidMove(newPos, maze)) {
        newPos = pacmanPos;
      }
    } else {
      setPacmanDir(nextDirRef.current);
    }
    
    setPacmanPos(newPos);
    
    // Collect dots
    const cell = maze[newPos.y]?.[newPos.x];
    if (cell === 1 || cell === 3) {
      const newMaze = maze.map(row => [...row]);
      newMaze[newPos.y][newPos.x] = 2;
      setMaze(newMaze);
      
      if (cell === 1) {
        setScore(prev => prev + 10);
      } else if (cell === 3) {
        setScore(prev => prev + 50);
        setGhosts(prev => prev.map(g => ({ ...g, scared: true })));
        setTimeout(() => {
          setGhosts(prev => prev.map(g => ({ ...g, scared: false })));
        }, 5000);
      }
      
      // Check win
      const dotsLeft = newMaze.flat().filter(c => c === 1 || c === 3).length;
      if (dotsLeft === 0) {
        setGameState("won");
        return;
      }
    }
    
    // Move ghosts
    setGhosts(prev => {
      const newGhosts = prev.map(g => moveGhost(g, maze));
      
      // Check collision
      for (const ghost of newGhosts) {
        if (ghost.position.x === newPos.x && ghost.position.y === newPos.y) {
          if (ghost.scared) {
            setScore(s => s + 200);
            ghost.position = { x: 9, y: 9 };
            ghost.scared = false;
          } else {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                setGameState("gameover");
              } else {
                setPacmanPos({ x: 9, y: 15 });
                setPacmanDir("right");
                nextDirRef.current = "right";
              }
              return newLives;
            });
          }
        }
      }
      
      return newGhosts;
    });
  }, [gameState, pacmanPos, pacmanDir, maze, getNextPos, isValidMove, moveGhost]);

  useEffect(() => {
    if (gameState === "gameover" || gameState === "won") {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("pacman_high_score", score.toString());
        onScoreSubmit?.(score);
      }
    }
  }, [gameState, score, highScore, onScoreSubmit]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }
    
    gameLoopRef.current = window.setInterval(tick, 150);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, tick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      const dirMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      
      if (dirMap[e.key]) {
        e.preventDefault();
        nextDirRef.current = dirMap[e.key];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  const startGame = () => {
    initGame();
    setGameState("playing");
  };

  const renderPacman = () => {
    const rotation: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };
    const mouthAngle = mouthOpen ? 45 : 10;
    
    return (
      <div
        className="absolute transition-all duration-100"
        style={{
          left: pacmanPos.x * CELL_SIZE,
          top: pacmanPos.y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
        }}
      >
        <svg viewBox="0 0 100 100" style={{ transform: `rotate(${rotation[pacmanDir]}deg)` }}>
          <path
            d={`M50,50 L${50 + 45 * Math.cos(mouthAngle * Math.PI / 180)},${50 - 45 * Math.sin(mouthAngle * Math.PI / 180)} A45,45 0 1,0 ${50 + 45 * Math.cos(mouthAngle * Math.PI / 180)},${50 + 45 * Math.sin(mouthAngle * Math.PI / 180)} Z`}
            fill="hsl(var(--game-pacman))"
          />
        </svg>
      </div>
    );
  };

  const renderGhosts = () => ghosts.map((ghost, i) => (
    <div
      key={i}
      className="absolute transition-all duration-100"
      style={{
        left: ghost.position.x * CELL_SIZE,
        top: ghost.position.y * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE,
      }}
    >
      <svg viewBox="0 0 100 100">
        <path
          d={`M10,100 L10,50 A40,40 0 1,1 90,50 L90,100 L75,85 L60,100 L45,85 L30,100 L15,85 Z`}
          fill={ghost.scared ? "hsl(220, 80%, 50%)" : ghost.color}
        />
        <circle cx="35" cy="45" r="8" fill="white" />
        <circle cx="65" cy="45" r="8" fill="white" />
        <circle cx="37" cy="47" r="4" fill="black" />
        <circle cx="67" cy="47" r="4" fill="black" />
      </svg>
    </div>
  ));

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">👻 Pacman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center items-start">
            <div 
              className="relative border-2 border-primary/30 rounded-lg overflow-hidden"
              style={{ 
                width: MAZE_WIDTH * CELL_SIZE, 
                height: MAZE_HEIGHT * CELL_SIZE,
                background: "hsl(240, 20%, 10%)",
              }}
            >
              {/* Maze */}
              {maze.map((row, y) => row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className="absolute"
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                >
                  {cell === 0 && (
                    <div className="w-full h-full bg-blue-800 rounded-sm" />
                  )}
                  {cell === 1 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-200" />
                    </div>
                  )}
                  {cell === 3 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-200 animate-pulse" />
                    </div>
                  )}
                </div>
              )))}
              
              {gameState === "playing" && (
                <>
                  {renderPacman()}
                  {renderGhosts()}
                </>
              )}
              
              {(gameState === "idle" || gameState === "gameover" || gameState === "won") && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center">
                    {gameState === "gameover" && (
                      <div className="text-red-500 text-2xl font-bold mb-2">GAME OVER</div>
                    )}
                    {gameState === "won" && (
                      <div className="text-green-500 text-2xl font-bold mb-2">YOU WIN!</div>
                    )}
                    <Button onClick={startGame}>
                      <Play className="h-4 w-4 mr-2" />
                      {gameState === "idle" ? "Start Game" : "Play Again"}
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
                <Button onClick={startGame} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restart
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Arrow keys or WASD to move
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PacmanGame;
