import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { ResultOverlay } from '../components/ui/ResultOverlay';

interface SlotsProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

// --- HIGH QUALITY SVG SYMBOLS ---

const SymbolSeven = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
        <defs>
            <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
        </defs>
        <path d="M20 20 H80 L55 85" stroke="url(#grad7)" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20 H80 L55 85" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SymbolCherry = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <path d="M50 20 Q70 5 75 35 L80 60" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M50 20 Q30 5 25 35 L20 60" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="25" cy="65" r="16" fill="#dc2626" />
        <circle cx="75" cy="65" r="16" fill="#dc2626" />
        <circle cx="20" cy="60" r="5" fill="white" opacity="0.4" />
        <circle cx="70" cy="60" r="5" fill="white" opacity="0.4" />
    </svg>
);

const SymbolDiamond = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
        <defs>
            <linearGradient id="gradDiamond" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
        </defs>
        <path d="M50 10 L90 45 L50 90 L10 45 Z" fill="url(#gradDiamond)" stroke="#bae6fd" strokeWidth="2" />
        <path d="M50 10 L50 90 M10 45 L90 45" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
);

const SymbolLemon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
         <ellipse cx="50" cy="50" rx="35" ry="25" fill="#facc15" stroke="#ca8a04" strokeWidth="2" transform="rotate(-15, 50, 50)" />
         <path d="M20 55 Q50 45 80 45" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" transform="rotate(-15, 50, 50)" />
         <circle cx="85" cy="20" r="8" fill="#166534" />
         <path d="M85 20 Q75 35 60 30" stroke="#166534" strokeWidth="3" fill="none" />
    </svg>
);

const SYMBOLS = [
    { id: '7', component: SymbolSeven, multiplier: 50 },
    { id: 'D', component: SymbolDiamond, multiplier: 25 },
    { id: 'C', component: SymbolCherry, multiplier: 10 },
    { id: 'L', component: SymbolLemon, multiplier: 5 },
];

export const Slots: React.FC<SlotsProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState([SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ status: 'WIN' | 'LOSE', amount: number } | null>(null);
  const [aiCommentary, setAiCommentary] = useState('');

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const spin = () => {
    if (balance < bet || spinning) return;
    playSound('click');
    onEndGame(-bet);
    setSpinning(true);
    setResult(null);
    setAiCommentary('');
    
    let iterations = 0;
    const maxIterations = 20;
    
    const interval = setInterval(() => {
        setReels(reels.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
        playSound('tick');
        iterations++;
        if (iterations >= maxIterations) {
            clearInterval(interval);
            finalizeSpin();
        }
    }, 100);
  };

  const finalizeSpin = () => {
      const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ];
      
      setReels(finalReels);
      setSpinning(false);
      playSound('spin');

      const allSame = finalReels[0].id === finalReels[1].id && finalReels[1].id === finalReels[2].id;
      
      if (allSame) {
          const win = bet * finalReels[0].multiplier;
          onEndGame(win);
          setResult({ status: 'WIN', amount: win - bet });
          playSound('win');
          triggerAI(`Jackpot! 3x ${finalReels[0].id} hit!`);
      } else {
          setResult({ status: 'LOSE', amount: -bet });
          playSound('lose');
          triggerAI("Unlucky spin.");
      }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      
      {/* AI Toast */}
      <div className="h-12 flex items-center justify-center w-full">
          {aiCommentary && <span className="text-gold-400 bg-slate-900/80 px-4 py-1 rounded-full text-sm border border-gold-500/30 animate-fade-in">{aiCommentary}</span>}
      </div>

      {/* Machine */}
      <div className="bg-slate-900 p-6 md:p-10 rounded-[3rem] border-4 border-slate-800 shadow-2xl w-full max-w-2xl relative">
          
          {result && <ResultOverlay result={result.status} amount={result.amount} />}

          {/* Reels Container */}
          <div className="flex gap-2 md:gap-4 bg-black p-4 rounded-2xl border-4 border-slate-700 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden h-48 md:h-64 items-center justify-center">
               
               {/* Payline */}
               <div className="absolute w-full h-1 bg-red-500/40 top-1/2 -translate-y-1/2 z-10 pointer-events-none"></div>
               
               {reels.map((symbol, index) => (
                   <div key={index} className="flex-1 h-full bg-gradient-to-b from-slate-200 to-slate-400 rounded-lg flex items-center justify-center border-x-2 border-slate-500 relative overflow-hidden">
                       <div className={`w-20 h-20 md:w-32 md:h-32 transition-all ${spinning ? 'animate-bounce blur-[2px] opacity-80' : 'scale-100'}`}>
                            <symbol.component />
                       </div>
                       {/* Glare */}
                       <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20 pointer-events-none"></div>
                   </div>
               ))}
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-col md:flex-row gap-6 items-stretch">
              <div className="flex-1 bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bet Amount</label>
                  <div className="flex items-center mt-1">
                      <span className="text-gold-500 text-lg font-bold mr-2">$</span>
                      <input 
                        type="number" 
                        value={bet}
                        onChange={e => setBet(Number(e.target.value))}
                        disabled={spinning}
                        className="bg-transparent text-white font-mono text-2xl w-full outline-none"
                      />
                  </div>
              </div>
              <Button 
                variant="gold" 
                className="w-full md:w-48 text-2xl font-black tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                onClick={spin}
                disabled={spinning || balance < bet}
              >
                  {spinning ? '...' : 'SPIN'}
              </Button>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-4 gap-2 text-center">
              {SYMBOLS.map(s => (
                  <div key={s.id} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700 flex flex-col items-center">
                      <div className="w-6 h-6 mb-1"><s.component /></div>
                      <span className="text-[10px] font-bold text-gold-400">{s.multiplier}x</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};