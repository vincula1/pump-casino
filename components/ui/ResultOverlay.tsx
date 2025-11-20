
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
      <div className="flex flex-col items-center justify-center animate-slide-up">
        
        {/* Result Text */}
        <div className={`text-7xl md:text-9xl font-black tracking-tighter mb-2 drop-shadow-2xl transform -rotate-3 transition-transform duration-300 ${
             isWin 
               ? 'text-transparent bg-clip-text bg-gradient-to-b from-gold-300 via-gold-500 to-gold-700 filter drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] scale-110' 
               : isPush
                 ? 'text-slate-400 scale-100' 
                 : 'text-transparent bg-clip-text bg-gradient-to-b from-rose-500 to-red-700 opacity-90 scale-100'
        }`}>
           {result}
        </div>
        
        {/* Amount */}
        <div className={`text-4xl md:text-6xl font-mono font-bold tracking-tight drop-shadow-xl ${
             isWin 
               ? 'text-white text-shadow-emerald drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' 
               : isPush 
                 ? 'text-slate-300' 
                 : 'text-rose-500'
        }`}>
           {isWin ? '+' : ''}{isPush ? '' : amount < 0 ? '-' : ''}${Math.abs(amount).toFixed(2)}
        </div>
      </div>
    </div>
  );
};
