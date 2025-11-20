
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { SYMBOLS } from '../constants';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface SlotsProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

export const Slots: React.FC<SlotsProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<string[]>(['7️⃣', '7️⃣', '7️⃣']);
  const [spinning, setSpinning] = useState(false);
  const [aiCommentary, setAiCommentary] = useState('');

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const spin = async () => {
    if (balance < bet) return;
    onEndGame(-bet);
    setSpinning(true);
    setAiCommentary('');
    playSound('click');

    const duration = 2000;
    const intervalTime = 80;
    let elapsed = 0;

    const interval = setInterval(() => {
      playSound('spin');
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]);
      elapsed += intervalTime;
      if (elapsed >= duration) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, intervalTime);
  };

  const finalizeSpin = () => {
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    setReels(finalReels);
    setSpinning(false);

    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
      const winAmount = bet * 10;
      onEndGame(winAmount);
      playSound('win');
      triggerAI(`User hit a JACKPOT of ${winAmount} on slots!`);
    } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
      const winAmount = bet * 2;
      onEndGame(winAmount);
      playSound('win');
      triggerAI(`User won small prize of ${winAmount} on slots`);
    } else {
      playSound('lose');
      triggerAI("User lost spin on slots");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8">
      {/* Commentary */}
      <div className="h-10 mb-6 text-gold-400 font-medium text-lg animate-fade-in text-center flex items-center">
        {aiCommentary && <span className="bg-slate-900/90 px-6 py-2 rounded-full border border-gold-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)] backdrop-blur">{aiCommentary}</span>}
      </div>

      {/* Machine Chassis */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-950 p-10 rounded-t-[4rem] rounded-b-3xl shadow-[0_0_100px_-20px_rgba(124,58,237,0.3)] border-[6px] border-slate-700 ring-1 ring-white/10">
        {/* Neon Lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-2 bg-purple-500 blur-lg"></div>
        
        {/* Lights */}
        <div className={`absolute top-6 left-8 w-6 h-6 rounded-full border-2 border-red-900 bg-red-600 shadow-[0_0_20px_red] transition-opacity ${spinning ? 'animate-pulse' : 'opacity-30'}`}></div>
        <div className={`absolute top-6 right-8 w-6 h-6 rounded-full border-2 border-green-900 bg-green-500 shadow-[0_0_20px_lime] transition-opacity delay-75 ${!spinning ? 'animate-pulse' : 'opacity-30'}`}></div>

        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-10 py-3 rounded-full border-2 border-gold-500 text-gold-400 text-sm tracking-[0.3em] font-black uppercase shadow-[0_0_30px_rgba(234,179,8,0.3)] z-10 flex items-center gap-2">
            <span>★</span> GOLDEN REELS <span>★</span>
        </div>
        
        {/* Reels Display */}
        <div className="bg-[#1a1b26] p-6 rounded-2xl flex gap-4 border-8 border-slate-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
           {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-20 pointer-events-none rounded-xl border border-white/5"></div>
           {/* Shine / Shadows for cylinder effect */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none opacity-80"></div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none opacity-80"></div>
          
          {reels.map((symbol, i) => (
            <div key={i} className="w-24 h-40 md:w-36 md:h-56 bg-white rounded-xl border-x-2 border-slate-300 flex items-center justify-center relative shadow-inner overflow-hidden">
               {/* Reel texture */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-40"></div>
               
               <div className={`
                  text-7xl md:text-8xl z-10 drop-shadow-lg transition-all duration-100
                  ${spinning ? 'blur-[8px] scale-y-150 opacity-80 -translate-y-4' : 'blur-0 scale-100 opacity-100'}
               `}>
                {symbol}
              </div>
            </div>
          ))}
        </div>
        
        {/* Payline */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-red-500/50 z-30 pointer-events-none mix-blend-overlay"></div>
      </div>

      {/* Control Panel */}
      <div className="mt-12 w-full max-w-lg bg-slate-800/90 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="flex items-end gap-6 mb-8 relative z-10">
           <div className="flex-1">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] block mb-3">Bet Amount</label>
              <div className="relative group">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500 font-bold text-xl">$</span>
                 <input 
                    type="number" 
                    value={bet} 
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 text-white p-5 pl-12 rounded-2xl text-center font-mono text-3xl focus:border-gold-500 outline-none transition-all shadow-inner group-hover:bg-slate-900/80"
                 />
              </div>
           </div>
        </div>
        
        <Button 
          variant="gold" 
          fullWidth 
          className="h-24 text-3xl font-black shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)] transform hover:-translate-y-1 transition-all relative overflow-hidden border-t border-white/20"
          onClick={spin}
          disabled={spinning || balance < bet}
        >
            <span className="relative z-10 flex items-center justify-center gap-3">
                {spinning ? (
                    <span className="animate-pulse">SPINNING...</span>
                ) : (
                    <>
                        <span>SPIN</span>
                        <span className="text-4xl">🎰</span>
                    </>
                )}
            </span>
        </Button>
      </div>
    </div>
  );
};
