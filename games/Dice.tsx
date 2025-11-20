
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
    <div className="flex flex-col items-center max-w-5xl mx-auto p-6 md:p-10">
      {/* AI Commentary */}
      <div className="h-12 flex items-center justify-center w-full mb-4">
          {aiCommentary && <span className="text-emerald-400 font-medium animate-fade-in text-center bg-slate-900/80 px-6 py-2 rounded-full border border-emerald-500/20 backdrop-blur shadow-lg shadow-emerald-500/10">{aiCommentary}</span>}
      </div>
      
      {/* Visualizer */}
      <div className="w-full bg-slate-900 rounded-[2rem] p-8 md:p-16 border border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.5)] mb-10 relative overflow-hidden group">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>

        <div className="flex justify-between text-slate-500 text-xs font-black mb-6 uppercase tracking-[0.3em]">
             <span>0</span>
             <span>25</span>
             <span>50</span>
             <span>75</span>
             <span>100</span>
        </div>
        
        {/* The Track */}
        <div className="w-full h-16 bg-slate-950 rounded-xl relative overflow-hidden border border-slate-800 shadow-inner ring-1 ring-white/5">
            {/* Lose Zone */}
            <div 
            className="absolute top-0 bottom-0 left-0 bg-red-500/20 transition-all duration-300 border-r-2 border-red-500 flex items-center justify-center overflow-hidden"
            style={{ width: `${prediction}%` }} 
            >
                <span className="text-red-500 font-black text-4xl opacity-30 tracking-widest blur-[1px]">LOSE</span>
            </div>
            {/* Win Zone */}
            <div 
            className="absolute top-0 bottom-0 right-0 bg-emerald-500/20 transition-all duration-300 flex items-center justify-center overflow-hidden"
            style={{ width: `${100 - prediction}%` }} 
            >
                 <span className="text-emerald-500 font-black text-4xl opacity-30 tracking-widest blur-[1px]">WIN</span>
            </div>
            
            {/* Handle / Result */}
            {roll !== null && (
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white z-30 transition-all duration-100 shadow-[0_0_20px_white]"
                style={{ left: `${roll}%` }}
            >
                <div className={`absolute -top-20 left-1/2 transform -translate-x-1/2 font-black text-4xl px-6 py-3 rounded-2xl bg-slate-900 shadow-2xl border-2 ${roll > prediction ? 'text-emerald-400 border-emerald-500 shadow-emerald-500/40' : 'text-red-400 border-red-500 shadow-red-500/40'}`}>
                {roll}
                </div>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-24 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none`}></div>
            </div>
            )}
        </div>
        
        {/* Custom Slider Control */}
        <div className="mt-12 relative z-20">
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
                className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer outline-none opacity-90 hover:opacity-100 transition-opacity"
                style={{
                    background: `linear-gradient(to right, #ef4444 ${prediction}%, #10b981 ${prediction}%)`
                }}
            />
            <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 32px;
                    width: 32px;
                    border-radius: 50%;
                    background: #fff;
                    cursor: pointer;
                    margin-top: -14px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */
                    box-shadow: 0 0 20px rgba(255,255,255,0.8);
                    border: 4px solid #0f172a;
                }
            `}</style>
        </div>
      </div>

      {/* Stats & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur flex flex-col items-center justify-center group hover:border-slate-600 transition-colors">
             <div className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-2 font-bold">Multiplier</div>
             <div className="text-4xl font-mono text-white font-black group-hover:text-blue-400 transition-colors">{multiplier}x</div>
        </div>
        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur flex flex-col items-center justify-center group hover:border-emerald-500/30 transition-colors">
             <div className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-2 font-bold">Win Chance</div>
             <div className="text-4xl font-mono text-emerald-400 font-black group-hover:text-emerald-300 transition-colors">{winChance}%</div>
        </div>
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-xl backdrop-blur relative overflow-hidden">
             <div className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-2 font-bold">Wager Amount</div>
             <div className="flex items-center bg-slate-900 rounded-xl px-4 border border-slate-700 focus-within:border-gold-500 transition-colors">
                <span className="text-gold-500 mr-2 text-2xl">$</span>
                <input 
                type="number" 
                value={bet}
                onChange={e => setBet(Number(e.target.value))}
                className="w-full bg-transparent text-3xl font-mono text-white outline-none font-bold py-4"
                />
             </div>
        </div>
      </div>

      <div className="mt-10 w-full">
        <Button 
          variant="primary" 
          fullWidth 
          className="h-24 text-3xl font-black tracking-widest shadow-[0_10px_50px_-10px_rgba(59,130,246,0.4)] hover:shadow-[0_10px_50px_-5px_rgba(59,130,246,0.6)] bg-blue-600 hover:bg-blue-500 border-blue-400" 
          onClick={play} 
          disabled={rolling || balance < bet}
        >
          {rolling ? 'ROLLING...' : 'ROLL DICE'}
        </Button>
      </div>
    </div>
  );
};
