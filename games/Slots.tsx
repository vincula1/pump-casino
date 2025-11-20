
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface SlotsProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

// --- SVG SYMBOLS ---
const SymbolSeven = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <defs>
            <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
        </defs>
        <path d="M20 20 H80 L55 85" stroke="url(#grad7)" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20 H80 L55 85" stroke="#fca5a5" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
);

const SymbolCherry = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <path d="M50 20 Q70 5 75 35 L80 60" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M50 20 Q30 5 25 35 L20 60" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="65" r="16" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
        <circle cx="80" cy="65" r="16" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
        <circle cx="15" cy="60" r="5" fill="white" opacity="0.4" />
        <circle cx="75" cy="60" r="5" fill="white" opacity="0.4" />
    </svg>
);

const SymbolDiamond = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]">
        <path d="M50 10 L90 45 L50 90 L10 45 Z" fill="#0ea5e9" stroke="#bae6fd" strokeWidth="3" />
        <path d="M25 45 L50 90 L75 45 L50 10 Z" fill="#38bdf8" opacity="0.6" />
        <path d="M10 45 H90" stroke="#bae6fd" strokeWidth="1" />
    </svg>
);

const SymbolBar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <rect x="10" y="35" width="80" height="30" rx="4" fill="#f59e0b" stroke="#b45309" strokeWidth="4" />
        <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="900" fill="#78350f" fontFamily="sans-serif" letterSpacing="2">BAR</text>
    </svg>
);

const SymbolLemon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <ellipse cx="50" cy="50" rx="38" ry="28" fill="#facc15" stroke="#a16207" strokeWidth="3" />
        <path d="M15 50 Q50 80 85 50" fill="none" stroke="#ca8a04" strokeWidth="2" opacity="0.5" />
        <circle cx="80" cy="50" r="2" fill="#ca8a04" />
        <circle cx="20" cy="50" r="2" fill="#ca8a04" />
    </svg>
);

const SymbolGrape = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <circle cx="50" cy="80" r="10" fill="#9333ea" />
        <circle cx="40" cy="65" r="10" fill="#9333ea" />
        <circle cx="60" cy="65" r="10" fill="#9333ea" />
        <circle cx="30" cy="50" r="10" fill="#9333ea" />
        <circle cx="50" cy="50" r="10" fill="#9333ea" />
        <circle cx="70" cy="50" r="10" fill="#9333ea" />
        <path d="M50 40 L50 20" stroke="#166534" strokeWidth="4" />
        <path d="M50 20 Q70 10 70 30" fill="none" stroke="#22c55e" strokeWidth="4" />
    </svg>
);

const SYMBOLS = [
    { id: 'seven', component: SymbolSeven, payout: 50 },
    { id: 'diamond', component: SymbolDiamond, payout: 25 },
    { id: 'bar', component: SymbolBar, payout: 15 },
    { id: 'cherry', component: SymbolCherry, payout: 10 },
    { id: 'lemon', component: SymbolLemon, payout: 5 },
    { id: 'grape', component: SymbolGrape, payout: 3 },
];

// --- REEL COMPONENT ---

const REEL_HEIGHT = 160; // Height of visible area
const SYMBOL_HEIGHT = 160; // Height of one symbol
const NUM_SYMBOLS = SYMBOLS.length;

const Reel = ({ 
  targetIndex, 
  isSpinning, 
  delay, 
  onStop 
}: { 
  targetIndex: number, 
  isSpinning: boolean, 
  delay: number, 
  onStop: () => void 
}) => {
  const [offset, setOffset] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  // We build a strip: [All Symbols] x 4 to allow enough scrolling
  // Final position will be calculated to land on targetIndex in the 3rd set
  
  useEffect(() => {
    if (isSpinning) {
      setIsLocked(false);
      setOffset(0);
      
      // Start animation after delay
      const spinTimeout = setTimeout(() => {
          // We want to land on the symbol at 'targetIndex'. 
          // Let's spin for a huge distance.
          // One full set is SYMBOLS.length * SYMBOL_HEIGHT
          // We land on the 15th set + targetIndex
          const totalSets = 20;
          const landPos = (totalSets * NUM_SYMBOLS * SYMBOL_HEIGHT) + (targetIndex * SYMBOL_HEIGHT);
          
          // Randomize slightly to simulate speed variation before lock? No, CSS handles ease.
          setOffset(-landPos);
          
          // When transition ends
          setTimeout(() => {
              setIsLocked(true);
              // Reset offset to the equivalent position in the first set to prevent huge numbers?
              // Actually, for one spin, huge number is fine.
              // But to allow next spin, we reset. 
              // We just leave it locked until next spin resets it to 0.
              onStop();
          }, 2500); // 2.5s duration matches CSS
          
      }, delay);
      
      return () => clearTimeout(spinTimeout);
    } else {
        // If not spinning, we should be showing the target index.
        // Since we reset offset to 0 on spin start, we don't need to do anything here 
        // unless we want to force position.
        // Ideally, we keep the last offset until new spin clears it.
        // However, to reset for next game:
        if (!isLocked) {
           // setOffset(-(targetIndex * SYMBOL_HEIGHT));
        }
    }
  }, [isSpinning, targetIndex, delay]);

  return (
    <div className="relative overflow-hidden w-full h-40 bg-slate-100 rounded-lg border-x-4 border-slate-300 shadow-inner">
        <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_10px_20px_rgba(0,0,0,0.3),inset_0_-10px_20px_rgba(0,0,0,0.3)]"></div>
        
        {/* The Strip */}
        <div 
            className="w-full flex flex-col"
            style={{
                transform: `translateY(${offset}px)`,
                transition: isSpinning ? 'transform 2.5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
                // If we are resetting (offset 0), we want instant snap. 
                // If we are spinning (offset -huge), we want transition.
            }}
        >
            {/* Render multiple sets of symbols to simulate infinite strip */}
            {[...Array(24)].map((_, setIdx) => (
                <React.Fragment key={setIdx}>
                    {SYMBOLS.map((s, i) => (
                        <div key={`${setIdx}-${i}`} className="h-40 w-full flex items-center justify-center p-4 border-b border-slate-200/50">
                            <s.component />
                        </div>
                    ))}
                </React.Fragment>
            ))}
        </div>
    </div>
  );
};

