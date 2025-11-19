
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';

const NAMES = ["Satoshi", "Whale_01", "LuckyStrike", "AceHigh", "Baron", "CryptoKing", "MoonLander", "DiamondHands", "HODLer", "BagHolder", "WAGMI_Boy", "PumpIt", "RocketMan", "AlphaWolf", "BetaTester", "GammaRay", "DeltaForce", "OmegaZero", "ZenMaster", "KarmaChameleon"];

interface LeaderboardProps {
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ compact = false }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Generate 50 entries
    const initialData = Array.from({ length: 50 }, (_, i) => ({
      username: NAMES[i % NAMES.length] + (i > 19 ? `_${i}` : ''),
      winnings: Math.floor(Math.random() * 50000) + 1000 + (50 - i) * 2000,
      rank: i + 1
    }));
    
    setData(initialData.sort((a, b) => b.winnings - a.winnings).map((p, i) => ({...p, rank: i + 1})));

    const interval = setInterval(() => {
      setData(current => {
        const newData = [...current];
        // Update a few random players
        for(let i=0; i<3; i++) {
             const randomIndex = Math.floor(Math.random() * newData.length);
             newData[randomIndex].winnings += Math.floor(Math.random() * 5000);
        }
        return newData
          .sort((a, b) => b.winnings - a.winnings)
          .map((p, i) => ({ ...p, rank: i + 1 }));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col ${compact ? 'h-full' : 'h-[600px]'}`}>
      <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
              <span className="text-gold-500">🏆</span>
              <h2 className="text-lg font-bold text-white tracking-wide">Top 50 Earners</h2>
          </div>
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Live</span>
      </div>
      
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent flex-1 p-2">
        <div className="space-y-1">
            {data.map((entry) => (
            <div 
                key={entry.username}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black shadow-lg ${
                    entry.rank === 1 ? 'bg-gradient-to-br from-gold-400 to-yellow-600 text-black ring-2 ring-gold-500/50' : 
                    entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black ring-2 ring-slate-400/50' : 
                    entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white ring-2 ring-orange-500/50' : 
                    'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                    {entry.rank}
                </div>
                <span className={`font-medium text-sm group-hover:text-white transition-colors ${entry.rank <= 3 ? 'text-white' : 'text-slate-400'}`}>
                    {entry.username}
                </span>
                </div>
                <span className={`font-mono text-sm font-bold ${entry.rank <= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                ${entry.winnings.toLocaleString()}
                </span>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};
