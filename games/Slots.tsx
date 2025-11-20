
import React, { useState, useEffect } from 'react';
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
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <defs>
            <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <filter id="glow7">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>
        <path d="M20 20 H80 L55 85" stroke="url(#grad7)" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow7)" />
        <path d="M20 20 H80 L55 85" stroke="#fca5a5" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
);

const SymbolCherry = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <path d="M50 20 Q70 5 75 35 L80 60" stroke="#15803d" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M50 20 Q30 5 25 35 L20 60" stroke="#15803d" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="25" cy="65" r="18" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
        <circle cx="75" cy="65" r="18" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
        <circle cx="18" cy="60" r="6" fill="white" opacity="0.4" />
        <circle cx="68" cy="60" r="6" fill="white" opacity="0.4" />
    </svg>
);

const SymbolDiamond = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
        <path d="M50 10 L90 45 L50 90 L10 45 Z" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="4" />
        <path d="M25 45 L50 90 L75 45 L50 10 Z" fill="#7dd3fc" opacity="0.5" />
        <path d="M10 45 H90" stroke="#e0f2fe" strokeWidth="2" />
    </svg>
);

const SymbolBar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <rect x="5" y="30" width="90" height="40" rx="6" fill="#f59e0b" stroke="#b45309" strokeWidth="4" />
        <rect x="10" y="35" width="80" height="30" rx="4" fill="#fbbf24" />
        <text x="50" y="62" textAnchor="middle" fontSize="28" fontWeight="900" fill="#78350f" fontFamily="sans-serif" letterSpacing="4">BAR</text>
    </svg>
);

const SymbolBell = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <path d="M50 10 Q80 10 85 70 H15 Q20 10 50 10 Z" fill="#eab308" stroke="#a16207" strokeWidth="3" />
        <circle cx="50" cy="70" r="8" fill="#a16207" />
        <path d="M50 10 Q25 10 25 70" fill="none" stroke="#fde047" strokeWidth="4" opacity="0.5" />
    </svg>
);

const SYMBOLS = [
    { id: 'seven', component: SymbolSeven, payout: 50 },
    { id: 'diamond', component: SymbolDiamond, payout: 25 },
    { id: 'bar', component: SymbolBar, payout: 15 },
    { id: 'bell', component: SymbolBell, payout: 12 },
    { id: 'cherry', component: SymbolCherry, payout: 5 },
];

const SYMBOL_HEIGHT = 128;
const REEL_STRIP_LENGTH = 40;

const generateStrip = () => {
    return Array.from({ length: REEL_STRIP_LENGTH }, () => 
        Math.floor(Math.random() * SYMBOLS.length)
    );
};

const Reel = ({ 
  isSpinning, 
  stopIndex, 
  delay, 
  onStop 
}: { 
  isSpinning: boolean, 
  stopIndex: number, 
  delay: number, 
  onStop: () => void 
}) => {
    const [strip, setStrip] = useState<number[]>(generateStrip());
    const [translateY, setTranslateY] = useState(0);
    const [transition, setTransition] = useState('none');

    useEffect(() => {
        setTranslateY(0);
    }, []);

    useEffect(() => {
        if (isSpinning) {
            const newStrip = generateStrip();
            newStrip[newStrip.length - 1] = stopIndex;
            
            setStrip(newStrip);
            setTranslateY(0);
            setTransition('none');

            setTimeout(() => {
                const finalY = -((newStrip.length - 1) * SYMBOL_HEIGHT);
                setTransition(`transform ${2 + (delay/1000)}s cubic-bezier(0.2, 0.1, 0.1, 1)`);
                setTranslateY(finalY);

                setTimeout(() => {
                   onStop();
                }, (2000 + delay)); 
            }, 50);
        }
    }, [isSpinning, stopIndex, delay]);

    return (
        <div className="relative w-full h-32 bg-slate-900 overflow-hidden rounded-lg border-x-2 border-slate-800 shadow-inner">
             <div 
                className="w-full flex flex-col items-center"
                style={{
                    transform: `translateY(${translateY}px)`,
                    transition: transition
                }}
             >
                 {strip.map((symbolIdx, i) => {
                     const Sym = SYMBOLS[symbolIdx].component;
                     return (
                         <div key={i} className="h-32 w-full flex items-center justify-center p-4">
                             <Sym />
                         </div>
                     );
                 })}
             </div>
             <div className="absolute inset-0 pointer-events-none shadow-[inset_0_10px_30px_rgba(0,0,0,0.8),inset_0_-10px_30px_rgba(0,0,0,0.8)]"></div>
             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        </div>
    );
};


