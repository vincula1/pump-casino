
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface DiceProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

export const Dice: React.FC<DiceProps> = ({ onEndGame, balance }) => {
  const [bet, setBet] = useState(10);
  const [prediction, setPrediction] = useState(50);
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [aiCommentary, setAiCommentary] = useState('');

  const multiplier = parseFloat((98 / (100 - prediction)).toFixed(2));
  const winChance = 100 - prediction;

  const triggerAI = async (context: string) => {
    const msg = await generateHypeMessage(context);
    setAiCommentary(msg);
  };

  const play = async () => {
    if (balance < bet) return;
    onEndGame(-bet);
    setRolling(true);
    setRoll(null);
    setAiCommentary('');
    playSound('click');

    let tempRoll = 0;
    const interval = setInterval(() => {
      tempRoll = Math.floor(Math.random() * 100);
      setRoll(tempRoll);
      playSound('tick');
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      const finalRoll = Math.random() * 100;
      const finalDisplay = parseFloat(finalRoll.toFixed(2));
      setRoll(finalDisplay);
      setRolling(false);

      if (finalDisplay > prediction) {
        const win = bet * multiplier;
        onEndGame(win);
        playSound('win');
        triggerAI(`Player won ${win.toFixed(0)} dollars on dice roll`);
      } else {
        playSound('lose');
        triggerAI("Player lost on dice roll");
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 md:p-10">
      {/* AI Commentary */}
      <div className="h-12 flex items-center justify-center w-full mb-4">
          {aiCommentary && <span className="text-gold-400 font-medium animate-fade-in text-center bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 backdrop-blur">{aiCommentary}</span>}
      </div>
      
      {/* Visualizer */}
      <div className="w-full bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.3)] mb-8 relative overflow-hidden">
        <div className="flex justify-between text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">
             <span>0</span>
             <span>25</span>
             <span>50</span>
             <span>75</span>
             <span>100</span>
        </div>
        
        {/* The Track */}
        <div className="w-full h-24 bg-slate-900/50 rounded-2xl relative overflow-hidden border border-slate-800 shadow-inner">
            {/* Lose Zone */}
            <div 
            className="absolute top-0 bottom-0 left-0 bg-red-500/10 transition-all duration-300 border-r border-red-500/20 flex items-center justify-center overflow-hidden"
            style={{ width: `${prediction}%` }} 
            >
                <span className="text-red-500/20 font-black text-4xl">LOSE</span>
            </div>
            {/* Win Zone */}
            <div 
            className="absolute top-0 bottom-0 right-0 bg-emerald-500/10 transition-all duration-300 border-l border-emerald-500/20 flex items-center justify-center overflow-hidden"
            style={{ width: `${100 - prediction}%` }} 
            >
                 <span className="text-emerald-500/20 font-black text-4xl">WIN</span>
            </div>
            
            {/* Handle / Result */}
            {roll !== null && (
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white z-30 transition-all duration-100 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                style={{ left: `${roll}%` }}
            >
                <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 font-bold text-3xl px-4 py-2 rounded-xl bg-slate-800 shadow-2xl border-2 ${roll > prediction ? 'text-emerald-400 border-emerald-500 shadow-emerald-500/20' : 'text-red-400 border-red-500 shadow-red-500/20'}`}>
                {roll}
                </div>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-24 bg-gradient-to-b from-white/20 to-transparent pointer-events-none`}></div>
            </div>
            )}
        </div>
        
        {/* Slider Control */}
        <div className="mt-8 relative z-20">
            <input 
                type="range" 
                min="2" 
                max="98" 
                value={prediction}
                onChange={(e) => {
                    setPrediction(Number(e.target.value));
                    playSound('tick');
                }}
                disabled={rolling}
                className="w-full h-4 bg-slate-700 rounded-full appearance-none cursor-pointer outline-none opacity-90 hover:opacity-100 transition-opacity"
                style={{
                    background: `linear-gradient(to right, #334155 ${prediction}%, #10b981 ${prediction}%)`
                }}
            />
            <div className="flex justify-center mt-4 text-slate-400 text-sm font-medium">
                Drag slider to adjust Win Chance
            </div>
        </div>
      </div>

      {/* Stats & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg backdrop-blur">
             <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Multiplier</div>
             <div className="text-3xl font-mono text-white font-bold">{multiplier}x</div>
        </div>
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg backdrop-blur">
             <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Win Chance</div>
             <div className="text-3xl font-mono text-emerald-400 font-bold">{winChance}%</div>
        </div>
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg backdrop-blur relative group">
             <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Wager</div>
             <div className="flex items-center">
                <span className="text-gold-500 mr-2 text-xl">$</span>
                <input 
                type="number" 
                value={bet}
                onChange={e => setBet(Number(e.target.value))}
                className="w-full bg-transparent text-3xl font-mono text-white outline-none font-bold"
                />
             </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gold-500 transform scale-x-0 group-hover:scale-x-100 transition-transform rounded-b-2xl"></div>
        </div>
      </div>

      <div className="mt-8 w-full">
        <Button 
          variant="primary" 
          fullWidth 
          className="h-20 text-2xl font-black tracking-wide shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_40px_-5px_rgba(16,185,129,0.5)]" 
          onClick={play} 
          disabled={rolling || balance < bet}
        >
          {rolling ? 'ROLLING...' : 'ROLL DICE'}
        </Button>
      </div>
    </div>
  );
};
