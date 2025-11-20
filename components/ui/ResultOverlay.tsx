
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
      <div className={`
        relative min-w-[200px] p-8 rounded-3xl flex flex-col items-center animate-slide-up pointer-events-auto transition-all duration-300
        ${isWin 
          ? 'bg-gradient-to-b from-emerald-900/90 to-slate-900/95 border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.4)]' 
          : isPush
            ? 'bg-slate-800/90 border-2 border-slate-500 shadow-xl'
            : 'bg-slate-900/95 border-2 border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]'
        }
        backdrop-blur-xl
      `}>
        
        {/* Result Text */}
        <div className={`text-5xl md:text-6xl font-black tracking-tighter mb-2 drop-shadow-lg ${
             isWin 
               ? 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600' 
               : isPush
                 ? 'text-slate-300' 
                 : 'text-rose-500'
        }`}>
           {result}
        </div>
        
        {/* Amount */}
        <div className={`text-2xl md:text-3xl font-mono font-bold tracking-tight ${
             isWin 
               ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' 
               : isPush 
                 ? 'text-slate-400' 
                 : 'text-rose-400'
        }`}>
           {isWin ? '+' : ''}{isPush ? '' : amount < 0 ? '-' : ''}${Math.abs(amount).toFixed(2)}
        </div>

        {/* Shine effect for wins */}
        {isWin && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};
