
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { GameEvent, GameType } from '../types';

interface RouletteProps {
  onEndGame: (winnings: number) => void;
  onGameEvent?: (event: GameEvent) => void;
  balance: number;
  currentUser?: string;
}

// European Roulette Sequence (Standard)
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
  
  // Convert to radians, subtract 90deg to start at top
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);

  const x1 = 50 + radius * Math.cos(startRad);
  const y1 = 50 + radius * Math.sin(startRad);
  const x2 = 50 + radius * Math.cos(endRad);
  const y2 = 50 + radius * Math.sin(endRad);

  return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
};

type BetType = 'red' | 'black' | 'green' | 'even' | 'odd';

export const Roulette: React.FC<RouletteProps> = ({ onEndGame, onGameEvent, balance, currentUser }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ number: number; color: string } | null>(null);
  const [aiCommentary, setAiCommentary] = useState('');

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
    setAiCommentary('');

    // 1. Determine result upfront
    const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
    const winningNumber = WHEEL_NUMBERS[randomIndex];
    const winningColor = getNumberColor(winningNumber);

    // 2. Calculate rotation
    // Each slice is 360/37 degrees.
    // To land index `i` at the top (0 deg), the wheel must rotate `-(i * sliceAngle)`.
    // We add extra spins (5 full rotations) for effect.
    
    const sliceAngle = 360 / 37;
    // Target angle to put the winner at 12 o'clock
    const targetAngleInWheel = randomIndex * sliceAngle;
    
    const fudge = (Math.random() * sliceAngle * 0.8) - (sliceAngle * 0.4);
    
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const newRotation = rotation + (360 * extraSpins) + (360 - targetAngleInWheel) + fudge;

    // Adjust to ensure we always spin forward a significant amount
    const finalRotation = newRotation > rotation + 1000 ? newRotation : newRotation + 3600;

    setRotation(finalRotation);
    
    // Sound effect loop
    let spinTime = 0;
    const totalDuration = 4000;
    const soundInterval = setInterval(() => {
        spinTime += 150;
        if (spinTime < totalDuration - 500) { // Stop clicking just before end
             playSound('tick');
        } else {
            clearInterval(soundInterval);
        }
    }, 150);

    setTimeout(() => {
      setSpinning(false);
      setResult({ number: winningNumber, color: winningColor });
      
      // Determine Win
      let isWin = false;
      let payoutMultiplier = 0;
      let winnings = 0;

      if (selectedBet === 'green' && winningColor === 'green') {
          isWin = true;
          payoutMultiplier = 14; // Simplification for 0 bet
      } else if (selectedBet === 'red' && winningColor === 'red') {
          isWin = true;
          payoutMultiplier = 2;
      } else if (selectedBet === 'black' && winningColor === 'black') {
          isWin = true;
          payoutMultiplier = 2;
      }

      if (isWin) {
        winnings = betAmount * payoutMultiplier;
        onEndGame(winnings); // Add winnings
        playSound('win');
        triggerAI(`Player hit ${winningNumber} (${winningColor}) on Roulette! Huge win.`);
      } else {
        playSound('lose');
        triggerAI(`Roulette result: ${winningNumber} (${winningColor}). House wins.`);
      }

      // Trigger Feed Event
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

    }, totalDuration);
  };

  return (
    <div className="flex flex-col items-center w-full p-4 md:p-6">
      <div className="mb-8 h-8 text-gold-400 font-medium text-center min-h-[2rem]">
          {aiCommentary && <span className="animate-fade-in bg-slate-800/80 px-4 py-1 rounded-full border border-slate-700 shadow-lg">{aiCommentary}</span>}
      </div>

      {/* Realistic SVG Wheel */}
      <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] mb-12 drop-shadow-2xl">
         {/* Outer Rim */}
         <div className="absolute inset-0 rounded-full border-[12px] border-slate-800 bg-slate-900 shadow-2xl"></div>
         
         {/* Pointer */}
         <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-gold-500 drop-shadow-lg"></div>

         {/* Rotating Part */}
         <div 
            className="w-full h-full rounded-full transition-transform cubic-bezier(0.15, 0, 0.15, 1)"
            style={{ 
                transform: `rotate(${rotation}deg)`,
                transitionDuration: '4000ms'
            }}
         >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {WHEEL_NUMBERS.map((num, i) => {
                    const color = getNumberColor(num);
                    const fill = color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : '#1f2937';
                    // Calculate precise text positioning
                    // Slice Angle
                    const angle = (i * 360) / 37; 
                    const midAngle = angle + (180/37); // Middle of the slice
                    const rads = (midAngle * Math.PI) / 180;
                    
                    // Text Position (radius 43 to be comfortably inside the 48 slice radius)
                    const tx = 50 + 43 * Math.cos(rads);
                    const ty = 50 + 43 * Math.sin(rads);
                    
                    // Text Rotation (perpendicular to radius) + 90 degrees
                    const tRot = midAngle + 90;

                    return (
                        <g key={i}>
                            <path d={getSlicePath(i, 37, 48)} fill={fill} stroke="#0f172a" strokeWidth="0.2" />
                            <text
                                x={tx}
                                y={ty}
                                fill="white"
                                fontSize="2.5" 
                                fontWeight="bold"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${tRot}, ${tx}, ${ty})`}
                            >
                                {num}
                            </text>
                        </g>
                    );
                })}
                {/* Center Decoration */}
                <circle cx="50" cy="50" r="15" fill="#0f172a" stroke="#fbbf24" strokeWidth="1" />
                <circle cx="50" cy="50" r="2" fill="#fbbf24" />
            </svg>
         </div>
      </div>
      
      {/* Result Display */}
      <div className="h-16 mb-8 flex items-center justify-center">
         {result && (
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
             onClick={() => { setSelectedBet('red'); playSound('click'); }}
             className={`flex-1 min-w-[100px] h-20 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'red' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-red-800 opacity-90'}`}
           >
             <span className="text-xl block">RED</span>
             <div className="text-[10px] opacity-75 uppercase tracking-wider">2x</div>
           </button>
           <button 
             onClick={() => { setSelectedBet('green'); playSound('click'); }}
             className={`w-24 h-20 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'green' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-emerald-800 opacity-90'}`}
           >
             <span className="text-xl block">0</span>
             <div className="text-[10px] opacity-75 uppercase tracking-wider">14x</div>
           </button>
           <button 
             onClick={() => { setSelectedBet('black'); playSound('click'); }}
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
            {spinning ? 'SPINNING...' : 'PLACE BET & SPIN'}
          </Button>
        </div>
      </div>
    </div>
  );
};
