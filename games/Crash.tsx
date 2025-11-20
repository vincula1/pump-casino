
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
  const [countdown, setCountdown] = useState(10); // Reduced to 10s for faster pace

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const gameStateRef = useRef('betting'); // Ref for animation loop to access current state

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  // Update ref when state changes
  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  // Betting Timer
  useEffect(() => {
    let interval: any;
    if (gameState === 'betting') {
        setCountdown(10);
        setMultiplier(1.00);
        drawGraph(1.00, 'betting');
        
        interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 0.1) {
                    clearInterval(interval);
                    // Trigger start in next tick to avoid state conflict
                    setTimeout(() => startRunningPhase(), 0);
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startRunningPhase = () => {
      if (gameStateRef.current === 'running') return; // Prevent double start
      setGameState('running');
      
      // Crash Point Logic: 1% Instant Crash
      const r = Math.random();
      const crash = Math.max(1.00, (0.99 / (1 - r)));
      crashPointRef.current = crash;
      
      startTimeRef.current = Date.now();
      loop();
  };

  const loop = () => {
    if (gameStateRef.current !== 'running') return;

    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000; 
    const currentMult = 1 + (elapsed * elapsed * 0.05) + (elapsed * 0.05); // Growth function
    
    if (currentMult >= crashPointRef.current) {
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
          triggerAI(`Crashed at ${finalValue.toFixed(2)}x.`);
      }

      // Restart delay
      setTimeout(() => {
          setGameState('betting');
          setBetPlaced(false);
          setCashedOut(false);
      }, 3000);
  };

  // --- Canvas ---
  const drawGraph = (current: number, state: string) => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      const w = cvs.width;
      const h = cvs.height;

      ctx.clearRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Draw some static grid
      ctx.moveTo(0, h); ctx.lineTo(w, h);
      ctx.moveTo(0, 0); ctx.lineTo(0, h);
      ctx.stroke();

      const zoom = Math.max(1, current / 2); 
      const x = Math.min(w - 100, (current - 1) * 200 / zoom); 
      const y = h - Math.min(h - 50, (current - 1) * 100 / zoom);
      
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(x/2, h, x, y);
      
      ctx.strokeStyle = state === 'crashed' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.lineTo(x, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = state === 'crashed' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)';
      ctx.fill();

      // Rocket
      if (state !== 'crashed') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 4);
          ctx.font = "40px Arial";
          ctx.fillText("🚀", -20, 0);
          ctx.restore();
      } else {
          ctx.font = "50px Arial";
          ctx.fillText("💥", x - 20, y);
      }
  };

  const handleBet = () => {
      if (balance < bet) return;
      setBetPlaced(true);
      onEndGame(-bet);
      playSound('click');
  };

  const handleCashout = () => {
      if (gameState !== 'running' || cashedOut) return;
      setCashedOut(true);
      const win = bet * multiplier;
      onEndGame(win);
      playSound('win');
      triggerAI(`Cashed out at ${multiplier.toFixed(2)}x`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* History Bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center h-12">
         <span className="text-xs text-slate-500 font-bold uppercase px-2">Latest</span>
         {history.map((h, i) => (
             <div key={i} className={`px-3 py-1 rounded-md text-xs font-bold font-mono ${h >= 2 ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-800' : 'text-slate-400 bg-slate-800 border border-slate-700'}`}>
                 {h.toFixed(2)}x
             </div>
         ))}
      </div>

      {/* Game Window */}
      <div className="relative w-full h-[400px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mb-6">
         <canvas ref={canvasRef} width={1000} height={400} className="w-full h-full" />
         
         {/* Overlay */}
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             {gameState === 'betting' && (
                 <div className="text-center">
                     <div className="text-5xl font-mono font-black text-slate-200 mb-2">{countdown.toFixed(1)}s</div>
                     <div className="text-emerald-500 font-bold tracking-widest">NEXT ROUND</div>
                 </div>
             )}
             {gameState === 'running' && (
                 <div className="text-7xl font-mono font-black text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                     {multiplier.toFixed(2)}x
                 </div>
             )}
             {gameState === 'crashed' && (
                 <div className="text-center">
                     <div className="text-7xl font-mono font-black text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]">
                         {multiplier.toFixed(2)}x
                     </div>
                     <div className="text-rose-400 font-bold tracking-widest mt-2">CRASHED</div>
                 </div>
             )}
         </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="flex-1">
              <label className="text-xs text-slate-400 font-bold uppercase block mb-1">Wager</label>
              <div className="flex items-center bg-slate-900 rounded-lg border border-slate-600 px-3 h-14">
                  <span className="text-gold-500 mr-2">$</span>
                  <input 
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    disabled={betPlaced || gameState !== 'betting'}
                    className="bg-transparent text-white text-xl font-mono w-full outline-none"
                  />
              </div>
          </div>
          <div className="w-48">
             <label className="text-xs text-transparent block mb-1">Action</label>
             {gameState === 'betting' ? (
                 <Button 
                    variant="primary" 
                    className="w-full h-14 text-xl font-bold"
                    onClick={handleBet}
                    disabled={betPlaced || balance < bet}
                 >
                     {betPlaced ? 'BET PLACED' : 'BET'}
                 </Button>
             ) : (
                 <Button 
                    variant="success" 
                    className="w-full h-14 text-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    onClick={handleCashout}
                    disabled={gameState === 'crashed' || !betPlaced || cashedOut}
                 >
                     {cashedOut ? 'CASHED' : 'CASH OUT'}
                 </Button>
             )}
          </div>
      </div>
      
      <div className="mt-2 text-center h-6">
          {aiCommentary && <span className="text-sm text-slate-400">{aiCommentary}</span>}
      </div>
    </div>
  );
};
