
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface RouletteProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

type BetType = 'red' | 'black' | 'green';

export const Roulette: React.FC<RouletteProps> = ({ onEndGame, balance }) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultColor, setResultColor] = useState<string | null>(null);
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
    setResultColor(null);
    setAiCommentary('');

    const outcome = Math.random();
    let color = 'green';
    const randomRot = 1440 + Math.random() * 360;
    
    if (outcome < 0.05) {
        color = 'green';
    } else if (outcome < 0.525) {
        color = 'red';
    } else {
        color = 'black';
    }

    setRotation(prev => prev + randomRot);
    
    // Simulate wheel sound
    let spinTime = 0;
    const soundInterval = setInterval(() => {
        playSound('tick');
        spinTime += 100;
        if(spinTime > 3500) clearInterval(soundInterval);
    }, 150);

    setTimeout(() => {
      setSpinning(false);
      setResultColor(color);
      
      let win = 0;
      if (color === selectedBet) {
        if (color === 'green') win = betAmount * 14;
        else win = betAmount * 2;
        onEndGame(win);
        playSound('win');
        triggerAI(`Player won huge on ${color} in Roulette!`);
      } else {
        playSound('lose');
        triggerAI(`Player lost on Roulette. Result was ${color}.`);
      }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center w-full p-6">
      <div className="mb-8 h-8 text-gold-400 font-medium text-center">
          {aiCommentary && <span className="animate-fade-in bg-slate-800 px-4 py-1 rounded-full border border-slate-700">{aiCommentary}</span>}
      </div>

      {/* Wheel Container */}
      <div className="relative w-80 h-80 md:w-96 md:h-96 mb-16 p-3 bg-slate-800 rounded-full shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] border border-slate-700 ring-4 ring-slate-800/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 text-gold-500 text-5xl drop-shadow-2xl filter drop-shadow-lg">▼</div>
        
        <div 
          className="w-full h-full rounded-full border-[16px] border-slate-900 overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.2, 0.8, 0.2, 1) relative shadow-inner"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(
              #10b981 0deg 10deg, 
              #ef4444 10deg 190deg, 
              #1f2937 190deg 360deg
            )`
          }}
        >
             {/* Inner decorations */}
             <div className="absolute inset-0 m-auto w-3/4 h-3/4 rounded-full border-4 border-slate-900/10 border-dashed"></div>
             <div className="absolute inset-0 m-auto w-1/2 h-1/2 rounded-full border-2 border-slate-900/20"></div>
             
             {/* Center Cap */}
            <div className="absolute inset-0 m-auto w-24 h-24 bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.4)] flex items-center justify-center z-10 border-4 border-slate-900">
                <span className="text-slate-900 font-black text-sm tracking-widest">CASINO</span>
            </div>
        </div>
      </div>

      {/* Betting Board */}
      <div className="bg-emerald-900/90 p-8 md:p-10 rounded-3xl border-[6px] border-emerald-950 w-full max-w-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
        
        <div className="flex gap-4 mb-8 relative z-10">
           <button 
             onClick={() => { setSelectedBet('red'); playSound('click'); }}
             className={`flex-1 h-24 rounded-xl bg-red-700 hover:bg-red-600 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'red' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-red-900 opacity-90'}`}
           >
             <span className="text-2xl block">RED</span>
             <div className="text-xs font-normal opacity-75 mt-1 uppercase tracking-wider">2x Payout</div>
           </button>
           <button 
             onClick={() => { setSelectedBet('green'); playSound('click'); }}
             className={`w-28 h-24 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'green' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-emerald-800 opacity-90'}`}
           >
             <span className="text-2xl block">0</span>
             <div className="text-xs font-normal opacity-75 mt-1 uppercase tracking-wider">14x</div>
           </button>
           <button 
             onClick={() => { setSelectedBet('black'); playSound('click'); }}
             className={`flex-1 h-24 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-white transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedBet === 'black' ? 'border-gold-400 ring-4 ring-gold-500/30 scale-105 z-20' : 'border-black opacity-90'}`}
           >
             <span className="text-2xl block">BLACK</span>
             <div className="text-xs font-normal opacity-75 mt-1 uppercase tracking-wider">2x Payout</div>
           </button>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-6 relative z-10 bg-black/30 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex-1 w-full">
            <label className="text-emerald-200 text-xs font-bold uppercase mb-3 block tracking-widest">Place Your Bet</label>
            <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">$</span>
                <input 
                    type="number" 
                    value={betAmount} 
                    onChange={e => setBetAmount(Number(e.target.value))}
                    className="bg-emerald-950/80 border border-emerald-700 p-4 pl-10 rounded-xl text-white w-full text-xl font-mono focus:border-gold-400 outline-none shadow-inner transition-colors"
                />
            </div>
          </div>
          <Button 
            className="w-full md:w-auto h-[62px] px-10 text-lg font-bold shadow-xl" 
            variant="gold" 
            onClick={spinWheel} 
            disabled={spinning || !selectedBet || balance < betAmount}
          >
            {spinning ? 'SPINNING...' : 'SPIN WHEEL'}
          </Button>
        </div>
      </div>
    </div>
  );
};
