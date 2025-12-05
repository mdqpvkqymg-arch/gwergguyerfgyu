import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TetrisGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 24;

type Board = (string | null)[][];
type Position = { x: number; y: number };

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: "hsl(var(--game-tetris-i))" },
  O: { shape: [[1, 1], [1, 1]], color: "hsl(var(--game-tetris-o))" },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: "hsl(var(--game-tetris-t))" },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: "hsl(var(--game-tetris-s))" },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: "hsl(var(--game-tetris-z))" },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: "hsl(var(--game-tetris-j))" },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: "hsl(var(--game-tetris-l))" },
};

type TetrominoType = keyof typeof TETROMINOES;

interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  color: string;
  position: Position;
}

const createEmptyBoard = (): Board => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

const getRandomTetromino = (): Tetromino => {
  const types = Object.keys(TETROMINOES) as TetrominoType[];
  const type = types[Math.floor(Math.random() * types.length)];
  const tetromino = TETROMINOES[type];
  return {
    type,
    shape: tetromino.shape.map(row => [...row]),
    color: tetromino.color,
    position: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
  };
};

const rotateTetromino = (shape: number[][]): number[][] => {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: number[][] = [];
  for (let i = 0; i < cols; i++) {
    rotated[i] = [];
    for (let j = rows - 1; j >= 0; j--) {
      rotated[i].push(shape[j][i]);
    }
  }
  return rotated;
};

