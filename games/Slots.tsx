
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

    // We will stop spinning after a delay, one reel at a time
    setTimeout(() => finalizeSpin(), 2000);
  };

  const finalizeSpin = () => {
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    setReels(finalReels);
    setSpinning(false);
    playSound('spin'); // Stop/Lock sound

    // Logic
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
        {aiCommentary && <span className="bg-slate-900/80 px-6 py-2 rounded-full border border-gold-500/30 shadow shadow-gold-500/10">{aiCommentary}</span>}
      </div>

      {/* Machine Chassis */}
      <div className="relative bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 p-8 rounded-t-[3rem] rounded-b-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border-4 border-slate-600 border-b-8">
        {/* Lights */}
        <div className={`absolute top-4 left-8 w-4 h-4 rounded-full ${spinning ? 'bg-yellow-400 animate-ping' : 'bg-red-900'} shadow-[0_0_10px_red]`}></div>
        <div className={`absolute top-4 right-8 w-4 h-4 rounded-full ${spinning ? 'bg-yellow-400 animate-ping' : 'bg-green-900'} shadow-[0_0_10px_lime] delay-75`}></div>

        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 px-8 py-2 rounded-full border-2 border-gold-500 text-gold-400 text-sm tracking-[0.3em] font-black uppercase shadow-xl z-10">
            Golden Reels
        </div>
        
        {/* Reels Display */}
        <div className="bg-white p-6 rounded-xl flex gap-4 border-8 border-slate-800 shadow-inner relative overflow-hidden">
           {/* Glass Reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent z-20 pointer-events-none"></div>
           {/* Shine */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none"></div>
          
          {reels.map((symbol, i) => (
            <div key={i} className="w-24 h-40 md:w-32 md:h-48 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center text-6xl md:text-7xl relative shadow-inner overflow-hidden">
               {/* Reel texture */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-50"></div>
               
               {spinning ? (
                   // BLURRED SPINNING EFFECT
                   <div className="flex flex-col gap-4 animate-slide-down blur-[2px]">
                       {SYMBOLS.map((s, idx) => <div key={idx} className="h-40 flex items-center justify-center">{s}</div>)}
                       {SYMBOLS.map((s, idx) => <div key={idx+'d'} className="h-40 flex items-center justify-center">{s}</div>)}
                   </div>
               ) : (
                   // STATIC SYMBOL
                   <div className="transition-all duration-300 scale-100 drop-shadow-md animate-slide-up">
                    {symbol}
                   </div>
               )}
            </div>
          ))}
        </div>
        
        <style>{`
            @keyframes slideDown {
                0% { transform: translateY(-50%); }
                100% { transform: translateY(0); }
            }
            .animate-slide-down {
                animation: slideDown 0.2s linear infinite;
            }
        `}</style>
      </div>

      {/* Control Panel */}
      <div className="mt-10 w-full max-w-lg bg-slate-800/90 backdrop-blur-lg p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="flex items-end gap-6 mb-8">
           <div className="flex-1">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-3">Bet Amount</label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 font-bold">$</span>
                 <input 
                    type="number" 
                    value={bet} 
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 text-white p-4 pl-8 rounded-xl text-center font-mono text-2xl focus:border-gold-500 outline-none transition-all shadow-inner"
                 />
              </div>
           </div>
        </div>
        <Button 
          variant="gold" 
          fullWidth 
          className="h-20 text-2xl font-black shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)] transform hover:-translate-y-1 transition-all"
          onClick={spin}
          disabled={spinning || balance < bet}
        >
          {spinning ? 'SPINNING...' : 'SPIN NOW'}
        </Button>
      </div>
    </div>
  );
};
