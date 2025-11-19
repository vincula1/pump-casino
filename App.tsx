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
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentGame, setCurrentGame] = useState<GameType | null>(null);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [phantomAvailable, setPhantomAvailable] = useState(false);

  // 1. Load persisted user on mount
  useEffect(() => {
    const storedUser = storageService.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Initialize Member Counts (Simulated Real-time activity)
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    Object.keys(GAME_CONFIGS).forEach(key => {
      initialCounts[key] = Math.floor(Math.random() * 800) + 120;
    });
    setPlayerCounts(initialCounts);

    const interval = setInterval(() => {
      setPlayerCounts(prev => {
        const next = { ...prev };
        const keys = Object.keys(next);
        for(let i=0; i<2; i++) {
            const key = keys[Math.floor(Math.random() * keys.length)];
            const change = Math.floor(Math.random() * 11) - 5;
            next[key] = Math.max(50, next[key] + change);
        }
        return next;
      });
    }, 3000);

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
          const response = await provider.connect();
          const publicKey = response.publicKey.toString();
          
          // Load existing user data if available, or create new
          const userAccount = storageService.loadUserByWallet(publicKey);
          
          // Save immediately
          storageService.saveUser(userAccount);
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
    storageService.clearSession();
    setUser(null);
    setCurrentGame(null);
  };

  const updateBalance = (amount: number) => {
    if (user) {
      const newBalance = user.balance + amount;
      const updatedUser = { ...user, balance: newBalance };
      
      // Update State
      setUser(updatedUser);
      
      // Persist to Storage
      storageService.saveUser(updatedUser);
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
        {/* Background Gradients - Simplified to avoid complexity issues */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="relative z-10 w-full max-w-md p-8 md:p-10 bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 ring-1 ring-white/10 flex flex-col items-center mx-4">
          
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-8 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)] animate-pulse">
            <svg width="48" height="48" viewBox="0 0 24 24" className="w-12 h-12 fill-white" xmlns="http://www.w3.org/2000/svg">
               <path d="M19.06 3.59L21.46 5.99L15.46 11.99L19.06 15.59L21.46 13.19V19.19H15.46L13.06 16.79L16.66 13.19L13.06 9.59L10.66 11.99L16.66 17.99H10.66V23.99H4.66V17.99H10.66V11.99L4.66 5.99L7.06 3.59L13.06 9.59L19.06 3.59Z" fill="white"/> 
            </svg>
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
                <span className="text-white font-bold">Connecting...</span>
             ) : (
               <>
                 <svg width="28" height="24" viewBox="0 0 57 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path fillRule="evenodd" clipRule="evenodd" d="M47.0372 12.9065C42.5103 4.59761 33.7909 0 25.0989 0C10.8416 0 0.00537109 11.9876 0.00537109 27.6969C0.00537109 31.0015 0.502497 34.2262 1.41166 37.2889C2.11904 39.6704 4.66609 41.0272 7.08359 40.5539C9.67111 40.0487 11.3965 37.6059 11.0009 34.9966C10.5862 32.2641 10.1906 29.6979 10.1906 27.4818C10.1906 20.171 15.1053 13.5087 21.9549 11.552C30.2228 9.18673 38.6532 15.3363 38.6532 23.934C38.6532 24.8156 38.5287 25.6541 38.3209 26.4712C37.7808 28.5999 39.0687 30.7931 41.1874 31.4166L50.9919 34.3195C54.6478 35.4157 58.0753 31.7604 56.4757 28.2556L53.8583 22.5015C53.6713 22.093 53.4428 21.6845 53.2143 21.2975C51.5109 18.1796 49.426 15.2502 47.0372 12.9065ZM17.4475 24.02C17.4475 25.7832 18.8602 27.2023 20.6259 27.2023C22.3706 27.2023 23.8043 25.7832 23.8043 24.02C23.8043 22.2568 22.3706 20.8377 20.6259 20.8377C18.8602 20.8377 17.4475 22.2568 17.4475 24.02ZM32.7119 24.02C32.7119 25.7832 34.1246 27.2023 35.8903 27.2023C37.6561 27.2023 39.0897 25.7832 39.0897 24.02C39.0897 22.2568 37.6561 20.8377 35.8903 20.8377C34.1246 20.8377 32.7119 22.2568 32.7119 24.02Z" fill="white"/>
                 </svg>
                 <span className="text-white font-bold text-lg tracking-wide">
                    {phantomAvailable ? "Connect Phantom" : "Install Phantom"}
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
                 {/* Pass the real user to the leaderboard to rank them */}
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