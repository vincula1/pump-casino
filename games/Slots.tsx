
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface SlotsProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

// Modern SVG Symbols
const SymbolSeven = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <path d="M20 20 H80 L60 80" stroke="#ef4444" strokeWidth="15" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20 H80 L60 80" stroke="#fca5a5" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SymbolCherry = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <path d="M50 20 Q70 10 70 40 L75 65" stroke="#166534" strokeWidth="5" fill="none" />
        <path d="M50 20 Q30 10 30 40 L25 65" stroke="#166534" strokeWidth="5" fill="none" />
        <circle cx="25" cy="65" r="15" fill="#dc2626" />
        <circle cx="75" cy="65" r="15" fill="#dc2626" />
        <circle cx="20" cy="60" r="5" fill="white" opacity="0.5" />
        <circle cx="70" cy="60" r="5" fill="white" opacity="0.5" />
    </svg>
);

const SymbolDiamond = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
        <path d="M50 10 L90 40 L50 90 L10 40 Z" fill="#0ea5e9" stroke="#bae6fd" strokeWidth="2" />
        <path d="M25 40 L50 90 L75 40 L50 10 Z" fill="#38bdf8" opacity="0.5" />
        <path d="M10 40 H90" stroke="#bae6fd" strokeWidth="1" />
    </svg>
);

const SymbolBar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <rect x="10" y="35" width="80" height="30" rx="5" fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
        <text x="50" y="57" textAnchor="middle" fontSize="20" fontWeight="black" fill="#78350f" fontFamily="sans-serif">BAR</text>
    </svg>
);

const SymbolLemon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <ellipse cx="50" cy="50" rx="35" ry="25" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        <circle cx="80" cy="50" r="3" fill="#ca8a04" />
        <circle cx="20" cy="50" r="3" fill="#ca8a04" />
    </svg>
);

const SYMBOLS_MAP = [
    { id: 'seven', component: SymbolSeven, weight: 1 },
    { id: 'diamond', component: SymbolDiamond, weight: 2 },
    { id: 'bar', component: SymbolBar, weight: 3 },
    { id: 'cherry', component: SymbolCherry, weight: 4 },
    { id: 'lemon', component: SymbolLemon, weight: 5 },
];

