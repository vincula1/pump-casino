
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, User } from '../types';
import { storageService } from '../services/storageService';

const NAMES = ["Satoshi", "Whale_01", "LuckyStrike", "AceHigh", "Baron", "CryptoKing", "MoonLander", "DiamondHands", "HODLer", "BagHolder", "WAGMI_Boy", "PumpIt", "RocketMan", "AlphaWolf", "BetaTester", "GammaRay", "DeltaForce", "OmegaZero", "ZenMaster", "KarmaChameleon"];

interface LeaderboardProps {
  compact?: boolean;
  currentUser?: User | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ compact = false, currentUser }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [bots, setBots] = useState<LeaderboardEntry[]>([]);

  // Initial Load
  useEffect(() => {
    // Try to load persisted leaderboard from storage
    const storedBots = storageService.getLeaderboard();

    if (storedBots && storedBots.length > 0) {
        setBots(storedBots);
    } else {
        // Generate fresh bots if no history exists
        const initialBots = Array.from({ length: 20 }, (_, i) => ({
            username: NAMES[i % NAMES.length] + (i > 19 ? `_${i}` : ''),
            winnings: Math.floor(Math.random() * 50000) + 10000 + (20 - i) * 3000,
            rank: 0
        }));
        setBots(initialBots);
        storageService.saveLeaderboard(initialBots);
    }
  }, []);

  // Update rankings and simulate bot activity
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

    // Simulate movement of OTHER players to feel "real" but keep them persistent
    const interval = setInterval(() => {
      setBots(currentBots => {
        const newBots = [...currentBots];
        // Update a few random bots
        for(let i=0; i<3; i++) {
             const randomIndex = Math.floor(Math.random() * newBots.length);
             // Bots can win or lose, but generally trend upwards to be competitive
             const change = Math.floor(Math.random() * 4000) - 1000;
             newBots[randomIndex].winnings = Math.max(0, newBots[randomIndex].winnings + change);
        }
        // Save the updated bot state so it persists across reloads
        storageService.saveLeaderboard(newBots);
        return newBots;
      });
    }, 5000);

    return () => clearInterval(interval);
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
            Real-time
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
