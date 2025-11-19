
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
  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed_out'>('idle');
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const [aiCommentary, setAiCommentary] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const reqRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const soundThrottleRef = useRef<number>(0);

  const triggerAI = async (context: string) => {
      const msg = await generateHypeMessage(context);
      setAiCommentary(msg);
  };

  const startGame = () => {
    if (balance < bet) return;
    playSound('click');
    onEndGame(-bet);
    
    setGameState('running');
    setMultiplier(1.00);
    setCashedAt(null);
    setAiCommentary('');
    
    const r = Math.random();
    const calculatedCrash = Math.max(1.00, (0.99 / (1 - r)));
    setCrashPoint(calculatedCrash);
    
    startTimeRef.current = Date.now();
    soundThrottleRef.current = 0;
    loop();
  };

  const loop = () => {
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000; 
    const currentMult = 1 + (elapsed * elapsed * 0.1) + (elapsed * 0.1);
    
    // Play tick sound every 0.5 increase or faster
    if (now - soundThrottleRef.current > 800 / (currentMult)) {
        playSound('tick');
        soundThrottleRef.current = now;
    }

    if (currentMult >= crashPoint) {
      setMultiplier(crashPoint);
      setGameState('crashed');
      drawGraph(crashPoint, 'crashed');
      playSound('crash');
      triggerAI(`Market crashed at ${crashPoint.toFixed(2)}x. Traders wiped out.`);
    } else {
      setMultiplier(currentMult);
      drawGraph(currentMult, 'running');
      reqRef.current = requestAnimationFrame(loop);
    }
  };

  const cashOut = () => {
    if (gameState !== 'running') return;
    cancelAnimationFrame(reqRef.current!);
    setGameState('cashed_out');
    setCashedAt(multiplier);
    const win = bet * multiplier;
    onEndGame(win);
    drawGraph(multiplier, 'cashed_out');
    playSound('win');
    triggerAI(`Smart trader cashed out at ${multiplier.toFixed(2)}x! Winning ${win.toFixed(0)}.`);
  };

  const drawGraph = (current: number, state: string) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const width = cvs.width;
    const height = cvs.height;

    // Clear with transparent background logic or solid
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = '#334155'; 
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical lines
    for(let i=0; i<width; i+=80) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    // Horizontal lines
    for(let i=0; i<height; i+=60) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // Line
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    const x = Math.min(width, (current - 1) * 100); 
    const y = height - Math.min(height, (current - 1) * 50); 

    ctx.quadraticCurveTo(x/2, height, x, y);
    
    if (state === 'crashed') {
      ctx.strokeStyle = '#ef4444'; // Red
      ctx.shadowColor = '#ef4444';
    } else if (state === 'cashed_out') {
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.shadowColor = '#10b981';
    } else {
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.shadowColor = '#3b82f6';
    }
    
    ctx.lineWidth = 5;
    ctx.shadowBlur = 20;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow for fill

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
    
    // Draw a dot at the tip
    if (state === 'running') {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
    }
  };

  useEffect(() => {
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-6">
      <div className="h-8 mb-4 text-gold-400 font-medium animate-fade-in text-center">
          {aiCommentary}
      </div>

      <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden mb-8 shadow-2xl ring-1 ring-white/5">
        {/* Subtle grid background already in canvas, but lets add a vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.8)_100%)] pointer-events-none z-10"></div>
        
        <canvas 
          ref={canvasRef} 
          width={1000} 
          height={450} 
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Multiplier */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
           <span className={`text-8xl font-black font-mono tracking-tighter drop-shadow-2xl transition-colors duration-100 ${
             gameState === 'crashed' ? 'text-red-500' : 
             gameState === 'cashed_out' ? 'text-emerald-500' : 'text-white'
           }`}>
             {multiplier.toFixed(2)}x
           </span>
           {gameState === 'crashed' && <span className="text-red-400 font-bold text-2xl mt-4 uppercase tracking-[0.3em] animate-pulse">Market Crash</span>}
           {gameState === 'cashed_out' && <span className="text-emerald-400 font-bold text-2xl mt-4 uppercase tracking-[0.3em] animate-bounce">Secure Profit</span>}
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
                disabled={gameState === 'running'}
                className="w-full bg-slate-900 border border-slate-600 p-4 pl-10 rounded-xl text-white font-mono text-2xl focus:border-blue-500 outline-none shadow-inner transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 flex items-end">
           {gameState === 'running' ? (
             <Button 
               variant="success" 
               className="w-full h-[72px] text-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-pulse"
               onClick={cashOut}
             >
               CASH OUT
             </Button>
           ) : (
             <Button 
               variant="primary" 
               className="w-full h-[72px] text-2xl font-black shadow-lg hover:shadow-blue-900/50"
               onClick={startGame}
               disabled={balance < bet}
             >
               PLACE BET
             </Button>
           )}
        </div>
      </div>
    </div>
  );
};
