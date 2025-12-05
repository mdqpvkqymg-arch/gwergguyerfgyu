import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Trophy } from "lucide-react";

interface PuzzleGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const GRID_SIZE = 4;
const TILE_SIZE = 70;

type Board = (number | null)[];

const createSolvedBoard = (): Board => {
  const board: Board = [];
  for (let i = 1; i < GRID_SIZE * GRID_SIZE; i++) {
    board.push(i);
  }
  board.push(null);
  return board;
};

const shuffleBoard = (board: Board): Board => {
  const newBoard = [...board];
  // Make random valid moves to ensure solvability
  let emptyIndex = newBoard.indexOf(null);
  
  for (let i = 0; i < 200; i++) {
    const validMoves = getValidMoves(emptyIndex);
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    newBoard[emptyIndex] = newBoard[randomMove];
    newBoard[randomMove] = null;
    emptyIndex = randomMove;
  }
  
  return newBoard;
};

const getValidMoves = (emptyIndex: number): number[] => {
  const moves: number[] = [];
  const row = Math.floor(emptyIndex / GRID_SIZE);
  const col = emptyIndex % GRID_SIZE;
  
  if (row > 0) moves.push(emptyIndex - GRID_SIZE); // Up
  if (row < GRID_SIZE - 1) moves.push(emptyIndex + GRID_SIZE); // Down
  if (col > 0) moves.push(emptyIndex - 1); // Left
  if (col < GRID_SIZE - 1) moves.push(emptyIndex + 1); // Right
  
  return moves;
};

const isSolved = (board: Board): boolean => {
  for (let i = 0; i < GRID_SIZE * GRID_SIZE - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[GRID_SIZE * GRID_SIZE - 1] === null;
};

const PuzzleGame = ({ onScoreSubmit }: PuzzleGameProps) => {
  const [board, setBoard] = useState<Board>(createSolvedBoard);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem("puzzle_best_time");
    return saved ? parseInt(saved) : Infinity;
  });
  const [bestMoves, setBestMoves] = useState(() => {
    const saved = localStorage.getItem("puzzle_best_moves");
    return saved ? parseInt(saved) : Infinity;
  });

  useEffect(() => {
    if (gameState !== "playing") return;
    
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState]);

  const handleTileClick = useCallback((index: number) => {
    if (gameState !== "playing") return;
    
    const emptyIndex = board.indexOf(null);
    const validMoves = getValidMoves(emptyIndex);
    
    if (validMoves.includes(index)) {
      const newBoard = [...board];
      newBoard[emptyIndex] = newBoard[index];
      newBoard[index] = null;
      setBoard(newBoard);
      setMoves(m => m + 1);
      
      if (isSolved(newBoard)) {
        setGameState("won");
        
        // Calculate score (lower is better, based on moves and time)
        const score = 10000 - (moves * 10 + time);
        
        if (time < bestTime) {
          setBestTime(time);
          localStorage.setItem("puzzle_best_time", time.toString());
        }
        if (moves + 1 < bestMoves) {
          setBestMoves(moves + 1);
          localStorage.setItem("puzzle_best_moves", (moves + 1).toString());
        }
        
        onScoreSubmit?.(Math.max(0, score));
      }
    }
  }, [board, gameState, moves, time, bestTime, bestMoves, onScoreSubmit]);

  const startGame = () => {
    setBoard(shuffleBoard(createSolvedBoard()));
    setMoves(0);
    setTime(0);
    setGameState("playing");
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTilePosition = (index: number) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return { x: col * TILE_SIZE, y: row * TILE_SIZE };
  };

  const getTileColor = (value: number) => {
    const hue = ((value - 1) / 15) * 360;
    return `hsl(${hue}, 60%, 45%)`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">🧩 Puzzle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 justify-center items-start">
            <div 
              className="relative border-2 border-primary/30 rounded-lg overflow-hidden"
              style={{ 
                width: GRID_SIZE * TILE_SIZE, 
                height: GRID_SIZE * TILE_SIZE,
                background: "hsl(var(--game-board))",
              }}
            >
              {board.map((value, index) => {
                if (value === null) return null;
                const pos = getTilePosition(index);
                
                return (
                  <button
                    key={value}
                    onClick={() => handleTileClick(index)}
                    className="absolute transition-all duration-150 ease-out rounded-md font-bold text-xl text-white shadow-lg hover:brightness-110 active:scale-95"
                    style={{
                      width: TILE_SIZE - 4,
                      height: TILE_SIZE - 4,
                      left: pos.x + 2,
                      top: pos.y + 2,
                      backgroundColor: getTileColor(value),
                      boxShadow: `inset 2px 2px 4px rgba(255,255,255,0.3), inset -2px -2px 4px rgba(0,0,0,0.3), 2px 2px 8px rgba(0,0,0,0.3)`,
                    }}
                    disabled={gameState !== "playing"}
                  >
                    {value}
                  </button>
                );
              })}
              
              {(gameState === "idle" || gameState === "won") && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                  <div className="text-center space-y-3">
                    {gameState === "won" && (
                      <div className="space-y-1">
                        <Trophy className="h-8 w-8 mx-auto text-yellow-500" />
                        <div className="text-green-500 text-xl font-bold">SOLVED!</div>
                        <div className="text-sm text-muted-foreground">
                          {moves} moves in {formatTime(time)}
                        </div>
                      </div>
                    )}
                    <Button onClick={startGame}>
                      {gameState === "idle" ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Game
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Play Again
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 min-w-[90px]">
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Moves</div>
                  <div className="text-lg font-bold text-primary">{moves}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-primary/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Time</div>
                  <div className="text-lg font-bold">{formatTime(time)}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Best Moves</div>
                  <div className="text-lg font-bold text-amber-500">
                    {bestMoves === Infinity ? "-" : bestMoves}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-background/50 border-amber-500/20">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Best Time</div>
                  <div className="text-lg font-bold text-amber-500">
                    {bestTime === Infinity ? "-" : formatTime(bestTime)}
                  </div>
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
            Click tiles adjacent to the empty space to move them
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PuzzleGame;
