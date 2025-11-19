
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface MinesProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

const GRID_SIZE = 25; // 5x5

export const Mines: React.FC<MinesProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'cashed' | 'lost'>('betting');
  const [mines, setMines] = useState<number[]>([]); // Indices of mines
  const [revealed, setRevealed] = useState<boolean[]>(Array(GRID_SIZE).fill(false));
  const [aiCommentary, setAiCommentary] = useState('');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const getMultiplier = (mines: number, revealedCount: number) => {
    // Simplified multiplier logic based on probability
    // n! / (k! * (n-k)!) ... roughly
    // For simplicity, we multiply current mult by (remaining_tiles / remaining_safe)
    const remainingTiles = GRID_SIZE - revealedCount;
    const remainingSafe = GRID_SIZE - mines - revealedCount;
    return 0.99 * (remainingTiles / remainingSafe);
  };

  const startGame = () => {
    if (balance < bet) return;
    playSound('click');
    onEndGame(-bet);

    // Generate random mines
    const newMines: number[] = [];
    while (newMines.length < mineCount) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      if (!newMines.includes(r)) newMines.push(r);
    }

    setMines(newMines);
    setRevealed(Array(GRID_SIZE).fill(false));
    setGameState('playing');
    setAiCommentary('');
    setCurrentMultiplier(1.0);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing' || revealed[index]) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (mines.includes(index)) {
      // HIT MINE
      playSound('explosion');
      setGameState('lost');
      triggerAI(`User stepped on a mine! Boom.`);
      // Reveal all
      setRevealed(Array(GRID_SIZE).fill(true));
    } else {
      // SAFE
      playSound('gem');
      const revealedCount = newRevealed.filter(r => r).length;
      const nextMult = currentMultiplier * ( (GRID_SIZE - (revealedCount - 1)) / (GRID_SIZE - mineCount - (revealedCount - 1)) );
      setCurrentMultiplier(nextMult);
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing') return;
    playSound('win');
    const winAmount = bet * currentMultiplier;
    onEndGame(winAmount);
    setGameState('cashed');
    triggerAI(`User cashed out safely in Mines with ${currentMultiplier.toFixed(2)}x!`);
    setRevealed(Array(GRID_SIZE).fill(true)); // Show board
  };

  const renderTileContent = (index: number) => {
    if (!revealed[index] && gameState === 'playing') return null;
    
    // If game over or revealed
    if (mines.includes(index)) {
       return <span className="text-2xl md:text-4xl animate-bounce">💣</span>;
    }
    // Safe tile
    return <span className="text-2xl md:text-4xl animate-fade-in">💎</span>;
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 md:p-8">
      <div className="h-12 flex items-center justify-center w-full mb-4">
          {aiCommentary && <span className="text-rose-400 font-medium animate-fade-in text-center bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur shadow-lg">{aiCommentary}</span>}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full">
         {/* Control Panel */}
         <div className="w-full lg:w-1/3 bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col justify-between h-fit order-2 lg:order-1">
            <div>
                <div className="mb-6">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-3">Bet Amount</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
                        <input 
                            type="number" 
                            value={bet} 
                            onChange={(e) => setBet(Number(e.target.value))}
                            disabled={gameState === 'playing'}
                            className="w-full bg-slate-900 border border-slate-600 p-4 pl-8 rounded-xl text-white font-mono text-xl focus:border-rose-500 outline-none transition-all shadow-inner group-hover:bg-slate-900/80"
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-3">Mines ({mineCount})</label>
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 3, 5, 10, 20].map(count => (
                            <button
                                key={count}
                                onClick={() => { playSound('click'); setMineCount(count); }}
                                disabled={gameState === 'playing'}
                                className={`py-2 rounded-lg font-bold text-sm transition-all ${mineCount === count ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50 scale-105' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {gameState === 'playing' ? (
                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                        <div className="text-slate-400 text-xs uppercase mb-1">Current Profit</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400">+${(bet * currentMultiplier - bet).toFixed(2)}</div>
                    </div>
                    <Button 
                        variant="success" 
                        fullWidth 
                        className="h-16 text-xl font-black shadow-lg shadow-emerald-900/20"
                        onClick={cashOut}
                    >
                        CASH OUT ${(bet * currentMultiplier).toFixed(2)}
                    </Button>
                </div>
            ) : (
                <Button 
                    variant="primary" 
                    fullWidth 
                    className="h-16 text-xl font-black bg-rose-600 border-rose-700 hover:bg-rose-500 hover:border-rose-600 shadow-lg shadow-rose-900/20"
                    onClick={startGame}
                    disabled={balance < bet}
                >
                    PLAY
                </Button>
            )}
         </div>

         {/* Game Grid */}
         <div className="w-full lg:w-2/3 order-1 lg:order-2">
            <div className="bg-slate-900/80 p-4 md:p-6 rounded-[2rem] border border-slate-700 shadow-2xl relative overflow-hidden">
                {/* Grid Background effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 pointer-events-none"></div>
                
                <div className="grid grid-cols-5 gap-3 md:gap-4 relative z-10">
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => handleTileClick(i)}
                            disabled={gameState !== 'playing' && !revealed[i]}
                            className={`
                                aspect-square rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden
                                ${revealed[i] 
                                    ? (mines.includes(i) 
                                        ? 'bg-rose-900/80 border-2 border-rose-500 shadow-[inset_0_0_20px_rgba(244,63,94,0.5)]' 
                                        : 'bg-emerald-900/80 border-2 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.5)]') 
                                    : 'bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-900 hover:-translate-y-1 active:border-b-0 active:translate-y-1 active:bg-slate-700 shadow-lg'}
                                ${gameState === 'playing' && !revealed[i] ? 'cursor-pointer' : 'cursor-default'}
                            `}
                        >
                            {renderTileContent(i)}
                        </button>
                    ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