export const Slots: React.FC<SlotsProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [reelState, setReelState] = useState([0, 0, 0]); // Index of current symbol
  const [spinning, setSpinning] = useState(false);
  const [aiCommentary, setAiCommentary] = useState('');
  
  // We keep track of "offset" for the CSS animation to simulate infinite scroll
  const [offsets, setOffsets] = useState([0, 0, 0]);

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const getRandomSymbolIndex = () => Math.floor(Math.random() * SYMBOLS_MAP.length);

  const spin = async () => {
    if (balance < bet) return;
    onEndGame(-bet);
    setSpinning(true);
    setAiCommentary('');
    playSound('click');
    playSound('spin');

    // Start animation: Move offsets significantly to simulate multiple rotations
    // We want them to stop one by one
    const baseRotations = 20; 
    const symbolHeight = 100; // Assume 100% translate per symbol for calculation logic
    
    // Determine outcome first
    const outcome = [getRandomSymbolIndex(), getRandomSymbolIndex(), getRandomSymbolIndex()];
    
    // Delays for each reel stop
    setTimeout(() => stopReel(0, outcome[0]), 1500);
    setTimeout(() => stopReel(1, outcome[1]), 2000);
    setTimeout(() => stopReel(2, outcome[2]), 2500);
  };

  const stopReel = (reelIndex: number, finalSymbolIndex: number) => {
      setReelState(prev => {
          const next = [...prev];
          next[reelIndex] = finalSymbolIndex;
          return next;
      });
      
      // Play stop sound
      playSound('chip');

      // If last reel
      if (reelIndex === 2) {
          setTimeout(() => checkWin(finalSymbolIndex), 500); // Small delay for effect
      }
  };

  const checkWin = (lastReelVal: number) => {
      setSpinning(false);
      
      // Check state using the functional update or ref would be safer, but since we set state in sequence,
      // we need to read the current 'reelState' carefully. Actually, the 'reelState' variable in closure might be stale.
      // A better way is to just pass the full outcome array to this function or use a Ref for outcome.
      // For simplicity, we'll rely on the React state update which triggers a re-render. 
      // WAIT: The closure here captures the initial state. We need to use the values we decided on.
      // Let's refactor `spin` to store outcome in a ref or variable available to closure.
  };

  // Refactored Logic for correctness
  const [targetOutcome, setTargetOutcome] = useState<number[] | null>(null);
  
  useEffect(() => {
      if (!spinning && targetOutcome) {
          // Game just finished
          const [s1, s2, s3] = targetOutcome;
          const sym1 = SYMBOLS_MAP[s1];
          const sym2 = SYMBOLS_MAP[s2];
          const sym3 = SYMBOLS_MAP[s3];

          let winAmount = 0;
          let isWin = false;

          // Logic
          if (s1 === s2 && s2 === s3) {
              // 3 Match
              if (sym1.id === 'seven') winAmount = bet * 50;
              else if (sym1.id === 'diamond') winAmount = bet * 25;
              else winAmount = bet * 10;
              isWin = true;
          } else if (s1 === s2 || s2 === s3 || s1 === s3) {
              // 2 Match
              winAmount = bet * 2;
              isWin = true;
          }

          if (isWin) {
              onEndGame(winAmount);
              playSound('win');
              triggerAI(`Hit a nice ${winAmount} win on Slots!`);
          } else {
              playSound('lose');
              triggerAI("Slots spin missed.");
          }
          setTargetOutcome(null);
      }
  }, [spinning, targetOutcome]);


  const handleSpinClick = () => {
      if (balance < bet || spinning) return;
      onEndGame(-bet);
      setSpinning(true);
      setAiCommentary('');
      playSound('click');
      
      const outcome = [getRandomSymbolIndex(), getRandomSymbolIndex(), getRandomSymbolIndex()];
      setTargetOutcome(outcome);

      // Animate
      // We simulate the reel spinning by just setting the state to the outcome after a delay
      // The CSS blur animation handles the visual "spinning"
      setTimeout(() => {
          setReelState(prev => [outcome[0], prev[1], prev[2]]);
          playSound('tick');
      }, 1000);
      setTimeout(() => {
          setReelState(prev => [outcome[0], outcome[1], prev[2]]);
          playSound('tick');
      }, 1600);
      setTimeout(() => {
          setReelState(prev => [outcome[0], outcome[1], outcome[2]]);
          playSound('tick');
          setSpinning(false); // Triggers useEffect
      }, 2200);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-4xl mx-auto">
      
      {/* Top Decoration */}
      <div className="w-full flex justify-center mb-6">
          <div className="relative px-12 py-3 bg-slate-900 border-2 border-gold-500 rounded-full shadow-[0_0_20px_#fbbf24] flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${spinning ? 'bg-red-500 animate-ping' : 'bg-red-900'}`}></div>
              <span className="text-gold-400 font-black text-2xl tracking-[0.2em] uppercase drop-shadow-md">Neon Slots</span>
              <div className={`w-3 h-3 rounded-full ${spinning ? 'bg-red-500 animate-ping' : 'bg-red-900'}`}></div>
          </div>
      </div>

      <div className="h-8 mb-4 text-center">
         {aiCommentary && <span className="text-emerald-400 font-medium animate-fade-in bg-slate-900/80 px-4 py-1 rounded-full border border-emerald-500/30">{aiCommentary}</span>}
      </div>

      {/* Machine Body */}
      <div className="relative bg-slate-800 p-6 md:p-10 rounded-[3rem] border-[6px] border-slate-700 shadow-2xl w-full">
        {/* Screen Area */}
        <div className="bg-black rounded-2xl border-4 border-slate-900 p-4 relative overflow-hidden shadow-inner">
           {/* Scanlines */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
           
           <div className="flex gap-2 md:gap-4 h-48 md:h-64 bg-slate-900 rounded-xl p-2 md:p-4 relative z-10">
                {[0, 1, 2].map((reelIdx) => {
                    const symbol = SYMBOLS_MAP[reelState[reelIdx]];
                    const isReelSpinning = spinning && (
                        (reelIdx === 0 && targetOutcome) || 
                        (reelIdx === 1 && reelState[0] === targetOutcome?.[0] && targetOutcome) || 
                        (reelIdx === 2 && reelState[1] === targetOutcome?.[1] && targetOutcome)
                    );
                    // Logic: If spinning is true, and we haven't locked this reel yet (based on timing logic implicit in handleSpinClick timeouts)
                    // Actually handleSpinClick updates state sequentially. So we can check if `targetOutcome[i]` == `reelState[i]` to see if locked? 
                    // No, randomness might pick same symbol.
                    // Simplification: The timeout updates the state. If we are between start and that timeout, show blur.
                    
                    // Better visual logic:
                    // 0-1000ms: All blur
                    // 1000-1600ms: Reel 1 fixed, 2&3 blur
                    // 1600-2200ms: Reel 1&2 fixed, 3 blur
                    
                    let blur = false;
                    if (spinning) {
                        if (reelIdx === 0 && !targetOutcome) blur = true; // Initial
                        if (reelIdx === 0 && targetOutcome && reelState[0] !== targetOutcome[0]) blur = true; // Should not happen with my logic but...
                        // Actually let's just use a simpler "isLocked" state derived from timing or just separate state vars
                        // For now, using the class based on the 'spinning' var is visually acceptable if we stagger the state updates
                        // Wait, the state updates *stop* the blur. So if 'spinning' is true, we just need to know if THIS reel has stopped.
                        
                        // A reel stops when its state matches the target. But target might be same as start.
                        // Let's just Assume:
                        // The reel is blurry until the specific timeout fires.
                        // Since we can't easily check that in render without extra state, let's add `activeReels` state.
                    }
                    
                    // To keep it simple: We will rely on a CSS animation that is applied when `spinning` is true.
                    // BUT we need to stop it individually.
                    // Let's restart: The `handleSpinClick` sets the state. 
                    // We can assume if `spinning` is true, we show a "blur strip" unless the state just updated.
                    // This is getting complex. Let's just use the "Spinning" state for the blur effect
                    // and since we update state sequentially, the "Blur" needs to be conditional.
                    
                    // Let's use a `reelsSpinning` array state boolean.
                })}
                
                <Reel 
                    idx={0} 
                    spinning={spinning} 
                    stopDelay={1000} 
                    finalSymbol={targetOutcome ? targetOutcome[0] : reelState[0]} 
                    onStop={() => {}} 
                />
                <Reel 
                    idx={1} 
                    spinning={spinning} 
                    stopDelay={1600} 
                    finalSymbol={targetOutcome ? targetOutcome[1] : reelState[1]} 
                    onStop={() => {}} 
                />
                <Reel 
                    idx={2} 
                    spinning={spinning} 
                    stopDelay={2200} 
                    finalSymbol={targetOutcome ? targetOutcome[2] : reelState[2]} 
                    onStop={() => {}} 
                />
           </div>
        </div>

        {/* Controls */}
        <div className="mt-8 bg-slate-900/50 rounded-2xl p-6 border border-slate-700 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
                <div className="text-slate-400 text-xs font-bold uppercase mb-2 tracking-wider">Bet Amount</div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 text-xl">$</span>
                    <input 
                        type="number" 
                        value={bet} 
                        onChange={(e) => setBet(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-600 p-4 pl-10 rounded-xl text-2xl font-mono text-white focus:border-gold-500 outline-none"
                    />
                </div>
            </div>
            <Button 
                variant="gold" 
                className={`w-full md:w-auto h-20 px-12 text-2xl font-black shadow-[0_0_30px_rgba(251,191,36,0.3)] ${spinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
                onClick={handleSpinClick}
                disabled={spinning}
            >
                {spinning ? '...' : 'SPIN'}
            </Button>
        </div>
      </div>
    </div>
  );
};

// Subcomponent for individual Reel
const Reel = ({ idx, spinning, stopDelay, finalSymbol, onStop }: any) => {
    const [isMoving, setIsMoving] = useState(false);
    const [displayedSymbol, setDisplayedSymbol] = useState(finalSymbol);

    useEffect(() => {
        if (spinning) {
            setIsMoving(true);
            const timeout = setTimeout(() => {
                setIsMoving(false);
                setDisplayedSymbol(finalSymbol);
                onStop();
            }, stopDelay);
            return () => clearTimeout(timeout);
        } else {
            setIsMoving(false);
        }
    }, [spinning, stopDelay, finalSymbol]); // Only re-run if spinning starts

    const SymbolComp = SYMBOLS_MAP[isMoving ? 0 : displayedSymbol].component; 
    // If moving, we can show a random one or a blur component

    return (
        <div className="flex-1 bg-white rounded-lg border-2 border-slate-300 overflow-hidden relative shadow-inner">
            {/* Shadow Gradient */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/40 via-transparent to-black/40"></div>
            
            <div className="w-full h-full flex items-center justify-center p-2 md:p-4">
                {isMoving ? (
                    // Moving Blur Effect
                    <div className="w-full h-full animate-slide-down blur-sm opacity-80 flex flex-col gap-8">
                        {/* Repeat symbols to create a strip */}
                        {SYMBOLS_MAP.map((S, i) => (
                            <div key={i} className="w-full h-full shrink-0"><S.component /></div>
                        ))}
                         {SYMBOLS_MAP.map((S, i) => (
                            <div key={i + 'dup'} className="w-full h-full shrink-0"><S.component /></div>
                        ))}
                    </div>
                ) : (
                    // Static Symbol
                    <div className="w-full h-full animate-slide-up">
                        <SymbolComp />
                    </div>
                )}
            </div>
            <style>{`
                @keyframes slideDown {
                    0% { transform: translateY(-50%); }
                    100% { transform: translateY(0%); }
                }
                .animate-slide-down {
                    animation: slideDown 0.2s linear infinite;
                }
            `}</style>
        </div>
    );
};
