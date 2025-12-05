import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Undo } from "lucide-react";

interface SpiderGameProps {
  onScoreSubmit?: (score: number) => Promise<boolean>;
}

type Suit = "♠" | "♥" | "♦" | "♣";
type CardType = { suit: Suit; value: number; faceUp: boolean };
type Column = CardType[];
type GameHistory = { columns: Column[]; stock: CardType[]; score: number }[];

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const createDeck = (numSuits: number): CardType[] => {
  const deck: CardType[] = [];
  const suitsToUse = SUITS.slice(0, numSuits);
  const decksNeeded = 8 / numSuits;
  
  for (let d = 0; d < decksNeeded; d++) {
    for (const suit of suitsToUse) {
      for (const value of VALUES) {
        deck.push({ suit, value, faceUp: false });
      }
    }
  }
  
  return deck;
};

const shuffleDeck = (deck: CardType[]): CardType[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getValueDisplay = (value: number): string => {
  if (value === 1) return "A";
  if (value === 11) return "J";
  if (value === 12) return "Q";
  if (value === 13) return "K";
  return value.toString();
};

const SpiderGame = ({ onScoreSubmit }: SpiderGameProps) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [stock, setStock] = useState<CardType[]>([]);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [score, setScore] = useState(500);
  const [moves, setMoves] = useState(0);
  const [completedSuits, setCompletedSuits] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
  const [history, setHistory] = useState<GameHistory>([]);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("spider_high_score");
    return saved ? parseInt(saved) : 0;
  });

  const initGame = useCallback(() => {
    const deck = shuffleDeck(createDeck(1)); // 1 suit for easier game
    const newColumns: Column[] = [];
    
    // Deal cards to 10 columns
    let cardIndex = 0;
    for (let col = 0; col < 10; col++) {
      const numCards = col < 4 ? 6 : 5;
      const column: Column = [];
      for (let i = 0; i < numCards; i++) {
        const card = { ...deck[cardIndex++] };
        card.faceUp = i === numCards - 1; // Only last card face up
        column.push(card);
      }
      newColumns.push(column);
    }
    
    // Remaining cards go to stock
    const newStock = deck.slice(cardIndex).map(c => ({ ...c, faceUp: false }));
    
    setColumns(newColumns);
    setStock(newStock);
    setScore(500);
    setMoves(0);
    setCompletedSuits(0);
    setSelectedCol(null);
    setSelectedCardIdx(null);
    setHistory([]);
    setGameState("playing");
  }, []);

  const saveState = useCallback(() => {
    setHistory(prev => [...prev, {
      columns: columns.map(col => col.map(card => ({ ...card }))),
      stock: stock.map(card => ({ ...card })),
      score,
    }]);
  }, [columns, stock, score]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setColumns(lastState.columns);
    setStock(lastState.stock);
    setScore(lastState.score);
    setHistory(prev => prev.slice(0, -1));
    setSelectedCol(null);
    setSelectedCardIdx(null);
  }, [history]);

  const canMoveSequence = (column: Column, startIdx: number): boolean => {
    for (let i = startIdx; i < column.length - 1; i++) {
      if (!column[i].faceUp || !column[i + 1].faceUp) return false;
      if (column[i].value !== column[i + 1].value + 1) return false;
      if (column[i].suit !== column[i + 1].suit) return false;
    }
    return true;
  };

  const checkAndRemoveCompleteSuit = useCallback((newColumns: Column[]): boolean => {
    for (let col = 0; col < newColumns.length; col++) {
      const column = newColumns[col];
      if (column.length < 13) continue;
      
      // Check if last 13 cards form a complete sequence
      const startIdx = column.length - 13;
      let isComplete = true;
      const suit = column[startIdx].suit;
      
      for (let i = 0; i < 13; i++) {
        const card = column[startIdx + i];
        if (!card.faceUp || card.suit !== suit || card.value !== 13 - i) {
          isComplete = false;
          break;
        }
      }
      
      if (isComplete) {
        newColumns[col] = column.slice(0, startIdx);
        if (newColumns[col].length > 0 && !newColumns[col][newColumns[col].length - 1].faceUp) {
          newColumns[col][newColumns[col].length - 1].faceUp = true;
        }
        return true;
      }
    }
    return false;
  }, []);

  const handleCardClick = useCallback((colIdx: number, cardIdx: number) => {
    if (gameState !== "playing") return;
    
    const column = columns[colIdx];
    const card = column[cardIdx];
    
    if (!card.faceUp) return;
    
    // If no card selected, select this one if it's a valid sequence
    if (selectedCol === null) {
      if (canMoveSequence(column, cardIdx)) {
        setSelectedCol(colIdx);
        setSelectedCardIdx(cardIdx);
      }
      return;
    }
    
    // If same column clicked, deselect
    if (selectedCol === colIdx) {
      setSelectedCol(null);
      setSelectedCardIdx(null);
      return;
    }
    
    // Try to move
    const sourceCol = columns[selectedCol];
    const movingCards = sourceCol.slice(selectedCardIdx!);
    const targetCard = column[column.length - 1];
    
    // Can only place on a card one value higher (or empty column)
    if (column.length === 0 || (targetCard && targetCard.value === movingCards[0].value + 1)) {
      saveState();
      
      const newColumns = columns.map(c => [...c]);
      newColumns[selectedCol] = sourceCol.slice(0, selectedCardIdx!);
      newColumns[colIdx] = [...column, ...movingCards];
      
      // Flip top card of source column if needed
      if (newColumns[selectedCol].length > 0) {
        const topCard = newColumns[selectedCol][newColumns[selectedCol].length - 1];
        if (!topCard.faceUp) {
          newColumns[selectedCol][newColumns[selectedCol].length - 1] = { ...topCard, faceUp: true };
        }
      }
      
      // Check for completed suit
      if (checkAndRemoveCompleteSuit(newColumns)) {
        setCompletedSuits(prev => {
          const newCompleted = prev + 1;
          if (newCompleted === 8) {
            setGameState("won");
            if (score > highScore) {
              setHighScore(score);
              localStorage.setItem("spider_high_score", score.toString());
              onScoreSubmit?.(score);
            }
          }
          return newCompleted;
        });
        setScore(s => s + 100);
      }
      
      setColumns(newColumns);
      setMoves(m => m + 1);
      setScore(s => s - 1);
    }
    
    setSelectedCol(null);
    setSelectedCardIdx(null);
  }, [columns, selectedCol, selectedCardIdx, gameState, saveState, checkAndRemoveCompleteSuit, score, highScore, onScoreSubmit]);

  const handleColumnClick = useCallback((colIdx: number) => {
    if (gameState !== "playing" || selectedCol === null) return;
    
    const column = columns[colIdx];
    if (column.length > 0) return;
    
    // Move to empty column
    saveState();
    
    const sourceCol = columns[selectedCol];
    const movingCards = sourceCol.slice(selectedCardIdx!);
    
    const newColumns = columns.map(c => [...c]);
    newColumns[selectedCol] = sourceCol.slice(0, selectedCardIdx!);
    newColumns[colIdx] = movingCards;
    
    // Flip top card of source column
    if (newColumns[selectedCol].length > 0) {
      const topCard = newColumns[selectedCol][newColumns[selectedCol].length - 1];
      if (!topCard.faceUp) {
        newColumns[selectedCol][newColumns[selectedCol].length - 1] = { ...topCard, faceUp: true };
      }
    }
    
    setColumns(newColumns);
    setMoves(m => m + 1);
    setScore(s => s - 1);
    setSelectedCol(null);
    setSelectedCardIdx(null);
  }, [columns, selectedCol, selectedCardIdx, gameState, saveState]);

  const dealFromStock = useCallback(() => {
    if (stock.length === 0 || gameState !== "playing") return;
    
    // Check all columns have at least one card
    if (columns.some(col => col.length === 0)) return;
    
    saveState();
    
    const newStock = [...stock];
    const newColumns = columns.map(col => [...col]);
    
    for (let i = 0; i < 10; i++) {
      const card = newStock.pop()!;
      card.faceUp = true;
      newColumns[i].push(card);
    }
    
    // Check for completed suits after dealing
    while (checkAndRemoveCompleteSuit(newColumns)) {
      setCompletedSuits(prev => prev + 1);
      setScore(s => s + 100);
    }
    
    setStock(newStock);
    setColumns(newColumns);
    setSelectedCol(null);
    setSelectedCardIdx(null);
  }, [stock, columns, gameState, saveState, checkAndRemoveCompleteSuit]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-center">🕷️ Spider Solitaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-4">
              <span>Score: <strong className="text-primary">{score}</strong></span>
              <span>Moves: <strong>{moves}</strong></span>
              <span>Completed: <strong className="text-green-500">{completedSuits}/8</strong></span>
            </div>
            <div className="flex gap-2">
              <Button onClick={undo} variant="outline" size="sm" disabled={history.length === 0 || gameState !== "playing"}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button onClick={initGame} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {gameState === "idle" ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="text-6xl">🕷️</div>
              <Button onClick={initGame} size="lg">
                <Play className="h-5 w-5 mr-2" />
                Start Game
              </Button>
              <p className="text-sm text-muted-foreground">
                Best Score: <span className="text-amber-500 font-bold">{highScore}</span>
              </p>
            </div>
          ) : (
            <>
              <div 
                className="flex gap-1 overflow-x-auto pb-2"
                style={{ minHeight: 320 }}
              >
                {columns.map((column, colIdx) => (
                  <div
                    key={colIdx}
                    className={`relative w-16 min-h-[280px] rounded border-2 transition-colors ${
                      selectedCol === colIdx ? "border-primary" : "border-border/30"
                    } ${column.length === 0 ? "bg-background/20" : ""}`}
                    onClick={() => column.length === 0 && handleColumnClick(colIdx)}
                  >
                    {column.map((card, cardIdx) => (
                      <div
                        key={cardIdx}
                        className={`absolute w-14 h-20 rounded border transition-all cursor-pointer ${
                          selectedCol === colIdx && selectedCardIdx !== null && cardIdx >= selectedCardIdx
                            ? "ring-2 ring-primary shadow-lg"
                            : ""
                        } ${card.faceUp ? "bg-white" : "bg-gradient-to-br from-blue-800 to-blue-900"}`}
                        style={{ top: cardIdx * 20, left: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(colIdx, cardIdx);
                        }}
                      >
                        {card.faceUp ? (
                          <div className={`p-1 text-xs font-bold ${
                            card.suit === "♥" || card.suit === "♦" ? "text-red-600" : "text-black"
                          }`}>
                            <div>{getValueDisplay(card.value)}</div>
                            <div className="text-lg">{card.suit}</div>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgxMHYxMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] " />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <Button 
                  onClick={dealFromStock} 
                  disabled={stock.length === 0 || columns.some(col => col.length === 0)}
                  variant="outline"
                  className="gap-2"
                >
                  Deal ({Math.floor(stock.length / 10)} left)
                </Button>
                
                {gameState === "won" && (
                  <div className="text-green-500 font-bold animate-pulse">
                    🎉 You Won! Score: {score}
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="text-xs text-muted-foreground text-center">
            Click to select cards, then click destination to move
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpiderGame;
