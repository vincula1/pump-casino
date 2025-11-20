
import React from 'react';
import { GameType } from '../../types';
import { playSound } from '../../services/audioService';

interface CardProps {
  title: string;
  description: string;
  color: string;
  onClick: () => void;
  players: number;
}

const GameIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case GameType.BLACKJACK:
      return (
        <div className="relative w-24 h-24 transform rotate-[-10deg]">
          <div className="absolute top-0 left-4 w-16 h-24 bg-white rounded-lg border-2 border-slate-300 shadow-lg flex items-center justify-center">
            <span className="text-red-600 font-bold text-xl">♥</span>
          </div>
          <div className="absolute top-2 left-8 w-16 h-24 bg-slate-800 rounded-lg border-2 border-gold-500 shadow-xl flex items-center justify-center transform rotate-[15deg]">
            <span className="text-gold-500 font-bold text-xl">J</span>
          </div>
        </div>
      );
    case GameType.DICE:
      return (
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg transform rotate-6 border border-blue-400 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-2">
               <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_5px_white]"></div>
               <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_5px_white]"></div>
               <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_5px_white]"></div>
               <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_5px_white]"></div>
            </div>
          </div>
        </div>
      );
    case GameType.SLOTS:
      return (
        <div className="relative w-24 h-24">
           <div className="absolute inset-0 bg-gradient-to-b from-purple-900 to-slate-900 rounded-xl border-2 border-gold-500 shadow-xl overflow-hidden">
               <div className="flex h-full justify-around items-center px-1 bg-black/20">
                  <div className="w-6 h-16 bg-gradient-to-b from-slate-100 to-slate-300 rounded-sm border border-slate-400 flex items-center justify-center overflow-hidden">
                      <span className="text-red-600 font-bold text-lg animate-bounce">7</span>
                  </div>
                  <div className="w-6 h-16 bg-gradient-to-b from-slate-100 to-slate-300 rounded-sm border border-slate-400 flex items-center justify-center overflow-hidden">
                      <span className="text-purple-600 font-bold text-lg animate-bounce delay-75">🍇</span>
                  </div>
                  <div className="w-6 h-16 bg-gradient-to-b from-slate-100 to-slate-300 rounded-sm border border-slate-400 flex items-center justify-center overflow-hidden">
                      <span className="text-gold-600 font-bold text-lg animate-bounce delay-150">🔔</span>
                  </div>
               </div>
               <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
           </div>
        </div>
      );
    case GameType.ROULETTE:
      return (
        <div className="relative w-24 h-24 flex items-center justify-center">
           {/* Wheel Base */}
           <div className="w-22 h-22 rounded-full border-4 border-gold-600 bg-slate-900 shadow-xl relative overflow-hidden animate-spin-slow">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Simple sectors */}
                <path d="M50 50 L50 0 A50 50 0 0 1 85 15 Z" fill="#ef4444" />
                <path d="M50 50 L85 15 A50 50 0 0 1 100 50 Z" fill="#1f2937" />
                <path d="M50 50 L100 50 A50 50 0 0 1 85 85 Z" fill="#ef4444" />
                <path d="M50 50 L85 85 A50 50 0 0 1 50 100 Z" fill="#1f2937" />
                <path d="M50 50 L50 100 A50 50 0 0 1 15 85 Z" fill="#ef4444" />
                <path d="M50 50 L15 85 A50 50 0 0 1 0 50 Z" fill="#1f2937" />
                <path d="M50 50 L0 50 A50 50 0 0 1 15 15 Z" fill="#ef4444" />
                <path d="M50 50 L15 15 A50 50 0 0 1 50 0 Z" fill="#10b981" />
                <circle cx="50" cy="50" r="20" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
              </svg>
           </div>
           {/* Center Ball/Hub */}
           <div className="absolute w-3 h-3 bg-gold-400 rounded-full shadow-[0_0_10px_white]"></div>
        </div>
      );
    case GameType.CRASH:
      return (
        <div className="w-28 h-20 bg-slate-800 rounded-lg border border-slate-600 relative overflow-hidden flex items-end p-2 shadow-inner">
           <svg className="w-full h-full" viewBox="0 0 100 50">
              <path d="M0 50 Q 50 50 100 10" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
           </svg>
           <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
        </div>
      );
    case GameType.MINES:
      return (
        <div className="w-20 h-20 grid grid-cols-3 gap-1 p-2 bg-slate-800 rounded-lg border border-slate-600 shadow-xl rotate-3">
           {[...Array(9)].map((_, i) => (
             <div key={i} className={`rounded-sm ${i === 4 ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : i === 7 ? 'bg-rose-500' : 'bg-slate-600'}`}></div>
           ))}
        </div>
      );
    default:
      return <div className="w-20 h-20 bg-slate-700 rounded-full"></div>;
  }
};

export const GameCard: React.FC<CardProps> = ({ title, description, color, onClick, players }) => {
  const handleClick = () => {
    playSound('click');
    onClick();
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative h-72 overflow-hidden rounded-3xl bg-slate-800/40 border border-slate-700/50 cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(251,191,36,0.1)] hover:border-gold-500/40 hover:-translate-y-2 backdrop-blur-md"
    >
      {/* Background Gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${
        title === GameType.BLACKJACK ? 'from-emerald-900/60 to-slate-900' :
        title === GameType.ROULETTE ? 'from-red-900/60 to-slate-900' :
        title === GameType.SLOTS ? 'from-yellow-900/60 to-slate-900' :
        title === GameType.DICE ? 'from-blue-900/60 to-slate-900' :
        title === GameType.MINES ? 'from-rose-900/60 to-slate-900' :
        'from-purple-900/60 to-slate-900'
      } opacity-40 transition-all duration-500 group-hover:opacity-70`}></div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
        <div className="mb-8 transform transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl group-hover:rotate-3">
          <GameIcon type={title} />
        </div>
        
        <div className="text-center relative z-20 w-full">
          <h3 className="text-2xl font-black mb-2 text-white tracking-tight group-hover:text-gold-400 transition-colors uppercase drop-shadow-md">{title}</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mx-auto opacity-80 group-hover:opacity-100 transition-opacity">{description}</p>
        </div>
      </div>

      {/* Player Count Badge - ONLY SHOW IF PLAYERS > 0 */}
      {players > 0 && (
        <div className="absolute top-4 right-4 z-20 bg-slate-950/60 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700/50 flex items-center gap-2 shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-slate-300 font-semibold">{players}</span>
        </div>
      )}
      
      {/* Shine Effect */}
      <div className="absolute -top-full -left-full w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent transform group-hover:translate-x-[200%] group-hover:translate-y-[200%] transition-transform duration-1000 pointer-events-none"></div>
    </div>
  );
};
