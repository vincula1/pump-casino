
import React, { useState, useEffect, useRef } from 'react';
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
import { db, isLive, supabase } from './services/database'; 
import { Logo } from './components/ui/Logo';

const PhantomIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="64" cy="64" r="64" fill="transparent"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M29.5866 28.582C36.6149 21.6483 47.4381 18.915 58.4661 20.6507C84.7125 24.7802 94.577 48.7762 89.0953 70.6466C85.5001 84.9875 72.7899 96.9808 58.1703 98.1187C47.605 98.9415 37.2477 94.0253 31.6226 85.0523C24.9163 74.3562 24.9163 60.7965 24.9163 49.1911C24.9163 41.3688 26.4314 34.8529 29.5866 28.582ZM45.5625 45.7672C45.5625 48.3517 47.6577 50.4469 50.2422 50.4469C52.8267 50.4469 54.9219 48.3517 54.9219 45.7672C54.9219 43.1827 52.8267 41.0875 50.2422 41.0875C47.6577 41.0875 45.5625 43.1827 45.5625 45.7672ZM72.4746 45.7672C72.4746 48.3517 74.5698 50.4469 77.1543 50.4469C79.7388 50.4469 81.834 48.3517 81.834 45.7672C81.834 43.1827 79.7388 41.0875 77.1543 41.0875C74.5698 41.0875 72.4746 43.1827 72.4746 45.7672Z" fill="white"/>
  </svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentGame, setCurrentGame] = useState<GameType | null>(null);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [totalOnline, setTotalOnline] = useState<number>(1); // Start with 1 (yourself)
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Realtime Presence Logic
  useEffect(() => {
    if (!supabase || !isLive) {
      // If offline, we only know about ourselves
      setTotalOnline(1);
      setPlayerCounts(currentGame ? { [currentGame]: 1 } : {});
      return;
    }

    const channel = supabase.channel('pump_casino_presence', {
      config: {
        presence: {
          key: user ? user.username : `guest-${Math.random().toString(36).substring(7)}`,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      
      let total = 0;
      const counts: Record<string, number> = {};

      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          total++;
          if (p.game) {
            counts[p.game] = (counts[p.game] || 0) + 1;
          }
        });
      });

      setTotalOnline(total);
      setPlayerCounts(counts);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          game: currentGame,
          status: 'online'
        });
      }
    });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, currentGame]);

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

  // Auto-connect logic
  useEffect(() => {
    const wasDisconnected = localStorage.getItem('explicitDisconnect') === 'true';
    if (wasDisconnected) return;

    const checkProvider = setInterval(() => {
        const provider = getPhantomProvider();
        if (provider) {
            // Silent connect only if trusted
            provider.connect({ onlyIfTrusted: true })
                .then(async (response: any) => {
                    if (response.publicKey) {
                        const walletAddr = response.publicKey.toString();
                        const userAccount = await db.getUser(walletAddr);
                        setUser(userAccount);
                    }
                })
                .catch(() => {}); // Silent fail
            clearInterval(checkProvider);
        }
    }, 1000);
    
    // Clean up loop after 5s
    setTimeout(() => clearInterval(checkProvider), 5000);

    return () => clearInterval(checkProvider);
  }, []);

  // Init wallet listeners
  useEffect(() => {
    const provider = getPhantomProvider();
    if (provider) {
        provider.removeAllListeners('accountChanged');
        provider.on('accountChanged', async (publicKey: any) => {
            if (publicKey) {
                localStorage.removeItem('explicitDisconnect'); 
                const userAccount = await db.getUser(publicKey.toString());
                setUser(userAccount);
            } else {
                // Wallet locked or switched
                setUser(null);
            }
        });
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const provider = getPhantomProvider();
      if (provider) {
        try {
          const response = await provider.connect();
          const publicKey = response.publicKey.toString();
          localStorage.removeItem('explicitDisconnect');
          const userAccount = await db.getUser(publicKey);
          setUser(userAccount);
        } catch (connErr) {
          console.warn("User rejected connection request", connErr);
        }
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (err) {
      console.error("Connection error", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    // 1. Flag disconnection to prevent auto-reconnect loop
    localStorage.setItem('explicitDisconnect', 'true');
    
    // 2. Clear local state
    setUser(null);
    setCurrentGame(null);

    // 3. Force deep disconnect from provider
    try {
        const provider = getPhantomProvider();
        if (provider) {
            await provider.disconnect();
            // Give it a moment to process
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (e) {
        console.warn("Provider disconnect error", e);
    }

    // 4. Reload page to ensure clean state for next login
    window.location.reload();
  };

  const updateBalance = async (amount: number) => {
    if (user) {
      const newBalance = user.balance + amount;
      setUser({ ...user, balance: newBalance });
      await db.updateUserBalance(user.username, newBalance);
    }
  };

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
      <div className="fixed inset-0 w-full h-full bg-[#0f172a] flex flex-col items-center justify-center p-6 z-50 font-sans selection:bg-emerald-500/30">
         {/* Background Gradients */}
         <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>
         
         {/* Card */}
         <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
             {/* Logo Area */}
             <div className="mb-10 flex flex-col items-center gap-4">
                 <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <span className="text-5xl drop-shadow-md">🎰</span>
                 </div>
                 <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">PUMP<span className="text-emerald-400">.</span>CASINO</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">Next Gen Crypto Gaming</p>
                 </div>
             </div>

             {/* Connect Button */}
             <button 
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full group relative overflow-hidden rounded-xl bg-[#AB9FF2] hover:bg-[#9d8fee] active:bg-[#8f7fdb] transition-all duration-200 p-[2px] shadow-xl shadow-indigo-900/20"
             >
                <div className="relative h-16 bg-[#512da8] group-hover:bg-[#4527a0] rounded-[10px] flex items-center justify-center gap-3 transition-colors">
                    {isConnecting ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <PhantomIcon />
                    )}
                    <span className="text-white font-bold text-lg tracking-wide">Connect Phantom</span>
                </div>
             </button>

             {/* Footer info */}
             <div className="mt-8 flex flex-col items-center gap-2 text-slate-500 text-xs font-medium">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-slate-600'} animate-pulse`}></span>
                    {isLive ? 'System Online' : 'Local Mode'}
                </div>
                <p className="opacity-60 text-[10px] max-w-[200px]">
                    Tip: To switch wallets, change account in your Phantom extension after disconnecting.
                </p>
             </div>
         </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onNavigateHome={() => setCurrentGame(null)} 
      onlineCount={totalOnline}
    >
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