const TetrisGame = ({ onScoreSubmit }: TetrisGameProps) => {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "gameover">("idle");
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("tetris_high_score");
    return saved ? parseInt(saved) : 0;
  });
  
  const gameLoopRef = useRef<number | null>(null);
  const dropTimeRef = useRef(1000);

  const isValidPosition = useCallback((piece: Tetromino, board: Board): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.position.x + x;
          const newY = piece.position.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return false;
          if (newY >= 0 && board[newY][newX]) return false;
        }
      }
    }
    return true;
  }, []);

  const lockPiece = useCallback((piece: Tetromino, board: Board): Board => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    return newBoard;
  }, []);

  const clearLines = useCallback((board: Board): { newBoard: Board; clearedLines: number } => {
    const newBoard = board.filter(row => row.some(cell => !cell));
    const clearedLines = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    return { newBoard, clearedLines };
  }, []);

  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameState !== "playing") return;
    
    const newPiece = {
      ...currentPiece,
      position: { x: currentPiece.position.x + dx, y: currentPiece.position.y + dy },
    };
    
    if (isValidPosition(newPiece, board)) {
      setCurrentPiece(newPiece);
      return true;
    }
    return false;
  }, [currentPiece, board, gameState, isValidPosition]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameState !== "playing") return;
    
    const rotatedShape = rotateTetromino(currentPiece.shape);
    const newPiece = { ...currentPiece, shape: rotatedShape };
    
    if (isValidPosition(newPiece, board)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, board, gameState, isValidPosition]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameState !== "playing") return;
    
    let newY = currentPiece.position.y;
    while (isValidPosition({ ...currentPiece, position: { ...currentPiece.position, y: newY + 1 } }, board)) {
      newY++;
    }
    
    const droppedPiece = { ...currentPiece, position: { ...currentPiece.position, y: newY } };
    const newBoard = lockPiece(droppedPiece, board);
    const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);
    
    const linePoints = [0, 100, 300, 500, 800];
    const pointsEarned = linePoints[clearedLines] * level;
    
    setBoard(clearedBoard);
    setScore(prev => prev + pointsEarned + (newY - currentPiece.position.y) * 2);
    setLines(prev => prev + clearedLines);
    
    if (nextPiece && !isValidPosition(nextPiece, clearedBoard)) {
      setGameState("gameover");
      return;
    }
    
    setCurrentPiece(nextPiece);
    setNextPiece(getRandomTetromino());
  }, [currentPiece, nextPiece, board, gameState, level, isValidPosition, lockPiece, clearLines]);

  const tick = useCallback(() => {
    if (!currentPiece || gameState !== "playing") return;
    
    const newPiece = {
      ...currentPiece,
      position: { ...currentPiece.position, y: currentPiece.position.y + 1 },
    };
    
    if (isValidPosition(newPiece, board)) {
      setCurrentPiece(newPiece);
    } else {
      const newBoard = lockPiece(currentPiece, board);
      const { newBoard: clearedBoard, clearedLines } = clearLines(newBoard);
      
      const linePoints = [0, 100, 300, 500, 800];
      const pointsEarned = linePoints[clearedLines] * level;
      
      setBoard(clearedBoard);
      setScore(prev => prev + pointsEarned);
      setLines(prev => prev + clearedLines);
      
      if (nextPiece && !isValidPosition(nextPiece, clearedBoard)) {
        setGameState("gameover");
        return;
      }
      
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomTetromino());
    }
  }, [currentPiece, nextPiece, board, gameState, level, isValidPosition, lockPiece, clearLines]);

  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    setLevel(newLevel);
    dropTimeRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
  }, [lines]);

  useEffect(() => {
    if (gameState === "gameover" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("tetris_high_score", score.toString());
      onScoreSubmit?.(score);
    }
  }, [gameState, score, highScore, onScoreSubmit]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }

    let lastTime = 0;
    const gameLoop = (time: number) => {
      if (time - lastTime > dropTimeRef.current) {
        tick();
        lastTime = time;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, tick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          movePiece(1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          movePiece(0, 1);
          break;
        case "ArrowUp":
        case " ":
          e.preventDefault();
          rotate();
          break;
        case "Enter":
          e.preventDefault();
          hardDrop();
          break;
        case "p":
        case "P":
          e.preventDefault();
          setGameState("paused");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, movePiece, rotate, hardDrop]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(getRandomTetromino());
    setNextPiece(getRandomTetromino());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameState("playing");
  };

  const togglePause = () => {
    setGameState(prev => prev === "playing" ? "paused" : "playing");
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y;
            const boardX = currentPiece.position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className="border border-border/20 transition-colors duration-100"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cell || "hsl(var(--game-board))",
              boxShadow: cell ? `inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3)` : undefined,
            }}
          />
        ))}
      </div>
    ));
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    
    return (
      <div className="flex flex-col items-center">
        {nextPiece.shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="border border-border/20"
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: cell ? nextPiece.color : "transparent",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
            🎮 Tetris
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center">
            <div 
              className="border-2 border-primary/30 rounded-lg overflow-hidden shadow-lg"
              style={{ 
                background: "linear-gradient(135deg, hsl(var(--game-board)) 0%, hsl(var(--background)) 100%)" 
              }}
            >
              {renderBoard()}
            </div>
            
            <div className="flex flex-col gap-3 min-w-[100px]">
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
                  <div className="text-xs text-muted-foreground">Lines</div>
                  <div className="text-lg font-bold">{lines}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Next</div>
                  <div className="mt-1 flex justify-center">{renderNextPiece()}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Best</div>
                  <div className="text-lg font-bold text-amber-500">{highScore}</div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex gap-2 justify-center">
            {gameState === "idle" || gameState === "gameover" ? (
              <Button onClick={startGame} className="gap-2">
                <Play className="h-4 w-4" />
                {gameState === "gameover" ? "Play Again" : "Start Game"}
              </Button>
            ) : (
              <>
                <Button onClick={togglePause} variant="outline" className="gap-2">
                  {gameState === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {gameState === "paused" ? "Resume" : "Pause"}
                </Button>
                <Button onClick={startGame} variant="destructive" className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </Button>
              </>
            )}
          </div>
          
          {gameState === "gameover" && (
            <div className="text-center text-destructive font-bold animate-pulse">
              Game Over!
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>← → Move • ↑/Space Rotate • ↓ Soft Drop</p>
            <p>Enter Hard Drop • P Pause</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TetrisGame;
