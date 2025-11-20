
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface CrashProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

export const Crash: React.FC<CrashProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameState, setGameState] = useState<'betting' | 'running' | 'crashed'>('betting');
  const [betPlaced, setBetPlaced] = useState(false); // Did user bet in this round?
  const [cashedOut, setCashedOut] = useState(false); // Did user cash out this round?
  
  const [crashPoint, setCrashPoint] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [aiCommentary, setAiCommentary] = useState('');
  
  // Timer for betting phase
  const [countdown, setCountdown] = useState(20);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const soundThrottleRef = useRef<number>(0);

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  // --- Game Loop Logic ---

  // 1. Init / Reset Loop
  useEffect(() => {
    // Start the cycle immediately on mount
    startBettingPhase();
    return () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const startBettingPhase = () => {
      setGameState('betting');
      setMultiplier(1.00);
      setBetPlaced(false);
      setCashedOut(false);
      setCountdown(20); // 20 seconds
      setAiCommentary("Place your bets! Round starting soon.");
      
      drawGraph(1.00, 'betting');
  };

  // Countdown Effect
  useEffect(() => {
      let interval: any;
      if (gameState === 'betting') {
          interval = setInterval(() => {
              setCountdown((prev) => {
                  if (prev <= 1) {
                      clearInterval(interval);
                      startRunningPhase();
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [gameState]);

  const startRunningPhase = () => {
      setGameState('running');
      // Determine crash point
      const r = Math.random();
      // Crash formula: E = 1 / (1-p). House edge 1%.
      const calculatedCrash = Math.max(1.00, (0.99 / (1 - r)));
      setCrashPoint(calculatedCrash);
      
      startTimeRef.current = Date.now();
      soundThrottleRef.current = 0;
      loop(calculatedCrash);
  };

  const loop = (targetCrash: number) => {
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000; 
    // Exponential growth
    const currentMult = 1 + (elapsed * elapsed * 0.1) + (elapsed * 0.1);
    
    // Sound
    if (now - soundThrottleRef.current > 800 / (currentMult)) {
        playSound('tick');
        soundThrottleRef.current = now;
    }

    if (currentMult >= targetCrash) {
      // CRASHED
      handleCrash(targetCrash);
    } else {
      setMultiplier(currentMult);
      drawGraph(currentMult, 'running');
      reqRef.current = requestAnimationFrame(() => loop(targetCrash));
    }
  };

  const handleCrash = (finalValue: number) => {
      setMultiplier(finalValue);
      setGameState('crashed');
      setHistory(prev => [parseFloat(finalValue.toFixed(2)), ...prev].slice(0, 10));
      drawGraph(finalValue, 'crashed');
      playSound('crash');
      
      if (betPlaced && !cashedOut) {
         triggerAI(`Market crashed at ${finalValue.toFixed(2)}x. You lost the bet.`);
      } else if (betPlaced && cashedOut) {
         triggerAI(`Market crashed at ${finalValue.toFixed(2)}x. You won!`);
      } else {
         triggerAI(`Crashed at ${finalValue.toFixed(2)}x.`);
      }

      // Wait 3 seconds then restart
      setTimeout(() => {
          startBettingPhase();
      }, 3000);
  };

  // --- User Actions ---

  const placeBet = () => {
      if (balance < bet || gameState !== 'betting') return;
      onEndGame(-bet); // Deduct immediately
      setBetPlaced(true);
      playSound('click');
  };

  const cashOut = () => {
    if (gameState !== 'running' || !betPlaced || cashedOut) return;
    setCashedOut(true);
    const win = bet * multiplier;
    onEndGame(win); // Add winnings
    playSound('win');
  };

  // --- Drawing ---

  const drawGraph = (current: number, state: string) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const width = cvs.width;
    const height = cvs.height;

    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = '#334155'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<width; i+=80) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    for(let i=0; i<height; i+=60) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // Line
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    // Scale X and Y based on current multiplier to keep line somewhat centered or growing
    // We'll make the curve scale so it doesn't fly off screen immediately
    // normalized: 1.0 is bottom left. 
    const scaleX = 100; 
    const scaleY = 50;
    
    const x = Math.min(width, (current - 1) * scaleX); 
    const y = height - Math.min(height, (current - 1) * scaleY); 

    ctx.quadraticCurveTo(x/2, height, x, y);
    
    if (state === 'crashed') {
      ctx.strokeStyle = '#ef4444'; 
      ctx.shadowColor = '#ef4444';
    } else if (cashedOut && betPlaced) {
      ctx.strokeStyle = '#10b981'; // Green if we won
      ctx.shadowColor = '#10b981';
    } else {
      ctx.strokeStyle = '#3b82f6'; 
      ctx.shadowColor = '#3b82f6';
    }
    
    ctx.lineWidth = 5;
    ctx.shadowBlur = 20;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0; 

    // Fill under
    ctx.lineTo(x, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (state === 'crashed') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Rocket/Dot
    if (state === 'running' || state === 'betting') {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        
        // Rocket Emoji text at tip
        ctx.font = "24px Arial";
        ctx.fillText("🚀", x - 12, y - 15);
    } else if (state === 'crashed') {
        ctx.font = "30px Arial";
        ctx.fillText("💥", x - 15, y - 10);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-6">
      {/* History Bar */}
      <div className="w-full flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide mask-image-linear-to-r">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-widest self-center mr-2">History:</div>
          {history.map((val, i) => (
              <div key={i} className={`px-3 py-1 rounded-md font-mono font-bold text-sm animate-fade-in ${val >= 2.0 ? 'bg-emerald-900 text-emerald-400 border border-emerald-700' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {val.toFixed(2)}x
              </div>
          ))}
      </div>

      <div className="h-8 mb-4 text-gold-400 font-medium animate-fade-in text-center min-w-[50%]">
          {aiCommentary}
      </div>

      <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden mb-8 shadow-2xl ring-1 ring-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.8)_100%)] pointer-events-none z-10"></div>
        
        <canvas 
          ref={canvasRef} 
          width={1000} 
          height={450} 
          className="w-full h-full object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
           {gameState === 'betting' && (
               <div className="text-center animate-pulse">
                   <div className="text-slate-400 uppercase tracking-[0.5em] text-lg mb-2">Starting in</div>
                   <div className="text-8xl font-black text-white font-mono">{countdown.toFixed(1)}s</div>
                   <div className="text-emerald-400 font-bold mt-4">PLACE YOUR BETS</div>
               </div>
           )}
           
           {gameState === 'running' && (
               <span className="text-8xl font-black font-mono tracking-tighter drop-shadow-2xl text-white">
                   {multiplier.toFixed(2)}x
               </span>
           )}
           
           {gameState === 'crashed' && (
               <div className="text-center">
                    <span className="text-8xl font-black font-mono tracking-tighter text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]">
                        {multiplier.toFixed(2)}x
                    </span>
                    <div className="text-red-400 font-bold text-2xl mt-4 uppercase tracking-[0.3em]">CRASHED</div>
               </div>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl bg-slate-800/80 backdrop-blur p-8 rounded-3xl border border-slate-700 shadow-xl">
        <div className="flex-1">
          <label className="text-slate-400 text-xs uppercase font-bold mb-3 block tracking-wider">Bet Amount</label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-bold">$</span>
            <input 
                type="number" 
                value={bet}
                onChange={e => setBet(Number(e.target.value))}
                disabled={betPlaced || gameState !== 'betting'}
                className={`w-full bg-slate-900 border border-slate-600 p-4 pl-10 rounded-xl text-white font-mono text-2xl focus:border-blue-500 outline-none shadow-inner transition-colors ${betPlaced ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
        <div className="flex-1 flex items-end">
           {gameState === 'betting' ? (
               <Button 
                variant="primary" 
                className={`w-full h-[72px] text-2xl font-black shadow-lg ${betPlaced ? 'bg-emerald-600 border-emerald-500 text-white' : ''}`}
                onClick={placeBet}
                disabled={betPlaced || balance < bet}
               >
                 {betPlaced ? 'BET PLACED' : 'PLACE BET'}
               </Button>
           ) : (
               <Button 
                variant="success" 
                className="w-full h-[72px] text-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse"
                onClick={cashOut}
                disabled={gameState === 'crashed' || !betPlaced || cashedOut}
               >
                 {cashedOut ? 'CASHED OUT' : betPlaced ? `CASH OUT (${(bet * multiplier).toFixed(0)})` : 'WAITING...'}
               </Button>
           )}
        </div>
      </div>
    </div>
  );
};
