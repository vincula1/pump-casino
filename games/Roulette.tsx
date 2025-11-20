
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface RouletteProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

type BetType = 'red' | 'black' | 'green';

// European Roulette Layout (0-36)
const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num: number): 'green' | 'red' | 'black' => {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
};

export const Roulette: React.FC<RouletteProps> = ({ onEndGame, balance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [aiCommentary, setAiCommentary] = useState('');
  
  // Animation States
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [lastNumber, setLastNumber] = useState<number | null>(null);

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  const spinWheel = () => {
    if (!selectedBet || balance < betAmount) return;
    playSound('click');
    onEndGame(-betAmount);
    setSpinning(true);
    setLastNumber(null);
    setAiCommentary('');

    // 1. Determine Result logic (same odds as before)
    const outcome = Math.random();
    let winningColor: BetType = 'black';
    if (outcome < 0.027) winningColor = 'green'; // 1/37 approx
    else if (outcome < 0.5135) winningColor = 'red'; // ~48.6%
    else winningColor = 'black'; // ~48.6%

    // 2. Find a number on the wheel that matches the winning color
    const possibleNumbers = WHEEL_NUMBERS.filter(n => getNumberColor(n) === winningColor);
    const winningNumber = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
    const winningIndex = WHEEL_NUMBERS.indexOf(winningNumber);

    // 3. Calculate Rotations
    // A segment is 360 / 37 degrees
    const segmentAngle = 360 / 37;
    
    // We want the winning number to land at the TOP (0 degrees visually)
    // The wheel numbers array is ordered clockwise. 
    // If index 0 is at top, to get index 5 at top, we rotate - (5 * segment).
    // We add randomness within the segment.
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);
    
    // Calculate target wheel angle (Spin clockwise)
    // We want 5-10 full rotations + alignment
    const wheelSpins = 5; 
    const targetWheelRotation = wheelRotation + (360 * wheelSpins) + ((37 - winningIndex) * segmentAngle) + randomOffset;

    // 4. Ball Animation (Spin Counter-Clockwise)
    // Ball spins opposite to wheel. It needs to land in the slot.
    // Visually, we rotate the ball's container.
    // To make it look like it lands, we match the ball rotation to the wheel rotation at the end
    // PLUS an offset to place it exactly on the winning number relative to the wheel.
    // Actually, easiest CSS trick: Spin wheel one way. Spin ball other way. 
    // Ball simply stops spinning relative to wheel container? No, ball is separate.
    
    // Simplified Physics Approach:
    // We spin the WHEEL container to land with winning number at top.
    // We spin the BALL container around the center.
    // The ball eventually stops at a random position? No, it must land on the number.
    
    // TRICK: We will rotate the *Wheel* to the correct angle.
    // We will rotate the *Ball* to sync with that angle at the end.
    // Since the winning number ends at TOP (0deg), the ball should end at TOP (0deg).
    const ballSpins = 8;
    // Ball goes opposite (negative)
    const targetBallRotation = ballRotation - (360 * ballSpins); 

    setWheelRotation(targetWheelRotation);
    setBallRotation(targetBallRotation);
    
    // 5. Sound Effects Loop
    let spinTime = 0;
    const soundInterval = setInterval(() => {
        playSound('tick');
        spinTime += 150;
        if(spinTime > 3000) clearInterval(soundInterval);
    }, 150);

    // 6. End Game
    setTimeout(() => {
      setSpinning(false);
      setLastNumber(winningNumber);
      
      let win = 0;
      if (winningColor === selectedBet) {
        if (winningColor === 'green') win = betAmount * 14;
        else win = betAmount * 2;
        onEndGame(win);
        playSound('win');
        triggerAI(`User hit ${winningNumber} (${winningColor.toUpperCase()})! Huge win!`);
      } else {
        playSound('lose');
        triggerAI(`Result: ${winningNumber} (${winningColor}). Better luck next time.`);
      }
    }, 4000); // Match CSS transition duration
  };

  return (
    <div className="flex flex-col items-center w-full p-4 md:p-8">
      <div className="mb-8 h-8 text-gold-400 font-medium text-center flex items-center justify-center">
          {aiCommentary && <span className="animate-fade-in bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700/50 backdrop-blur text-sm shadow-lg">{aiCommentary}</span>}
      </div>

      {/* 3D Wheel Container */}
      <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mb-16 scale-100 md:scale-110">
        {/* Outer Bezel */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-900 to-amber-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-amber-900 ring-1 ring-white/10"></div>
        <div className="absolute inset-2 rounded-full bg-slate-950 shadow-inner"></div>
        
        {/* The Spinning Wheel */}
        <div 
          className="absolute inset-4 rounded-full transition-transform duration-[4000ms] cubic-bezier(0.15, 0.85, 0.15, 1.00)"
          style={{ transform: `rotate(${wheelRotation}deg)` }}
        >
            {/* Wheel Background / Sectors */}
            <div className="w-full h-full rounded-full overflow-hidden relative shadow-2xl border-4 border-gold-600/50">
                {/* Conic Gradient for Slots */}
                <div className="w-full h-full absolute inset-0" style={{
                    background: `conic-gradient(
                        #10b981 0deg 9.7deg,
                        ${WHEEL_NUMBERS.slice(1).map((n, i) => {
                            const color = getNumberColor(n) === 'red' ? '#ef4444' : '#1f2937';
                            const start = 9.7 + (i * 9.73);
                            const end = start + 9.73;
                            return `${color} ${start}deg ${end}deg`;
                        }).join(', ')}
                    )`
                }}></div>

                {/* Inner Ring to separate numbers */}
                <div className="absolute inset-[15%] rounded-full bg-transparent border-[2px] border-gold-500/30"></div>
            </div>
        </div>

        {/* The Ball Track (Static visually, but contains the rotating ball) */}
        <div className="absolute inset-[22px] rounded-full pointer-events-none">
             {/* The Ball Container rotates */}
             <div 
                className="w-full h-full rounded-full transition-transform duration-[4000ms] cubic-bezier(0.12, 0.68, 0.2, 1.00)"
                style={{ transform: `rotate(${ballRotation}deg)` }}
             >
                 {/* The Ball itself - Positioned at top */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[3px] w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_white] z-20 filter drop-shadow-md"></div>
             </div>
        </div>

        {/* Center Hub */}
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-gradient-to-br from-gold-400 to-yellow-700 shadow-[0_5px_15px_rgba(0,0,0,0.3)] flex items-center justify-center z-30 border-4 border-amber-900">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-gold-500/30">
                {lastNumber !== null ? (
                    <span className={`text-2xl font-black ${getNumberColor(lastNumber) === 'red' ? 'text-red-500' : getNumberColor(lastNumber) === 'green' ? 'text-emerald-500' : 'text-white'}`}>
                        {lastNumber}
                    </span>
                ) : (
                    <span className="text-gold-500 font-bold text-[10px] tracking-widest">PUMP</span>
                )}
            </div>
        </div>

        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-40 text-gold-300 text-3xl drop-shadow-xl filter drop-shadow-lg">▼</div>
      </div>

      {/* Betting Board */}
      <div className="bg-slate-800/80 backdrop-blur-xl p-6 md:p-10 rounded-[2rem] border border-white/5 w-full max-w-3xl shadow-2xl relative overflow-hidden group">
        {/* Felt Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-30 pointer-events-none"></div>
        
        {/* Neon Glow behind board */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-900/20 blur-3xl -z-10"></div>
        
        <div className="flex gap-4 mb-8 relative z-10">
           <button 
             onClick={() => { setSelectedBet('red'); playSound('click'); }}
             className={`flex-1 h-24 rounded-2xl font-black text-white transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 relative overflow-hidden group/btn ${selectedBet === 'red' ? 'bg-red-600 border-red-800 ring-2 ring-white scale-105 z-10 shadow-xl shadow-red-900/50' : 'bg-slate-700 border-slate-900 hover:bg-red-900/50 opacity-80'}`}
           >
             <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
             <span className="text-3xl block drop-shadow-md">RED</span>
             <div className="text-[10px] opacity-75 mt-1 uppercase tracking-[0.2em]">2x Payout</div>
           </button>
           
           <button 
             onClick={() => { setSelectedBet('green'); playSound('click'); }}
             className={`w-24 md:w-32 h-24 rounded-2xl font-black text-white transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 relative overflow-hidden group/btn ${selectedBet === 'green' ? 'bg-emerald-500 border-emerald-700 ring-2 ring-white scale-105 z-10 shadow-xl shadow-emerald-900/50' : 'bg-slate-700 border-slate-900 hover:bg-emerald-900/50 opacity-80'}`}
           >
             <span className="text-3xl block drop-shadow-md">0</span>
             <div className="text-[10px] opacity-75 mt-1 uppercase tracking-[0.2em]">14x</div>
           </button>

           <button 
             onClick={() => { setSelectedBet('black'); playSound('click'); }}
             className={`flex-1 h-24 rounded-2xl font-black text-white transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 relative overflow-hidden group/btn ${selectedBet === 'black' ? 'bg-slate-900 border-black ring-2 ring-white scale-105 z-10 shadow-xl shadow-black/50' : 'bg-slate-700 border-slate-900 hover:bg-slate-800 opacity-80'}`}
           >
             <span className="text-3xl block drop-shadow-md">BLACK</span>
             <div className="text-[10px] opacity-75 mt-1 uppercase tracking-[0.2em]">2x Payout</div>
           </button>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-6 relative z-10 bg-slate-900/60 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md">
          <div className="flex-1 w-full">
            <label className="text-slate-400 text-xs font-bold uppercase mb-3 block tracking-widest">Place Your Bet</label>
            <div className="relative group/input">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-bold text-xl">$</span>
                <input 
                    type="number" 
                    value={betAmount} 
                    onChange={e => setBetAmount(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-700 p-4 pl-10 rounded-xl text-white w-full text-2xl font-mono focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none shadow-inner transition-all"
                />
            </div>
          </div>
          <Button 
            className="w-full md:w-auto h-[70px] px-12 text-xl font-black tracking-wide shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)]" 
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