// --- MAIN GAME ---

export const Slots: React.FC<SlotsProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState([0, 0, 0]); // Indexes of results
  const [aiCommentary, setAiCommentary] = useState('');
  const [winLine, setWinLine] = useState<boolean | null>(null);

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const spin = () => {
    if (balance < bet || isSpinning) return;
    onEndGame(-bet);
    setIsSpinning(true);
    setWinLine(null);
    setAiCommentary('');
    playSound('click');
    
    // Determine Outcome immediately
    const r1 = Math.floor(Math.random() * NUM_SYMBOLS);
    const r2 = Math.floor(Math.random() * NUM_SYMBOLS);
    const r3 = Math.floor(Math.random() * NUM_SYMBOLS);
    
    // For demo fun: 20% chance to force a win (or near win)
    // let finalResult = [r1, r2, r3];
    
    setResult([r1, r2, r3]);
    playSound('spin');
  };

  const handleReelStop = (reelIdx: number) => {
      if (reelIdx === 2) {
          // Final reel stopped
          setIsSpinning(false);
          checkWin();
      }
      playSound('chip'); // Click sound on stop
  };

  const checkWin = () => {
      const [i1, i2, i3] = result;
      const s1 = SYMBOLS[i1];
      const s2 = SYMBOLS[i2];
      const s3 = SYMBOLS[i3];
      
      let winAmount = 0;
      let isWin = false;
      
      // 3 Match
      if (i1 === i2 && i2 === i3) {
          winAmount = bet * s1.payout;
          isWin = true;
      } 
      // 2 Match (Any pair)
      else if (i1 === i2 || i2 === i3 || i1 === i3) {
          // Payout based on the matching pair
          const matchSymbol = i1 === i2 ? s1 : s3;
          winAmount = bet * 2; // Small payout for pair
          isWin = true;
      }

      if (isWin) {
          setWinLine(true);
          onEndGame(winAmount);
          playSound('win');
          triggerAI(`Jackpot! Player won ${winAmount} on Slots!`);
      } else {
          setWinLine(false);
          triggerAI("No luck this spin.");
      }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      
      {/* AI Message */}
      <div className="h-10 mb-4 flex items-center justify-center w-full">
          {aiCommentary && <span className="text-gold-400 bg-slate-900/80 px-6 py-1 rounded-full border border-gold-500/30 animate-fade-in shadow-[0_0_15px_rgba(251,191,36,0.2)]">{aiCommentary}</span>}
      </div>

      {/* Machine Cabinet */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 p-4 md:p-8 rounded-[30px] border-[8px] border-slate-700 shadow-[0_0_60px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,0,0,0.5)] w-full max-w-2xl">
         
         {/* Top Light */}
         <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-6 rounded-b-xl ${winLine ? 'bg-emerald-500 shadow-[0_0_30px_#10b981] animate-pulse' : 'bg-slate-800 border border-slate-600'}`}></div>

         {/* Screen Frame */}
         <div className="bg-slate-950 p-4 rounded-2xl border-4 border-slate-800 relative overflow-hidden">
            {/* Glass Reflection */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-20 skew-x-12"></div>
            
            {/* Reels Container */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 relative z-10">
                <Reel targetIndex={result[0]} isSpinning={isSpinning} delay={0} onStop={() => {}} />
                <Reel targetIndex={result[1]} isSpinning={isSpinning} delay={200} onStop={() => {}} />
                <Reel targetIndex={result[2]} isSpinning={isSpinning} delay={400} onStop={() => handleReelStop(2)} />
                
                {/* Payline Indicator */}
                <div className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-red-500/50 pointer-events-none z-20 transition-opacity duration-300 ${winLine ? 'opacity-100 shadow-[0_0_10px_#ef4444]' : 'opacity-0'}`}></div>
            </div>
         </div>

         {/* Controls */}
         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Bet Amount</div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 text-lg font-bold">$</span>
                    <input 
                        type="number" 
                        value={bet}
                        onChange={(e) => setBet(Number(e.target.value))}
                        disabled={isSpinning}
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg py-3 pl-10 text-white font-mono text-xl focus:border-gold-500 outline-none transition-colors"
                    />
                </div>
            </div>
            
            <Button 
                variant="gold" 
                onClick={spin} 
                disabled={isSpinning || balance < bet}
                className={`h-20 text-2xl font-black tracking-widest shadow-[0_5px_0_#b45309] active:shadow-none active:translate-y-[5px] transition-all ${isSpinning ? 'brightness-75' : 'hover:brightness-110'}`}
            >
                {isSpinning ? 'SPINNING...' : 'SPIN'}
            </Button>
         </div>
         
         {/* Legend */}
         <div className="mt-6 flex justify-between px-2 opacity-50 hover:opacity-100 transition-opacity text-[10px] text-slate-400 uppercase font-bold tracking-wider">
             <span>3x Match = Jackpot</span>
             <span>2x Match = 2x Bet</span>
         </div>
      </div>
    </div>
  );
};
