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

  const revealCell = useCallback((x: number, y: number, currentGrid: Cell[][]): Cell[][] => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return currentGrid;
    if (currentGrid[y][x].isRevealed || currentGrid[y][x].isFlagged) return currentGrid;

    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    newGrid[y][x].isRevealed = true;

    if (newGrid[y][x].adjacentMines === 0 && !newGrid[y][x].isMine) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dy !== 0 || dx !== 0) {
            const result = revealCell(x + dx, y + dy, newGrid);
            for (let i = 0; i < GRID_SIZE; i++) {
              for (let j = 0; j < GRID_SIZE; j++) {
                newGrid[i][j] = result[i][j];
              }
            }
          }
        }
      }
    }

    return newGrid;
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

    const newGrid = revealCell(x, y, grid);
    setGrid(newGrid);

    if (checkWin(newGrid)) {
      setWon(true);
      const newWins = gamesWon + 1;
      setGamesWon(newWins);
      localStorage.setItem("minesweeperWins", newWins.toString());
      
      // Submit win to leaderboard
      if (onScoreSubmit) {
        const success = await onScoreSubmit(newWins);
        if (success) {
          toast.success(`Win #${newWins} submitted to leaderboard!`);
        }
      }
    }
  }, [grid, gameOver, won, revealCell, checkWin, gamesWon, onScoreSubmit]);

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
  }, []);

  const getCellColor = (cell: Cell): string => {
    const colors = [
      "", "text-blue-500", "text-green-500", "text-red-500", 
      "text-purple-500", "text-orange-500", "text-cyan-500", "text-pink-500", "text-gray-500"
    ];
    return colors[cell.adjacentMines] || "";
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bomb className="h-6 w-6" />
            Minesweeper
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
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-red-500" />
            <span className="font-bold">{flagCount}/{MINE_COUNT}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-bold">{gamesWon} wins</span>
          </div>
        </div>

        <div className="relative">
          <div 
            className="grid gap-0.5 bg-border p-1 rounded-lg"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onContextMenu={(e) => handleRightClick(e, x, y)}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm font-bold rounded transition-colors",
                    cell.isRevealed
                      ? cell.isMine
                        ? "bg-red-500 text-white"
                        : "bg-muted"
                      : "bg-primary/20 hover:bg-primary/30",
                    getCellColor(cell)
                  )}
                  disabled={gameOver || won}
                >
                  {cell.isFlagged && !cell.isRevealed && <Flag className="h-4 w-4 text-red-500" />}
                  {cell.isRevealed && cell.isMine && <Bomb className="h-4 w-4" />}
                  {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && cell.adjacentMines}
                </button>
              ))
            )}
          </div>

          {(gameOver || won) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <p className={cn("text-xl font-bold mb-2", won ? "text-green-500" : "text-destructive")}>
                  {won ? "You Won! 🎉" : "Game Over!"}
                </p>
                <Button onClick={resetGame}>
                  <RotateCcw className="h-4 w-4 mr-2" />
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
