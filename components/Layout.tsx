import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Chat } from './Chat';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigateHome }) => {
  const [totalPlayers, setTotalPlayers] = useState(28452);

  useEffect(() => {
    // More organic fluctuation for "legit" feel
    const interval = setInterval(() => {
        setTotalPlayers(prev => {
          const change = Math.floor(Math.random() * 15) - 4; // Bias slightly upwards or steady
          return prev + change;
        });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Helper to truncate wallet address
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-6 shadow-md shrink-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onNavigateHome}>
          <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <span className="font-bold text-black text-xl">P</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-wide text-white leading-none">
                PUMP <span className="text-gold-500 font-light">CASINO</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
               </span>
               <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                  {totalPlayers.toLocaleString()} Online
               </span>
            </div>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-inner">
               <span className="text-gold-500 animate-pulse">●</span>
               <span className="font-mono font-medium text-gold-400 text-lg tracking-tight">${user.balance.toLocaleString()}</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                 <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Wallet</div>
                 <div className="font-medium text-white text-sm font-mono text-emerald-400">{formatAddress(user.username)}</div>
               </div>
               <Button variant="secondary" onClick={onLogout} className="py-1.5 px-4 text-sm hover:bg-slate-800">Disconnect</Button>
             </div>
          </div>
        ) : (
          <div className="text-slate-400 font-medium">Guest Mode</div>
        )}
      </header>

      {/* Main Content Area & Chat Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Game / Lobby Area */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
           {/* Background decorations */}
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none fixed"></div>
           <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
             {children}
           </div>
        </main>

        {/* Right Side Chat Column */}
        {user && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 shadow-2xl z-20">
            <Chat />
          </aside>
        )}
      </div>
    </div>
  );
};