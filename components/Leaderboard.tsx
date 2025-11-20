
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, User } from '../types';
import { db, isLive } from '../services/database';

interface LeaderboardProps {
  compact?: boolean;
  currentUser?: User | null;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ compact = false, currentUser }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const formatAddress = (addr: string) => {
      if (addr.length < 10) return addr;
      return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
        try {
            const entries = await db.getLeaderboard();
            
            // If entries are empty and we have a current user, show them at least
            if (entries.length === 0 && currentUser) {
                setData([{
                    username: formatAddress(currentUser.username),
                    winnings: currentUser.balance,
                    rank: 1
                }]);
            } else {
                // Format addresses
                const formatted = entries.map(e => ({
                    ...e,
                    username: formatAddress(e.username)
                }));
                setData(formatted);
            }
        } catch (e) {
            console.error("LB Error", e);
        } finally {
            setLoading(false);
        }
    };

    fetchLeaderboard();
    // Poll every 10 seconds for real updates
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [currentUser]); 

  return (
    <div className={`bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col ${compact ? 'h-full' : 'h-[600px]'}`}>
      <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
              <span className="text-gold-500">🏆</span>
              <h2 className="text-lg font-bold text-white tracking-wide">Top Players</h2>
          </div>
          <span className={`text-xs uppercase font-bold tracking-wider flex items-center gap-1 ${isLive ? 'text-emerald-500' : 'text-slate-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
            {isLive ? 'Live DB' : 'Offline'}
          </span>
      </div>
      
      <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent flex-1 p-2">
        {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm animate-pulse">
                Loading rankings...
            </div>
        ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm p-4 text-center">
                <p>No players found yet.</p>
                <p className="text-xs mt-2">Be the first to play!</p>
            </div>
        ) : (
            <div className="space-y-1">
                {data.map((entry) => {
                const isUser = currentUser && entry.username === formatAddress(currentUser.username);
                return (
                    <div 
                        key={entry.rank + entry.username}
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
                        <span className={`font-medium text-sm font-mono transition-colors ${
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
        )}
      </div>
    </div>
  );
};
