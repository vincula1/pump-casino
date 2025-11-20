
import React from 'react';

interface ResultOverlayProps {
  result: 'WIN' | 'LOSE' | 'PUSH';
  amount: number;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({ result, amount }) => {
  const isWin = result === 'WIN';
  const isPush = result === 'PUSH';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
      {/* Floating Glass Card */}
      <div className={`
        relative z-10 transform animate-slide-up
        flex flex-col items-center justify-center
        px-12 py-8 rounded-3xl
        bg-slate-900/85 backdrop-blur-xl
        border-2 shadow-2xl
        transition-all duration-300
        ${isWin 
          ? 'border-emerald-500/40 shadow-[0_20px_60px_rgba(16,185,129,0.3)]' 
          : isPush
            ? 'border-slate-500/40 shadow-[0_20px_40px_rgba(148,163,184,0.2)]'
            : 'border-rose-500/40 shadow-[0_20px_60px_rgba(244,63,94,0.3)]'
        }
      `}>
        <div className={`text-6xl md:text-8xl font-black tracking-tighter mb-2 drop-shadow-2xl ${
             isWin ? 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-500' 
             : isPush ? 'text-slate-300' 
             : 'text-transparent bg-clip-text bg-gradient-to-b from-rose-400 to-rose-600'
        }`}>
           {result}
        </div>
        
        <div className={`text-3xl md:text-5xl font-mono font-bold tracking-tight drop-shadow-md ${
             isWin ? 'text-white' : isPush ? 'text-slate-400' : 'text-rose-100'
        }`}>
           {isWin ? '+' : ''}{isPush ? '' : amount < 0 ? '-' : ''}${Math.abs(amount).toFixed(2)}
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
