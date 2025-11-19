
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className="relative w-14 h-14 shrink-0">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gold-500/40 rounded-full blur-xl animate-pulse"></div>
        
        {/* Main Vector SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
             <linearGradient id="emeraldSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>

          {/* Outer Shield/Ring */}
          <path d="M50 5 L85 20 L85 50 C85 75 50 95 50 95 C50 95 15 75 15 50 L15 20 L50 5 Z" fill="url(#darkMetal)" stroke="url(#goldGradient)" strokeWidth="3" />
          
          {/* Inner Diamond Shape */}
          <path d="M50 20 L75 50 L50 80 L25 50 Z" fill="url(#emeraldSheen)" opacity="0.2" />
          
          {/* The "P" Monogram */}
          <path 
            d="M42 30 H54 C64 30 68 36 68 45 C68 54 64 60 54 60 H48 V75 H42 V30 Z M48 36 V54 H54 C58 54 60 52 60 45 C60 38 58 36 54 36 H48 Z" 
            fill="url(#goldGradient)" 
          />
          
          {/* Crown Icon on top */}
          <path d="M35 25 L42 12 L50 18 L58 12 L65 25" fill="#fcd34d" stroke="#b45309" strokeWidth="1" />

          {/* Sparkle */}
          <path d="M80 20 L82 15 L84 20 L89 22 L84 24 L82 29 L80 24 L75 22 Z" fill="white" className="animate-ping" style={{ animationDuration: '3s' }} />
        </svg>
      </div>

      {/* Text Branding */}
      <div className="flex flex-col justify-center">
        <h1 className="text-2xl font-black text-white tracking-tighter italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none" style={{ fontFamily: 'Inter, sans-serif' }}>
          PUMP
        </h1>
        <div className="flex items-center gap-1 leading-none mt-1">
          <div className="h-[2px] w-4 bg-gold-500 rounded-full"></div>
          <span className="text-[10px] font-bold text-gold-400 tracking-[0.4em] uppercase shadow-black drop-shadow-md">
            CASINO
          </span>
          <div className="h-[2px] w-8 bg-gradient-to-r from-gold-500 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
