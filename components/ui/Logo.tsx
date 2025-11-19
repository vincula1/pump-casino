import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className} select-none`}>
      {/* Minimalist Icon */}
      <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-lg group overflow-hidden">
        <div className="absolute inset-0 bg-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Abstract 'P' shape */}
        <div className="relative w-5 h-5">
            <div className="absolute top-0 left-0 w-full h-full border-2 border-gold-500 rounded-sm transform rotate-45 group-hover:rotate-90 transition-transform duration-500"></div>
            <div className="absolute inset-0 m-auto w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse"></div>
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className="text-lg font-bold text-white tracking-tight font-sans">
          PUMP
        </span>
        <span className="text-[10px] font-bold text-gold-500 tracking-[0.2em] uppercase">
          CASINO
        </span>
      </div>
    </div>
  );
};