
import React from 'react';

interface ResultOverlayProps {
  result: 'WIN' | 'LOSE' | 'PUSH';
  amount: number;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({ result, amount }) => {
  const isWin = result === 'WIN';
  const isPush = result === 'PUSH';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fade-in"></div>
      <div className={`
        relative z-10 transform animate-slide-up
        flex flex-col items-center justify-center
        px-12 py-10 rounded-3xl border-y-4 shadow-2xl
        bg-slate-900/95
        ${isWin 
          ? 'border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)]' 
          : isPush
            ? 'border-slate-500 shadow-[0_0_30px_rgba(148,163,184,0.2)]'
            : 'border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]'
        }
      `}>
        <div className={`text-6xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-xl ${
             isWin ? 'text-emerald-400' : isPush ? 'text-slate-300' : 'text-red-500'
        }`}>
           {result}
        </div>
        
        <div className={`text-4xl md:text-5xl font-mono font-bold tracking-tight drop-shadow-md ${
             isWin ? 'text-white' : isPush ? 'text-slate-400' : 'text-red-200'
        }`}>
           {isWin ? '+' : ''}{isPush ? '' : amount < 0 ? '-' : ''}${Math.abs(amount).toFixed(2)}
        </div>

        {/* Decorative elements */}
        {isWin && (
             <>
               <div className="absolute -top-6 -right-6 text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>💰</div>
               <div className="absolute -bottom-6 -left-6 text-6xl animate-bounce" style={{ animationDelay: '0.3s' }}>✨</div>
             </>
        )}
      </div>
    </div>
  );
};
