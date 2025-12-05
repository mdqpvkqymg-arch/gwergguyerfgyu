import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Flag, Bomb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GRID_SIZE = 10;
const MINE_COUNT = 15;

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

interface MinesweeperGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

const MinesweeperGame = ({ onScoreSubmit }: MinesweeperGameProps) => {
  const [grid, setGrid] = useState<Cell[][]>(() => createGrid());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [gamesWon, setGamesWon] = useState(() => {
    const saved = localStorage.getItem("minesweeperWins");
    return saved ? parseInt(saved) : 0;
  });

  function createGrid(): Cell[][] {
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );

    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!newGrid[y][x].isMine) {
        newGrid[y][x].isMine = true;
        minesPlaced++;
      }
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!newGrid[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE && newGrid[ny][nx].isMine) {
                count++;
              }
            }
          }
          newGrid[y][x].adjacentMines = count;
        }
      }
    }

    return newGrid;
  }

  const revealCell = useCallback((x: number, y: number, currentGrid: Cell[][], revealed: Set<string>): { grid: Cell[][], revealed: Set<string> } => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return { grid: currentGrid, revealed };
    if (currentGrid[y][x].isRevealed || currentGrid[y][x].isFlagged) return { grid: currentGrid, revealed };

    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    const newRevealed = new Set(revealed);
    newGrid[y][x].isRevealed = true;
    newRevealed.add(`${x}-${y}`);

    if (newGrid[y][x].adjacentMines === 0 && !newGrid[y][x].isMine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy !== 0 || dx !== 0) {
            const result = revealCell(x + dx, y + dy, newGrid, newRevealed);
            for (let i = 0; i < GRID_SIZE; i++) {
              for (let j = 0; j < GRID_SIZE; j++) {
                newGrid[i][j] = result.grid[i][j];
              }
            }
            result.revealed.forEach(r => newRevealed.add(r));
          }
        }
      }
    }

    return { grid: newGrid, revealed: newRevealed };
  }, []);

  const checkWin = useCallback((currentGrid: Cell[][]): boolean => {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!currentGrid[y][x].isMine && !currentGrid[y][x].isRevealed) {
          return false;
        }
      }
    }
    return true;
  }, []);

  const handleCellClick = useCallback(async (x: number, y: number) => {
    if (gameOver || won) return;
    if (grid[y][x].isFlagged || grid[y][x].isRevealed) return;

    if (grid[y][x].isMine) {
      const newGrid = grid.map(row => row.map(cell => ({
        ...cell,
        isRevealed: cell.isMine ? true : cell.isRevealed,
      })));
      setGrid(newGrid);
      setGameOver(true);
      return;
    }

    const result = revealCell(x, y, grid, revealedCells);
    setGrid(result.grid);
    setRevealedCells(result.revealed);

    if (checkWin(result.grid)) {
      setWon(true);
      const newWins = gamesWon + 1;
      setGamesWon(newWins);
      localStorage.setItem("minesweeperWins", newWins.toString());
      
      if (onScoreSubmit) {
        const success = await onScoreSubmit(newWins);
        if (success) {
          toast.success(`Win #${newWins} submitted to leaderboard!`);
        }
      }
    }
  }, [grid, gameOver, won, revealCell, checkWin, gamesWon, onScoreSubmit, revealedCells]);

  const handleRightClick = useCallback((e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameOver || won) return;
    if (grid[y][x].isRevealed) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged;
    setGrid(newGrid);
    setFlagCount(prev => newGrid[y][x].isFlagged ? prev + 1 : prev - 1);
  }, [grid, gameOver, won]);

  const resetGame = useCallback(() => {
    setGrid(createGrid());
    setGameOver(false);
    setWon(false);
    setFlagCount(0);
    setRevealedCells(new Set());
  }, []);

  const getNumberColor = (num: number): string => {
    const colors = [
      "", 
      "text-blue-400", 
      "text-emerald-400", 
      "text-red-400", 
      "text-purple-400", 
      "text-amber-400", 
      "text-cyan-400", 
      "text-pink-400", 
      "text-gray-400"
    ];
    return colors[num] || "";
  };

  return (
    <div>
      <Card className="mb-6 bg-gradient-to-br from-slate-500/10 to-purple-500/10 border-slate-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bomb className="h-6 w-6 text-slate-400" />
            <span className="text-slate-200">Minesweeper</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Left click to reveal, right click to flag. Find all mines!
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-6 mb-2">
          <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-red-500/30">
            <Flag className="h-5 w-5 text-red-400" />
            <span className="font-bold text-xl text-red-400">{flagCount}</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-bold text-xl text-muted-foreground">{MINE_COUNT}</span>
          </div>
          <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-amber-500/30">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span className="font-bold text-xl text-amber-400">{gamesWon}</span>
            <span className="text-muted-foreground text-sm ml-1">wins</span>
          </div>
        </div>

        <div className="relative">
          <div 
            className="grid gap-1 p-3 rounded-xl"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              background: 'linear-gradient(135deg, hsl(220, 20%, 10%), hsl(220, 25%, 14%))',
              boxShadow: '0 0 40px hsl(260, 50%, 50% / 0.1), inset 0 0 30px hsl(220, 25%, 5%)',
              border: '2px solid hsl(220, 25%, 20%)',
            }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onContextMenu={(e) => handleRightClick(e, x, y)}
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm font-bold rounded-md transition-all duration-150",
                    cell.isRevealed
                      ? cell.isMine
                        ? "bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        : "bg-slate-800/80 shadow-inner"
                      : "bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-md hover:shadow-lg cursor-pointer border border-slate-500/30",
                    cell.isRevealed && revealedCells.has(`${x}-${y}`) && "animate-cell-reveal",
                    getNumberColor(cell.adjacentMines)
                  )}
                  disabled={gameOver || won}
                  style={{
                    textShadow: cell.isRevealed && cell.adjacentMines > 0 ? '0 0 8px currentColor' : 'none',
                  }}
                >
                  {cell.isFlagged && !cell.isRevealed && (
                    <Flag className="h-4 w-4 text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]" />
                  )}
                  {cell.isRevealed && cell.isMine && (
                    <Bomb className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                  {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && cell.adjacentMines}
                </button>
              ))
            )}
          </div>

          {(gameOver || won) && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="text-center">
                <p className={cn(
                  "text-2xl font-bold mb-4",
                  won 
                    ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                    : "text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                )}>
                  {won ? "🎉 Victory!" : "💥 Game Over!"}
                </p>
                <Button 
                  onClick={resetGame}
                  size="lg"
                  className={cn(
                    "shadow-lg",
                    won 
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-emerald-500/25"
                      : "bg-gradient-to-r from-slate-500 to-purple-500 hover:from-slate-600 hover:to-purple-600 shadow-purple-500/25"
                  )}
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesweeperGame;