
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { ResultOverlay } from '../components/ui/ResultOverlay';

interface MinesProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

const GRID_SIZE = 25; // 5x5

export const Mines: React.FC<MinesProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'cashed' | 'lost'>('betting');
  const [mines, setMines] = useState<number[]>([]); 
  const [revealed, setRevealed] = useState<boolean[]>(Array(GRID_SIZE).fill(false));
  const [aiCommentary, setAiCommentary] = useState('');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [lastClicked, setLastClicked] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ status: 'WIN' | 'LOSE', amount: number } | null>(null);

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const startGame = () => {
    if (balance < bet) return;
    playSound('click');
    onEndGame(-bet);

    const newMines: number[] = [];
    while (newMines.length < mineCount) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      if (!newMines.includes(r)) newMines.push(r);
    }

    setMines(newMines);
    setRevealed(Array(GRID_SIZE).fill(false));
    setGameState('playing');
    setAiCommentary('');
    setLastResult(null);
    setCurrentMultiplier(1.0);
    setLastClicked(null);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing' || revealed[index]) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    setLastClicked(index);

    if (mines.includes(index)) {
      playSound('explosion');
      setGameState('lost');
      setLastResult({ status: 'LOSE', amount: -bet });
      triggerAI(`Boom! Mine at tile ${index}.`);
      setRevealed(Array(GRID_SIZE).fill(true));
    } else {
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
    setLastResult({ status: 'WIN', amount: winAmount - bet });
    triggerAI(`Secured the bag. ${currentMultiplier.toFixed(2)}x win.`);
    setRevealed(Array(GRID_SIZE).fill(true)); 
  };

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4 md:p-8">
      <div className="h-8 mb-4 text-center">
          {aiCommentary && <span className="text-rose-400 bg-slate-900/80 px-4 py-1 rounded-full text-sm">{aiCommentary}</span>}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full">
         {/* Sidebar */}
         <div className="w-full lg:w-80 bg-slate-800/90 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-6 order-2 lg:order-1 h-fit">
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Bet Amount</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500">$</span>
                    <input 
                        type="number" 
                        value={bet} 
                        onChange={(e) => setBet(Number(e.target.value))}
                        disabled={gameState === 'playing'}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-8 text-white font-mono outline-none focus:border-rose-500"
                    />
                </div>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mines</label>
                <div className="grid grid-cols-5 gap-1">
                    {[1, 3, 5, 10, 20].map(count => (
                        <button
                            key={count}
                            onClick={() => setMineCount(count)}
                            disabled={gameState === 'playing'}
                            className={`py-2 rounded text-xs font-bold transition-colors ${mineCount === count ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                        >
                            {count}
                        </button>
                    ))}
                </div>
            </div>
            
            {gameState === 'playing' ? (
                <div className="mt-auto">
                    <div className="text-center mb-4">
                        <div className="text-slate-400 text-xs uppercase">Current Payout</div>
                        <div className="text-2xl font-mono font-black text-emerald-400">${(bet * currentMultiplier).toFixed(2)}</div>
                    </div>
                    <Button variant="success" fullWidth onClick={cashOut} className="h-14 text-lg font-black shadow-[0_0_20px_#10b981]">CASH OUT</Button>
                </div>
            ) : (
                <Button variant="primary" fullWidth onClick={startGame} disabled={balance < bet} className="h-14 text-lg font-black mt-auto bg-rose-600 border-rose-700 hover:bg-rose-500">START</Button>
            )}
         </div>

         {/* Grid */}
         <div className="flex-1 bg-slate-900 p-4 md:p-8 rounded-[2rem] border-4 border-slate-800 shadow-2xl order-1 lg:order-2 flex items-center justify-center relative">
            {/* RESULT OVERLAY */}
            {lastResult && <ResultOverlay result={lastResult.status} amount={lastResult.amount} />}

            <div className="grid grid-cols-5 gap-2 md:gap-3 w-full max-w-[500px] aspect-square">
                {Array.from({ length: GRID_SIZE }).map((_, i) => {
                    const isRevealed = revealed[i];
                    const isMine = mines.includes(i);
                    const exploded = isRevealed && isMine && gameState === 'lost' && lastClicked === i;
                    
                    return (
                        <button
                            key={i}
                            onClick={() => handleTileClick(i)}
                            disabled={gameState !== 'playing' && !isRevealed}
                            className={`
                                rounded-xl relative transition-all duration-200
                                ${isRevealed 
                                    ? isMine 
                                        ? `bg-rose-900 border border-rose-600 ${exploded ? 'animate-bounce z-10 scale-110 bg-rose-600' : ''}` 
                                        : 'bg-slate-800 border border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]'
                                    : 'bg-slate-700 hover:bg-slate-600 shadow-[0_4px_0_#1e293b] active:translate-y-[4px] active:shadow-none'
                                }
                            `}
                        >
                            {isRevealed && (
                                <span className="absolute inset-0 flex items-center justify-center text-2xl md:text-4xl animate-scale-up">
                                    {isMine ? '💣' : '💎'}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
         </div>
      </div>
    </div>
  );
};
