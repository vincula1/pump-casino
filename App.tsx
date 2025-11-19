
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { GameCard } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Leaderboard } from './components/Leaderboard';
import { Blackjack } from './games/Blackjack';
import { Dice } from './games/Dice';
import { Slots } from './games/Slots';
import { Roulette } from './games/Roulette';
import { Crash } from './games/Crash';
import { Mines } from './games/Mines';
import { User, GameType } from './types';
import { INITIAL_BALANCE, GAME_CONFIGS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentGame, setCurrentGame] = useState<GameType | null>(null);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize Legit Member Counts
  useEffect(() => {
    // Set initial plausible numbers
    const initialCounts: Record<string, number> = {};
    Object.keys(GAME_CONFIGS).forEach(key => {
      // Random base number between 120 and 900
      initialCounts[key] = Math.floor(Math.random() * 800) + 120;
    });
    setPlayerCounts(initialCounts);

    // Simulate live fluctuation
    const interval = setInterval(() => {
      setPlayerCounts(prev => {
        const next = { ...prev };
        const keys = Object.keys(next);
        // Pick 2 random games to update
        for(let i=0; i<2; i++) {
            const key = keys[Math.floor(Math.random() * keys.length)];
            const change = Math.floor(Math.random() * 11) - 5; // -5 to +5 change
            next[key] = Math.max(50, next[key] + change); // Don't drop below 50
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const { solana } = window as any;

      if (solana && solana.isPhantom) {
        const response = await solana.connect();
        const publicKey = response.publicKey.toString();
        setUser({ username: publicKey, balance: INITIAL_BALANCE });
      } else {
        alert("Phantom Wallet not found! Please install the Phantom extension.");
        window.open("https://phantom.app/", "_blank");
      }
    } catch (err) {
      console.error("Connection rejected", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    // Disconnect logic if needed, for now just clear state
    const { solana } = window as any;
    if (solana) {
        solana.disconnect(); 
    }
    setUser(null);
    setCurrentGame(null);
  };

  const updateBalance = (amount: number) => {
    if (user) {
      setUser(prev => prev ? ({ ...prev, balance: prev.balance + amount }) : null);
    }
  };

  // Render Current Game
  const renderGame = () => {
    switch (currentGame) {
      case GameType.BLACKJACK: return <Blackjack onEndGame={updateBalance} balance={user!.balance} />;
      case GameType.DICE: return <Dice onEndGame={updateBalance} balance={user!.balance} />;
      case GameType.SLOTS: return <Slots onEndGame={updateBalance} balance={user!.balance} />;
      case GameType.ROULETTE: return <Roulette onEndGame={updateBalance} balance={user!.balance} />;
      case GameType.CRASH: return <Crash onEndGame={updateBalance} balance={user!.balance} />;
      case GameType.MINES: return <Mines onEndGame={updateBalance} balance={user!.balance} />;
      default: return null;
    }
  };

  // Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-950 to-slate-950 opacity-80"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 w-full max-w-md p-10 bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 ring-1 ring-white/10 flex flex-col items-center">
          
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-8 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)] animate-pulse">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-white" xmlns="http://www.w3.org/2000/svg">
               <path d="M19.06 3.59L21.46 5.99L15.46 11.99L19.06 15.59L21.46 13.19V19.19H15.46L13.06 16.79L16.66 13.19L13.06 9.59L10.66 11.99L16.66 17.99H10.66V23.99H4.66V17.99H10.66V11.99L4.66 5.99L7.06 3.59L13.06 9.59L19.06 3.59Z" fill="white"/> 
            </svg>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">PUMP CASINO</h1>
            <p className="text-slate-400 font-medium">Connect your wallet to play</p>
          </div>
          
          <button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full group relative overflow-hidden rounded-xl bg-[#AB9FF2] hover:bg-[#9f91ef] transition-all duration-200 p-4 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(171,159,242,0.3)] hover:shadow-[0_0_30px_rgba(171,159,242,0.5)] hover:-translate-y-1 active:translate-y-0"
          >
             {isConnecting ? (
                <span className="text-indigo-900 font-bold">Connecting...</span>
             ) : (
               <>
                 {/* Simple Phantom Icon SVG Representation */}
                 <svg className="w-6 h-6" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M107.6 29.6C96.2 17.6 80.6 11 64 11C38.2 11 16.4 27.8 9.6 51.4L1.8 78.4C-1.4 89.4 7.2 100 18.6 100H109.4C119.2 100 126.8 91.6 126.2 81.8L123.8 47.2C123.2 40.4 117.4 35.2 110.8 34.8H107.6V29.6Z" fill="#4B4699"/>
                   <path d="M107.6 29.6C96.2 17.6 80.6 11 64 11C38.2 11 16.4 27.8 9.6 51.4L1.8 78.4C-1.4 89.4 7.2 100 18.6 100H109.4C119.2 100 126.8 91.6 126.2 81.8L123.8 47.2C123.2 40.4 117.4 35.2 110.8 34.8H107.6V29.6Z" fill="url(#paint0_linear)"/>
                   <path d="M37 67C37 70.866 33.866 74 30 74C26.134 74 23 70.866 23 67C23 63.134 26.134 60 30 60C33.866 60 37 63.134 37 67Z" fill="white"/>
                   <path d="M74 67C74 70.866 70.866 74 67 74C63.134 74 60 70.866 60 67C60 63.134 63.134 60 67 60C70.866 60 74 63.134 74 67Z" fill="white"/>
                   <defs>
                     <linearGradient id="paint0_linear" x1="64" y1="11" x2="64" y2="100" gradientUnits="userSpaceOnUse">
                       <stop stopColor="#5F4DCD"/>
                       <stop offset="1" stopColor="#9B8AF9"/>
                     </linearGradient>
                   </defs>
                 </svg>
                 <span className="text-white font-bold text-lg tracking-wide">Connect Phantom</span>
               </>
             )}
          </button>
          
          <div className="mt-8 text-center text-xs text-slate-500 font-medium">
             Secure connection via Solana Blockchain
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} onNavigateHome={() => setCurrentGame(null)}>
      {currentGame ? (
        <div className="animate-fade-in">
          <div className="flex items-center mb-8 border-b border-slate-800 pb-6">
             <button 
               onClick={() => setCurrentGame(null)}
               className="flex items-center text-slate-400 hover:text-white mr-6 transition-all group bg-slate-900 px-4 py-2 rounded-full border border-slate-800 hover:border-slate-600"
             >
               <span className="mr-2 group-hover:-translate-x-1 transition-transform text-xl">←</span> 
               <span className="font-bold text-sm uppercase tracking-wide">Lobby</span>
             </button>
             <div>
                <h2 className={`text-3xl font-black tracking-tight ${GAME_CONFIGS[currentGame].color} drop-shadow-lg`}>
                {currentGame.toUpperCase()}
                </h2>
                <p className="text-slate-500 text-sm font-medium">{GAME_CONFIGS[currentGame].description}</p>
             </div>
          </div>
          {renderGame()}
        </div>
      ) : (
        <div className="animate-fade-in pb-12">
          {/* Hero Section */}
          <div className="mb-16 text-center py-16 md:py-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-5 scale-110 group-hover:scale-100 transition-transform duration-[20s]"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
            
            <div className="relative z-10 px-6">
                <span className="inline-block py-1 px-3 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-bold uppercase tracking-widest mb-6">
                    Provably Fair Gaming
                </span>
                <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
                FORTUNE FAVORS <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-yellow-600">THE BOLD</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                Experience the thrill of next-generation crypto gaming. Real-time payouts, instant withdrawals, and AI-powered hype.
                </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Games Grid */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-1.5 h-8 bg-gold-500 rounded-full"></div>
                 <h3 className="text-2xl font-bold text-white tracking-tight">Featured Games</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(Object.keys(GAME_CONFIGS) as GameType[]).map((type) => (
                    <GameCard 
                    key={type}
                    title={type}
                    description={GAME_CONFIGS[type].description}
                    color={GAME_CONFIGS[type].color}
                    players={playerCounts[type] || 0} 
                    onClick={() => setCurrentGame(type)}
                    />
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 shrink-0">
              <div className="sticky top-6">
                 <Leaderboard />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
