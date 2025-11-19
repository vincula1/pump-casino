
import React from 'react';
import { User } from '../types';
import { Chat } from './Chat';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';
import { isLive } from '../services/database';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigateHome: () => void;
  onlineCount: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigateHome, onlineCount }) => {

  // Helper to truncate wallet address
  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Navbar */}
      <header className="h-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-6 shadow-md shrink-0">
        <div className="cursor-pointer group" onClick={onNavigateHome}>
           <Logo />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 opacity-70">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-400 font-mono tracking-widest uppercase font-bold">
                {onlineCount.toLocaleString()} Online
            </span>
        </div>

        {user ? (
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 shadow-inner hover:bg-slate-750 transition-colors">
               <span className="text-gold-500 text-xs">BALANCE</span>
               <span className="font-mono font-bold text-gold-400 text-lg tracking-tight">${user.balance.toLocaleString()}</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-3 text-right hidden sm:flex">
                 {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User" className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-600" />
                 ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600"></div>
                 )}
                 <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Wallet</div>
                    <div className="font-medium text-white text-sm font-mono text-emerald-400">{formatAddress(user.username)}</div>
                 </div>
               </div>
               <Button variant="secondary" onClick={onLogout} className="py-2 px-4 text-sm hover:bg-slate-800">Disconnect</Button>
             </div>
          </div>
        ) : (
          <div className="text-slate-400 font-medium">Guest Mode</div>
        )}
      </header>

      {/* Main Content Area & Chat Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Game / Lobby Area */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent flex flex-col">
           {/* Background decorations */}
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none fixed"></div>
           
           <div className="p-6 md:p-8 max-w-[1600px] mx-auto flex-1 w-full">
             {children}
           </div>

           {/* Footer Status */}
           <div className="py-4 px-8 text-center md:text-left border-t border-slate-800/50 mt-auto bg-slate-950/50 backdrop-blur flex justify-between items-center">
              <div className="text-xs text-slate-500">© {currentYear} Pump Casino. All rights reserved.</div>
              <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-yellow-500 shadow-[0_0_5px_#eab308]'}`}></span>
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLive ? 'text-emerald-500' : 'text-yellow-500'}`}>
                      {isLive ? 'System: Online' : 'System: Offline Mode'}
                  </span>
              </div>
           </div>
        </main>

        {/* Right Side Chat Column */}
        {user && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 shadow-2xl z-20">
            <Chat userAvatar={user.avatarUrl} />
          </aside>
        )}
      </div>
    </div>
  );
};
