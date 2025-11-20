
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [betPlaced, setBetPlaced] = useState(false); 
  const [cashedOut, setCashedOut] = useState(false);
  
  const [history, setHistory] = useState<number[]>([]);
  const [aiCommentary, setAiCommentary] = useState('');
  
  // Timer
  const [countdown, setCountdown] = useState(20);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  // --- Game Logic ---

  // 1. Betting Phase Timer
  useEffect(() => {
    let interval: any;
    if (gameState === 'betting') {
        setCountdown(20); // Ensure reset
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

  // 2. Initialize on mount
  useEffect(() => {
     setGameState('betting');
     return () => {
         if (reqRef.current) cancelAnimationFrame(reqRef.current);
     };
  }, []);

  const startRunningPhase = () => {
      setGameState('running');
      
      // Crash Point Logic: 1% Instant Crash, weighted distribution
      const r = Math.random();
      const crash = Math.max(1.00, (0.99 / (1 - r)));
      crashPointRef.current = crash;
      
      startTimeRef.current = Date.now();
      loop();
  };

  const loop = () => {
    const now = Date.now();
    // 1 second = 0.1 increase roughly, exponential
    const elapsed = (now - startTimeRef.current) / 1000; 
    
    // Standard crash curve: grows slowly then fast
    // M(t) = 1.00 + 0.06 * t^2 ?? Let's use simple exp
    // M(t) = e^(0.06 * t)
    // Let's use a simpler polynomial for better UX early on
    const currentMult = 1 + (elapsed * elapsed * 0.05) + (elapsed * 0.05);
    
    if (currentMult >= crashPointRef.current) {
        // CRASH
        handleCrash(crashPointRef.current);
    } else {
        setMultiplier(currentMult);
        drawGraph(currentMult, 'running');
        reqRef.current = requestAnimationFrame(loop);
    }
  };

  const handleCrash = (finalValue: number) => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      
      setMultiplier(finalValue);
      setGameState('crashed');
      drawGraph(finalValue, 'crashed');
      setHistory(prev => [parseFloat(finalValue.toFixed(2)), ...prev].slice(0, 10));
      playSound('crash');

      if (betPlaced && !cashedOut) {
          triggerAI(`Crash at ${finalValue.toFixed(2)}x. You missed the jump.`);
      } else if (betPlaced && cashedOut) {
          triggerAI(`Nice win! You got out before ${finalValue.toFixed(2)}x.`);
      }

      // Auto-restart after 3s
      setTimeout(() => {
          setGameState('betting');
          setMultiplier(1.00);
          setBetPlaced(false);
          setCashedOut(false);
          drawGraph(1.00, 'betting');
      }, 3000);
  };

  // --- Canvas Drawing ---
  const drawGraph = (current: number, state: string) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      const w = cvs.width;
      const h = cvs.height;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x=0; x<w; x+=100) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for(let y=0; y<h; y+=100) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // Curve
      // X axis = time (0 to 10s map to width)
      // Y axis = multiplier (1 to 5x map to height) - dynamically scale
      
      // Dynamic Scaling
      // Keep the rocket somewhat in view but moving up/right
      // If multiplier > 2, we scale down the Y axis so 2 is lower
      
      const zoom = Math.max(1, current / 2); 
      // This keeps the current value roughly at 50% height/width if > 2
      
      ctx.beginPath();
      ctx.moveTo(0, h);
      
      // Calculate points for the curve trace
      // We just draw a quadratic to current point for simplicity
      // x = relative time, y = relative mult
      const plotX = (w / 2) * (1 / zoom) * (current > 2 ? 2 : current); // Simplified viz logic
      // Actually, better viz:
      // Rocket moves from bottom left to top right.
      // t = 0 -> x=0, y=h
      // t = now -> x=?, y=?
      
      // Simple approach: Linear X, Exponential Y
      const x = Math.min(w - 50, (current - 1) * 200 / zoom); 
      const y = h - Math.min(h - 50, (current - 1) * 100 / zoom);
      
      ctx.strokeStyle = state === 'crashed' ? '#ef4444' : cashedOut && betPlaced ? '#10b981' : '#3b82f6';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      
      ctx.quadraticCurveTo(x/2, h, x, y);
      ctx.stroke();

      // Area under curve
      ctx.lineTo(x, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = state === 'crashed' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)';
      ctx.fill();

      // Rocket
      if (state !== 'crashed') {
          ctx.save();
          ctx.translate(x, y);
          // Rotation based on slope? 45deg const for now
          ctx.rotate(-Math.PI / 4);
          ctx.font = "40px Arial";
          ctx.fillText("🚀", -20, 0);
          ctx.restore();
      } else {
          ctx.font = "60px Arial";
          ctx.fillText("💥", x - 20, y);
      }
  };

  // --- User Interaction ---
  const handleBet = () => {
      if (balance < bet) return;
      setBetPlaced(true);
      onEndGame(-bet);
      playSound('click');
  };

  const handleCashout = () => {
      setCashedOut(true);
      const win = bet * multiplier;
      onEndGame(win);
      playSound('win');
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
        
      {/* History */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center">
         <span className="text-xs text-slate-500 font-bold uppercase">History</span>
         {history.map((h, i) => (
             <div key={i} className={`px-2 py-1 rounded text-xs font-bold font-mono ${h >= 2 ? 'text-emerald-400 bg-emerald-900/50 border border-emerald-800' : 'text-slate-400 bg-slate-800 border border-slate-700'}`}>
                 {h.toFixed(2)}x
             </div>
         ))}
      </div>

      <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mb-6">
         <canvas ref={canvasRef} width={1000} height={450} className="w-full h-full" />
         
         {/* Overlay Data */}
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             {gameState === 'betting' && (
                 <div className="text-center">
                     <div className="text-6xl font-mono font-black text-white mb-2">{countdown.toFixed(1)}s</div>
                     <div className="text-emerald-400 font-bold tracking-[0.3em] animate-pulse">PLACE BETS</div>
                 </div>
             )}
             {gameState === 'running' && (
                 <div className="text-8xl font-mono font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                     {multiplier.toFixed(2)}x
                 </div>
             )}
             {gameState === 'crashed' && (
                 <div className="text-center">
                     <div className="text-8xl font-mono font-black text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]">
                         {multiplier.toFixed(2)}x
                     </div>
                     <div className="text-rose-400 font-bold tracking-[0.3em] mt-4">CRASHED</div>
                 </div>
             )}
         </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
          <div className="flex-1">
              <div className="text-slate-400 text-xs uppercase font-bold mb-2">Wager</div>
              <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500">$</span>
                  <input 
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    disabled={gameState !== 'betting' || betPlaced}
                    className="w-full h-16 pl-10 bg-slate-900 rounded-xl border border-slate-600 text-white text-2xl font-mono focus:border-gold-500 outline-none"
                  />
              </div>
          </div>
          <div className="flex-1">
             {gameState === 'betting' ? (
                 <Button 
                    variant="primary" 
                    className="w-full h-full min-h-[4rem] text-2xl font-black"
                    onClick={handleBet}
                    disabled={betPlaced || balance < bet}
                 >
                     {betPlaced ? 'BET PLACED' : 'PLACE BET'}
                 </Button>
             ) : (
                 <Button 
                    variant="success" 
                    className="w-full h-full min-h-[4rem] text-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    onClick={handleCashout}
                    disabled={gameState === 'crashed' || !betPlaced || cashedOut}
                 >
                     {cashedOut ? 'CASHED OUT' : 'CASH OUT'}
                 </Button>
             )}
          </div>
      </div>

      <div className="mt-4 text-center text-sm text-slate-500 min-h-[1.5rem] animate-fade-in">
          {aiCommentary}
      </div>
    </div>
  );
};
