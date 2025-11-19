
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className} select-none group`}>
      {/* Minimalist Monogram */}
      <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black text-lg rounded shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        P
      </div>

      {/* Text */}
      <div className="flex flex-col justify-center">
        <span className="text-lg font-black text-white tracking-tighter leading-none group-hover:text-emerald-400 transition-colors">
          PUMP
        </span>
      </div>
    </div>
  );
};