export const Slots: React.FC<SlotsProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [results, setResults] = useState<number[]>([0, 1, 2]);
  const [aiCommentary, setAiCommentary] = useState('');
  const [winLine, setWinLine] = useState<boolean | null>(null);
  const [resultOverlay, setResultOverlay] = useState<{show: boolean, type: 'win'|'lose'|'neutral', msg: string, amount?: number}>({ show: false, type: 'neutral', msg: '' });

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const handleSpin = () => {
    if (balance < bet || isSpinning) return;
    playSound('click');
    onEndGame(-bet);
    setIsSpinning(true);
    setWinLine(null);
    setResultOverlay({ show: false, type: 'neutral', msg: '' });
    setAiCommentary('');

    // Determine results immediately
    const r1 = Math.floor(Math.random() * SYMBOLS.length);
    const r2 = Math.floor(Math.random() * SYMBOLS.length);
    const r3 = Math.floor(Math.random() * SYMBOLS.length);
    setResults([r1, r2, r3]);

    playSound('spin');
  };

  const handleReelStop = (reelIndex: number) => {
      playSound('chip');
      if (reelIndex === 2) {
          setIsSpinning(false);
          checkWin();
      }
  };

  const checkWin = () => {
      const [i1, i2, i3] = results;
      let win = 0;
      let isWin = false;

      if (i1 === i2 && i2 === i3) {
          win = bet * SYMBOLS[i1].payout;
          isWin = true;
      } 
      else if (i1 === i2 || i2 === i3 || i1 === i3) {
          win = bet * 2;
          isWin = true;
      }

      if (isWin) {
          setWinLine(true);
          onEndGame(win);
          playSound('win');
          setResultOverlay({ show: true, type: 'win', msg: 'WINNER', amount: win });
          triggerAI(`Slots Jackpot! Player won ${win}!`);
      } else {
          setWinLine(false);
          triggerAI("Slots cold. Try again.");
      }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
        <div className="h-10 mb-4 flex items-center justify-center w-full">
          {aiCommentary && <span className="text-gold-400 bg-slate-900/80 px-6 py-1 rounded-full border border-gold-500/30 animate-fade-in shadow-[0_0_15px_rgba(251,191,36,0.2)]">{aiCommentary}</span>}
        </div>

        {/* CASINO CABINET FRAME */}
        <div className="relative bg-slate-800 p-6 md:p-10 rounded-[40px] border-4 border-slate-700 shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-3xl">
            
            {/* Neon Top Light */}
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-2/3 h-4 rounded-full blur-md transition-all duration-500 ${winLine ? 'bg-emerald-500 shadow-[0_0_40px_#10b981]' : 'bg-purple-600/30'}`}></div>

            <div className="text-center mb-6">
                <h2 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 drop-shadow-sm">
                    NEON SLOTS
                </h2>
            </div>

            {/* REELS CONTAINER */}
            <div className="bg-slate-950 p-4 rounded-2xl border-8 border-slate-800 relative shadow-2xl overflow-hidden">
                 
                 <ResultOverlay isOpen={resultOverlay.show} message={resultOverlay.msg} amount={resultOverlay.amount} type={resultOverlay.type} />

                 {/* Glass Reflection */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-30 rounded-lg"></div>

                 {/* The Reels */}
                 <div className="grid grid-cols-3 gap-2 md:gap-4 relative z-10">
                      <Reel isSpinning={isSpinning} stopIndex={results[0]} delay={0} onStop={() => handleReelStop(0)} />
                      <Reel isSpinning={isSpinning} stopIndex={results[1]} delay={200} onStop={() => handleReelStop(1)} />
                      <Reel isSpinning={isSpinning} stopIndex={results[2]} delay={400} onStop={() => handleReelStop(2)} />

                      {/* Payline Bar */}
                      <div className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-red-600/60 z-20 pointer-events-none transition-opacity duration-300 ${winLine ? 'opacity-100 shadow-[0_0_15px_#dc2626]' : 'opacity-0'}`}></div>
                 </div>
            </div>

            {/* Info Bar */}
            <div className="mt-6 mb-6 h-12 bg-black/40 rounded-xl border border-slate-700/50 flex items-center justify-center">
                <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    {isSpinning ? 'GOOD LUCK...' : 'PRESS SPIN TO START'}
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-xl p-2 border border-slate-700 flex flex-col justify-center px-4">
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Bet Size</div>
                    <div className="flex items-center">
                        <span className="text-gold-500 mr-1">$</span>
                        <input 
                            type="number" 
                            value={bet} 
                            onChange={e => setBet(Number(e.target.value))}
                            disabled={isSpinning}
                            className="w-full bg-transparent text-white font-mono text-xl font-bold outline-none"
                        />
                    </div>
                </div>
                <Button 
                    variant="gold" 
                    onClick={handleSpin}
                    disabled={isSpinning || balance < bet}
                    className={`h-20 text-2xl font-black tracking-widest shadow-[0_6px_0_#b45309] active:shadow-none active:translate-y-[6px] transition-all rounded-xl ${isSpinning ? 'brightness-75' : 'hover:brightness-110'}`}
                >
                    SPIN
                </Button>
            </div>

        </div>
    </div>
  );
};
