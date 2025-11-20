
import React from 'react';

interface ResultOverlayProps {
  isOpen: boolean;
  message: string;
  amount?: number;
  type: 'win' | 'lose' | 'neutral';
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({ isOpen, message, amount, type }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-600 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] transform animate-slide-up flex flex-col items-center gap-2 min-w-[240px]">
        <h2 className={`text-5xl font-black uppercase tracking-tighter drop-shadow-2xl ${
            type === 'win' ? 'text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 filter drop-shadow-[0_2px_0_rgba(0,0,0,1)]' : 
            type === 'lose' ? 'text-slate-500' : 'text-white'
        }`}>
            {message}
        </h2>
        {amount !== undefined && amount > 0 && (
            <div className="text-3xl font-mono font-bold text-emerald-400 drop-shadow-md mt-2">
                +${amount.toLocaleString()}
            </div>
        )}
      </div>
    </div>
  );
};
