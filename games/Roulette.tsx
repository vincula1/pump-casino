
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { GameEvent, GameType } from '../types';
import { ResultOverlay } from '../components/ui/ResultOverlay';

interface RouletteProps {
  onEndGame: (winnings: number) => void;
  onGameEvent?: (event: GameEvent) => void;
  balance: number;
  currentUser?: string;
}

// European Roulette Sequence
const WHEEL_NUMBERS = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number) => {
  if (num === 0) return 'green';
  if (RED_NUMBERS.includes(num)) return 'red';
  return 'black';
};

// Helper to generate SVG path for a slice
const getSlicePath = (index: number, total: number, radius: number) => {
  const startAngle = (index * 360) / total;
  const endAngle = ((index + 1) * 360) / total;
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  const x1 = 50 + radius * Math.cos(startRad);
  const y1 = 50 + radius * Math.sin(startRad);
  const x2 = 50 + radius * Math.cos(endRad);
  const y2 = 50 + radius * Math.sin(endRad);
  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
};

type BetType = 'red' | 'black' | 'green';

export const Roulette: React.FC<RouletteProps> = ({ onEndGame, onGameEvent, balance, currentUser }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ number: number; color: string } | null>(null);
  const [aiCommentary, setAiCommentary] = useState('');
  const [lastResult, setLastResult] = useState<{ status: 'WIN' | 'LOSE', amount: number } | null>(null);

  // Initialize with random rotation
  useEffect(() => {
      setRotation(Math.floor(Math.random() * 360));
  }, []);

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  const spinWheel = () => {
    if (!selectedBet || balance < betAmount) return;
    
    playSound('click');
    onEndGame(-betAmount);
    setSpinning(true);
    setResult(null);
    setLastResult(null);
    setAiCommentary('');

    // 1. Determine result
    const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const winningNumber = WHEEL_NUMBERS[randomIndex];
    const winningColor = getNumberColor(winningNumber);

    // 2. Calculate rotation
    const sliceAngle = 360 / 37;
    const index = randomIndex; 
    const targetAngleOnWheel = index * sliceAngle + (sliceAngle / 2);
    
    const currentRot = rotation;
    const spins = 5; 
    const degreesPerSpin = 360;
    
    const targetRotation = (360 - targetAngleOnWheel); 
    const currentMod = currentRot % 360;
    let dist = targetRotation - currentMod;
    if (dist < 0) dist += 360;
    
    const totalRotationToAdd = (spins * degreesPerSpin) + dist;
    const finalRotation = currentRot + totalRotationToAdd;

    setRotation(finalRotation);
    
    const duration = 4000;

    setTimeout(() => {
      setSpinning(false);
      setResult({ number: winningNumber, color: winningColor });
      
      // Determine Win
      let isWin = false;
      let payoutMultiplier = 0;
      let winnings = 0;

      if (selectedBet === 'green' && winningColor === 'green') {
          isWin = true;
          payoutMultiplier = 14; 
      } else if (selectedBet === 'red' && winningColor === 'red') {
          isWin = true;
          payoutMultiplier = 2;
      } else if (selectedBet === 'black' && winningColor === 'black') {
          isWin = true;
          payoutMultiplier = 2;
      }

      if (isWin) {
        winnings = betAmount * payoutMultiplier;
        onEndGame(winnings); 
        playSound('win');
        setLastResult({ status: 'WIN', amount: winnings - betAmount });
        triggerAI(`Roulette Hit! ${winningNumber} (${winningColor})`);
      } else {
        playSound('lose');
        setLastResult({ status: 'LOSE', amount: -betAmount });
        triggerAI(`Missed. Result: ${winningNumber}`);
      }

      if (onGameEvent) {
        onGameEvent({
            id: Date.now().toString(),
            username: currentUser || 'Player',
            game: GameType.ROULETTE,
            payout: isWin ? winnings : -betAmount,
            isWin: isWin,
            multiplier: isWin ? payoutMultiplier : undefined,
            timestamp: Date.now()
        });
      }

    }, duration);
  };

  return (
    <div className="flex flex-col items-center w-full p-4 md:p-6 relative">
      
      <div className="mb-8 h-8 text-gold-400 font-medium text-center min-h-[2rem]">
          {aiCommentary && <span className="animate-fade-in bg-slate-800/80 px-4 py-1 rounded-full border border-slate-700 shadow-lg">{aiCommentary}</span>}
      </div>

      {/* Realistic SVG Wheel */}
      <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] mb-12 drop-shadow-2xl">
         
         {/* RESULT OVERLAY - Now correctly placed to float over the wheel without clipping */}
         {lastResult && (
             <div className="absolute inset-0 z-50 flex items-center justify-center">
                 <ResultOverlay result={lastResult.status} amount={lastResult.amount} />
             </div>
         )}

         {/* Pointer */}
         <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-gold-500 drop-shadow-lg filter drop-shadow-md"></div>

         {/* Rotating Part */}
         <div 
            className="w-full h-full rounded-full border-[12px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
            style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
            }}
         >
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {WHEEL_NUMBERS.map((num, i) => {
                    const color = getNumberColor(num);
                    const fill = color === 'green' ? '#10b981' : color === 'red' ? '#dc2626' : '#1e293b';
                    const sliceAngle = 360 / 37;
                    const startAngle = i * sliceAngle;
                    const midAngle = startAngle + (sliceAngle / 2);
                    const midRad = (midAngle - 90) * (Math.PI / 180);
                    const tx = 50 + 40 * Math.cos(midRad);
                    const ty = 50 + 40 * Math.sin(midRad);
                    const tRot = midAngle; 

                    return (
                        <g key={i}>
                            <path d={getSlicePath(i, 37, 50)} fill={fill} stroke="#0f172a" strokeWidth="0.5" />
                            <text
                                x={tx}
                                y={ty}
                                fill="white"
                                fontSize="3.5" 
                                fontWeight="bold"
                                fontFamily="monospace"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${tRot}, ${tx}, ${ty})`}
                                style={{ pointerEvents: 'none' }}
                            >
                                {num}
                            </text>
                        </g>
                    );
                })}
                {/* Inner Hub */}
                <circle cx="50" cy="50" r="15" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
            </svg>
         </div>
      </div>
      
      {/* Result Display */}
      <div className="h-16 mb-8 flex items-center justify-center">
         {result && !lastResult && (
             <div className="flex flex-col items-center animate-slide-up">
                 <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Result</span>
                 <div className={`text-4xl font-black flex items-center gap-3 px-8 py-2 rounded-xl border-2 shadow-xl ${
                     result.color === 'red' ? 'bg-red-900/50 border-red-500 text-red-400' :
                     result.color === 'green' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' :
                     'bg-slate-800 border-slate-500 text-white'
                 }`}>
                    <span>{result.number}</span>
                    <span className="text-lg opacity-80 uppercase">{result.color}</span>
                 </div>
             </div>
         )}
      </div>

      {/* Betting Board */}
      <div className="bg-slate-800/80 p-6 md:p-8 rounded-3xl border border-slate-700/50 w-full max-w-4xl shadow-2xl backdrop-blur-sm">
        <div className="flex gap-4 mb-8 justify-center overflow-x-auto pb-2">
           <button 
             onClick={() => { setSelectedBet('red'); playSound('click'); setLastResult(null); }}
             className={`flex-1 min-w-[100px] h-20 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'red' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-red-800 opacity-90'}`}
           >
             <span className="text-xl block">RED</span>
             <div className="text-[10px] opacity-75 uppercase tracking-wider">2x</div>
           </button>
           <button 
             onClick={() => { setSelectedBet('green'); playSound('click'); setLastResult(null); }}
             className={`w-24 h-20 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'green' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-emerald-800 opacity-90'}`}
           >
             <span className="text-xl block">0</span>
             <div className="text-[10px] opacity-75 uppercase tracking-wider">14x</div>
           </button>
           <button 
             onClick={() => { setSelectedBet('black'); playSound('click'); setLastResult(null); }}
             className={`flex-1 min-w-[100px] h-20 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'black' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-black opacity-90'}`}
           >
             <span className="text-xl block">BLACK</span>
             <div className="text-[10px] opacity-75 uppercase tracking-wider">2x</div>
           </button>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
          <div className="flex-1 w-full">
            <label className="text-slate-400 text-xs font-bold uppercase mb-3 block tracking-widest">Wager Amount</label>
            <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">$</span>
                <input 
                    type="number" 
                    value={betAmount} 
                    onChange={e => setBetAmount(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-600 p-4 pl-10 rounded-xl text-white w-full text-xl font-mono focus:border-gold-400 outline-none shadow-inner transition-colors"
                />
            </div>
          </div>
          <Button 
            className="w-full md:w-auto h-[62px] px-12 text-lg font-bold shadow-xl" 
            variant="gold" 
            onClick={spinWheel} 
            disabled={spinning || !selectedBet || balance < betAmount}
          >
            {spinning ? 'SPINNING...' : 'SPIN'}
          </Button>
        </div>
      </div>
    </div>
  );
};
