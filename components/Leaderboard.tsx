
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, User } from '../types';

const NAMES = ["Satoshi", "Whale_01", "LuckyStrike", "AceHigh", "Baron", "CryptoKing", "MoonLander", "DiamondHands", "HODLer", "BagHolder", "WAGMI_Boy", "PumpIt", "RocketMan", "AlphaWolf", "BetaTester", "GammaRay", "DeltaForce", "OmegaZero", "ZenMaster", "KarmaChameleon"];

interface LeaderboardProps {
  compact?: boolean;
  currentUser?: User | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ compact = false, currentUser }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  
  // We maintain a static set of bots so they don't completely regenerate on every render
  // allowing the user to climb past them.
  const [bots, setBots] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Generate initial bots only once
    const initialBots = Array.from({ length: 50 }, (_, i) => ({
      username: NAMES[i % NAMES.length] + (i > 19 ? `_${i}` : ''),
      winnings: Math.floor(Math.random() * 50000) + 1000 + (50 - i) * 2000,
      rank: 0
    }));
    setBots(initialBots);
  }, []);

  useEffect(() => {
    if (bots.length === 0) return;

    const updateRanking = () => {
        let allEntries = [...bots];
        
        // Insert current user if they exist
        if (currentUser) {
            // Helper to format wallet
            const formatName = (name: string) => name.length > 10 ? `${name.slice(0, 4)}...${name.slice(-4)}` : name;
            
            const userEntry: LeaderboardEntry = {
                username: formatName(currentUser.username) + " (YOU)",
                winnings: currentUser.balance,
                rank: 0
            };
            allEntries.push(userEntry);
        }

        // Sort by balance
        const sorted = allEntries
            .sort((a, b) => b.winnings - a.winnings)
            .slice(0, 50)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));
            
        setData(sorted);
    };

    updateRanking();

    // Simulate movement of OTHER players
    const interval = setInterval(() => {
      setBots(currentBots => {
        const newBots = [...currentBots];
        // Update a few random bots
        for(let i=0; i<3; i++) {
             const randomIndex = Math.floor(Math.random() * newBots.length);
             // Bots mostly win, sometimes lose
             newBots[randomIndex].winnings += Math.floor(Math.random() * 2000) - 500; 
        }
        return newBots;
      });
    }, 3000);

    // Re-run ranking when bots change OR when user balance changes
  }, [bots, currentUser]); 

  return (
    <div className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col ${compact ? 'h-full' : 'h-[600px]'}`}>
      <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
              <span className="text-gold-500">🏆</span>
              <h2 className="text-lg font-bold text-white tracking-wide">Live Leaderboard</h2>
          </div>
          <span className="text-xs text-emerald-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Active
          </span>
      </div>
      
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent flex-1 p-2">
        <div className="space-y-1">
            {data.map((entry) => {
              const isUser = entry.username.includes("(YOU)");
              return (
                <div 
                    key={entry.username}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all group ${
                        isUser ? 'bg-emerald-900/30 border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' : 'hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black shadow-lg ${
                        entry.rank === 1 ? 'bg-gradient-to-br from-gold-400 to-yellow-600 text-black ring-2 ring-gold-500/50' : 
                        entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black ring-2 ring-slate-400/50' : 
                        entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-500/50' : 
                        isUser ? 'bg-emerald-500 text-emerald-950' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                        {entry.rank}
                    </div>
                    <span className={`font-medium text-sm transition-colors ${
                        isUser ? 'text-emerald-400 font-bold' : 
                        entry.rank <= 3 ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                    }`}>
                        {entry.username}
                    </span>
                    </div>
                    <span className={`font-mono text-sm font-bold ${
                        isUser ? 'text-emerald-400' : 
                        entry.rank <= 3 ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                    ${entry.winnings.toLocaleString()}
                    </span>
                </div>
            )})}
        </div>
      </div>
    </div>
  );
};
