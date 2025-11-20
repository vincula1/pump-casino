
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className} select-none group`}>
      {/* Minimalist Symbol */}
      <div className="relative w-8 h-8 flex items-center justify-center">
         <div className="absolute inset-0 border-2 border-slate-700 rounded-lg transform rotate-0 group-hover:rotate-180 transition-transform duration-700"></div>
         <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg transform rotate-45 group-hover:rotate-[-135deg] transition-transform duration-700 mix-blend-screen"></div>
         <div className="w-2 h-2 bg-gold-500 rounded-full shadow-[0_0_10px_#fbbf24] animate-pulse"></div>
      </div>

      {/* Typography */}
      <div className="flex flex-col justify-center h-full leading-none">
        <span className="text-lg font-black text-white tracking-tight font-sans">
          PUMP
        </span>
        <span className="text-[0.6rem] font-bold text-emerald-500 tracking-[0.3em] uppercase">
          CASINO
        </span>
      </div>
    </div>
  );
};
