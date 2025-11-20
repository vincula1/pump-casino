
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { ResultOverlay } from '../components/ui/ResultOverlay';

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
  const [countdown, setCountdown] = useState(5); // Faster rounds
  const [resultOverlay, setResultOverlay] = useState<{show: boolean, type: 'win'|'lose'|'neutral', msg: string, amount?: number}>({ show: false, type: 'neutral', msg: '' });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const gameStateRef = useRef('betting'); 

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  // Betting Timer
  useEffect(() => {
    let interval: any;
    if (gameState === 'betting') {
        setCountdown(5);
        setMultiplier(1.00);
        drawGraph(1.00, 'betting');
        setResultOverlay({ show: false, type: 'neutral', msg: '' });
        
        interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 0.1) {
                    clearInterval(interval);
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
      if (gameStateRef.current === 'running') return;
      setGameState('running');
      gameStateRef.current = 'running'; // CRITICAL FIX: Update ref immediately for loop
      
      // Crash Point Logic
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
    const currentMult = 1 + (elapsed * elapsed * 0.1) + (elapsed * 0.1); // Faster growth
    
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
      gameStateRef.current = 'crashed';
      drawGraph(finalValue, 'crashed');
      setHistory(prev => [parseFloat(finalValue.toFixed(2)), ...prev].slice(0, 10));
      playSound('crash');

      if (betPlaced && !cashedOut) {
          triggerAI(`Crashed at ${finalValue.toFixed(2)}x.`);
          setResultOverlay({ show: true, type: 'lose', msg: 'CRASHED' });
      } else if (cashedOut) {
          // Already showed win overlay in handleCashout, maybe update it?
      }

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

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<5; i++) {
        ctx.moveTo(0, h - (h/4)*i);
        ctx.lineTo(w, h - (h/4)*i);
      }
      ctx.stroke();

      const zoom = Math.max(1, current / 2); 
      const x = Math.min(w - 100, (current - 1) * 200 / zoom); 
      const y = h - Math.min(h - 50, (current - 1) * 100 / zoom);
      
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.quadraticCurveTo(x/2, h, x, y);
      
      ctx.strokeStyle = state === 'crashed' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.lineTo(x, h);
      ctx.lineTo(0, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (state === 'crashed') {
        grad.addColorStop(0, 'rgba(239,68,68,0.5)');
        grad.addColorStop(1, 'rgba(239,68,68,0.0)');
      } else {
        grad.addColorStop(0, 'rgba(59,130,246,0.5)');
        grad.addColorStop(1, 'rgba(59,130,246,0.0)');
      }
      ctx.fillStyle = grad;
      ctx.fill();

      // Rocket
      if (state !== 'crashed') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 8);
          ctx.font = "40px Arial";
          ctx.shadowColor = "#3b82f6";
          ctx.shadowBlur = 20;
          ctx.fillText("🚀", -20, 0);
          ctx.restore();
      } else {
          ctx.font = "50px Arial";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 30;
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
      setResultOverlay({ show: true, type: 'win', msg: 'CASHED OUT', amount: win });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* History */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide items-center h-12">
         <span className="text-xs text-slate-500 font-bold uppercase px-2">History</span>
         {history.map((h, i) => (
             <div key={i} className={`px-3 py-1 rounded-md text-xs font-bold font-mono ${h >= 2 ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-800' : 'text-slate-400 bg-slate-800 border border-slate-700'}`}>
                 {h.toFixed(2)}x
             </div>
         ))}
      </div>

      {/* Game Window */}
      <div className="relative w-full h-[400px] bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden mb-6">
         <canvas ref={canvasRef} width={1000} height={400} className="w-full h-full" />
         
         <ResultOverlay isOpen={resultOverlay.show} message={resultOverlay.msg} amount={resultOverlay.amount} type={resultOverlay.type} />

         {/* Central Text */}
         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             {gameState === 'betting' && (
                 <div className="text-center">
                     <div className="text-6xl font-mono font-black text-slate-200 mb-2">{countdown.toFixed(1)}s</div>
                     <div className="text-emerald-500 font-bold tracking-widest">STARTING SOON</div>
                 </div>
             )}
             {gameState === 'running' && (
                 <div className="text-8xl font-mono font-black text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                     {multiplier.toFixed(2)}x
                 </div>
             )}
             {gameState === 'crashed' && !resultOverlay.show && (
                 <div className="text-center">
                     <div className="text-8xl font-mono font-black text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]">
                         {multiplier.toFixed(2)}x
                     </div>
                     <div className="text-rose-400 font-bold tracking-widest mt-2">CRASHED</div>
                 </div>
             )}
         </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <div className="flex-1">
              <label className="text-xs text-slate-400 font-bold uppercase block mb-2">Wager Amount</label>
              <div className="flex items-center bg-slate-900 rounded-xl border border-slate-600 px-4 h-16">
                  <span className="text-gold-500 mr-2 text-xl">$</span>
                  <input 
                    type="number"
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    disabled={betPlaced || gameState !== 'betting'}
                    className="bg-transparent text-white text-2xl font-mono font-bold w-full outline-none"
                  />
              </div>
          </div>
          <div className="w-64">
             <label className="text-xs text-transparent block mb-2">Action</label>
             {gameState === 'betting' ? (
                 <Button 
                    variant="primary" 
                    className="w-full h-16 text-2xl font-black tracking-wide"
                    onClick={handleBet}
                    disabled={betPlaced || balance < bet}
                 >
                     {betPlaced ? 'BET PLACED' : 'PLACE BET'}
                 </Button>
             ) : (
                 <Button 
                    variant="success" 
                    className="w-full h-16 text-2xl font-black tracking-wide shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    onClick={handleCashout}
                    disabled={gameState === 'crashed' || !betPlaced || cashedOut}
                 >
                     {cashedOut ? 'CASHED OUT' : 'CASH OUT'}
                 </Button>
             )}
          </div>
      </div>
      
      <div className="mt-4 text-center min-h-[1.5rem]">
          {aiCommentary && <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">{aiCommentary}</span>}
      </div>
    </div>
  );
};
