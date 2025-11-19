
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { GameCard } from './components/ui/Card';
import { Leaderboard } from './components/Leaderboard';
import { Blackjack } from './games/Blackjack';
import { Dice } from './games/Dice';
import { Slots } from './games/Slots';
import { Roulette } from './games/Roulette';
import { Crash } from './games/Crash';
import { Mines } from './games/Mines';
import { User, GameType } from './types';
import { GAME_CONFIGS } from './constants';
import { db } from './services/database'; 

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentGame, setCurrentGame] = useState<GameType | null>(null);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [totalOnline, setTotalOnline] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [phantomAvailable, setPhantomAvailable] = useState(false);

  // Initialize Member Counts (Deterministic Simulation)
  useEffect(() => {
    const updateCounts = () => {
        const now = Date.now();
        const hour = new Date().getUTCHours();
        
        // Base online count follows a sine wave peaking at 20:00 UTC
        const timeFactor = Math.sin((hour - 8) / 24 * 2 * Math.PI); 
        const baseUsers = 2500 + (1500 * timeFactor); 
        
        // Shared fluctuation derived from the current 10-second window
        const timeBlock = Math.floor(now / 10000);
        const fluctuation = (timeBlock * 9301 + 49297) % 200 - 100;
        
        const currentTotal = Math.floor(baseUsers + fluctuation);
        setTotalOnline(currentTotal);

        // Deterministic distribution
        const seed = timeBlock;
        const random = (offset: number) => {
             const x = Math.sin(seed + offset) * 10000;
             return x - Math.floor(x);
        };

        const distribution = {
            [GameType.BLACKJACK]: 0.25 + (random(1) * 0.05),
            [GameType.SLOTS]: 0.20 + (random(2) * 0.05),
            [GameType.CRASH]: 0.15 + (random(3) * 0.05),
            [GameType.ROULETTE]: 0.15 + (random(4) * 0.05),
            [GameType.MINES]: 0.15 + (random(5) * 0.05),
            [GameType.DICE]: 0.10 + (random(6) * 0.05)
        };

        // Normalize distribution
        const totalDist = Object.values(distribution).reduce((a, b) => a + b, 0);
        
        const newCounts: Record<string, number> = {};
        Object.keys(GAME_CONFIGS).forEach(key => {
            const percent = distribution[key as GameType] / totalDist;
            newCounts[key] = Math.floor(currentTotal * percent);
        });
        setPlayerCounts(newCounts);
    };

    updateCounts();
    const interval = setInterval(updateCounts, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

  // Check for Phantom availability
  useEffect(() => {
    const checkPhantom = () => {
      const provider = getPhantomProvider();
      if (provider) setPhantomAvailable(true);
    };

    checkPhantom();
    window.addEventListener('load', checkPhantom);
    return () => window.removeEventListener('load', checkPhantom);
  }, []);

  // Listen for Phantom Account Changes to fix "logging into same one" issue
  useEffect(() => {
      const provider = getPhantomProvider();
      if (provider) {
          const handleAccountChange = (publicKey: any) => {
              if (publicKey) {
                  // User switched accounts in wallet, update app state
                  console.log("Switched account to:", publicKey.toString());
                  connectWallet(); // Re-run connect logic with new key
              } else {
                  // User locked wallet or disconnected in extension
                  handleLogout(); 
              }
          };
          
          // Phantom specific event
          provider.on('accountChanged', handleAccountChange);
          return () => {
              provider.off('accountChanged', handleAccountChange);
          };
      }
  }, [phantomAvailable]); // Re-bind if phantom becomes available

  const getPhantomProvider = () => {
    if ('phantom' in window) {
      const provider = (window as any).phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    
    const { solana } = window as any;
    if (solana?.isPhantom) {
        return solana;
    }

    return null;
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const provider = getPhantomProvider();

      if (provider) {
        try {
          // If already connected, this will just return the current key
          const response = await provider.connect();
          const publicKey = response.publicKey.toString();
          
          // FETCH USER FROM "DATABASE"
          const userAccount = await db.getUser(publicKey);
          setUser(userAccount);

        } catch (connErr) {
          console.warn("User rejected connection request", connErr);
        }
      } else {
        window.open("https://phantom.app/", "_blank");
      }
    } catch (err) {
      console.error("Connection error", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    const provider = getPhantomProvider();
    if (provider) {
        try {
            provider.disconnect(); 
        } catch(e) {
            console.log("Disconnect error", e);
        }
    }
    setUser(null);
    setCurrentGame(null);
  };

  const updateBalance = async (amount: number) => {
    if (user) {
      const newBalance = user.balance + amount;
      // Optimistic UI update
      setUser({ ...user, balance: newBalance });
      
      // Sync with "Database"
      await db.updateUserBalance(user.username, newBalance);
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

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950 text-white"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}
      >
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 ring-1 ring-white/10 flex flex-col items-center mx-4">
          
          {/* NEW REAL LOGO HERE */}
          <div className="mb-12 transform scale-150">
             {/* Reuse the Logo component but slightly larger for login screen */}
             <div className="relative w-24 h-24 shrink-0">
                <div className="absolute inset-0 bg-gold-500/30 rounded-full blur-xl animate-pulse"></div>
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl relative z-10">
                <defs>
                    <linearGradient id="goldGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fcd34d" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                    <linearGradient id="darkMetalLogin" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#darkMetalLogin)" stroke="url(#goldGradientLogin)" strokeWidth="4" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="35" fill="url(#goldGradientLogin)" />
                <circle cx="50" cy="50" r="28" fill="#0f172a" />
                <path d="M40 30 H55 C65 30 70 38 70 48 C70 58 65 66 55 66 H48 V80 H40 V30 Z M48 38 V58 H55 C60 58 62 55 62 48 C62 41 60 38 55 38 H48 Z" fill="url(#goldGradientLogin)" />
                <path d="M35 30 L42 15 L50 22 L58 15 L65 30" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
             </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight font-sans">PUMP CASINO</h1>
            <p className="text-slate-400 font-medium">Connect your wallet to play</p>
          </div>
          
          <button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full group relative overflow-hidden rounded-xl bg-[#551BF9] hover:bg-[#6640f5] transition-all duration-200 p-4 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(85,27,249,0.3)] hover:shadow-[0_0_30px_rgba(85,27,249,0.5)] hover:-translate-y-1 active:translate-y-0"
          >
             {isConnecting ? (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-white font-bold">Connecting DB...</span>
                </div>
             ) : (
               <>
                 <img 
                    src="https://docs.phantom.com/mintlify-assets/_mintlify/favicons/phantom-e50e2e68/iJ-2hg6MaJphnoGv/_generated/favicon/apple-touch-icon.png" 
                    alt="Phantom Wallet" 
                    className="shrink-0 w-8 h-8 rounded-full" 
                 />
                 <span className="text-white font-bold text-lg tracking-wide">
                    Connect Phantom
                 </span>
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
    <Layout user={user} onLogout={handleLogout} onNavigateHome={() => setCurrentGame(null)} onlineCount={totalOnline}>
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

            <div className="lg:w-80 shrink-0">
              <div className="sticky top-6">
                 <Leaderboard currentUser={user} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
