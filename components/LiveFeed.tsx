
import React, { useEffect, useState } from 'react';
import { GameEvent } from '../types';

interface LiveFeedProps {
  events: GameEvent[];
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ events }) => {
  const [displayEvents, setDisplayEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    // When new events come in, prepend them
    // We only keep the last 5 to avoid clutter
    if (events.length > 0) {
        const latest = events[events.length - 1];
        setDisplayEvents(prev => [latest, ...prev].slice(0, 5));
    }
  }, [events]);

  // Auto-remove events after 5 seconds to keep feed fresh
  useEffect(() => {
    const interval = setInterval(() => {
        setDisplayEvents(prev => {
            const now = Date.now();
            return prev.filter(e => now - e.timestamp < 5000);
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (displayEvents.length === 0) return null;

  return (
    <div className="fixed top-24 left-4 z-40 flex flex-col gap-2 pointer-events-none w-64">
      {displayEvents.map((event) => (
        <div 
            key={event.id}
            className={`
                relative overflow-hidden rounded-lg border backdrop-blur-md px-4 py-3 shadow-lg transition-all duration-500 animate-slide-up
                ${event.isWin 
                    ? event.multiplier && event.multiplier >= 10 
                        ? 'bg-gold-500/20 border-gold-500/50' 
                        : 'bg-emerald-900/60 border-emerald-500/30' 
                    : 'bg-slate-900/60 border-slate-700/50'
                }
            `}
        >
            {/* Flash effect for big wins */}
            {event.isWin && event.multiplier && event.multiplier >= 10 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            )}

            <div className="flex items-center gap-3 relative z-10">
                {/* Game Icon Placeholder - simplified */}
                <div className={`w-8 h-8 rounded flex items-center justify-center text-lg ${event.isWin ? 'bg-white/10' : 'bg-black/20'}`}>
                    {event.game === 'Roulette' ? '🎡' : 
                     event.game === 'Slots' ? '🎰' : 
                     event.game === 'Dice' ? '🎲' : 
                     event.game === 'Blackjack' ? '🃏' : 
                     event.game === 'Crash' ? '🚀' : '💣'}
                </div>
                
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 truncate max-w-[80px]">
                            {event.username.slice(0,4)}...{event.username.slice(-4)}
                        </span>
                        {event.isWin && (
                            <span className="text-[10px] font-bold bg-emerald-500 text-emerald-950 px-1.5 rounded">
                                WIN
                            </span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className={`font-mono font-bold ${event.isWin ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {event.isWin ? '+' : '-'}${Math.abs(event.payout).toLocaleString()}
                        </span>
                        {event.multiplier && event.isWin && (
                             <span className="text-[10px] text-gold-400 font-bold">
                                {event.multiplier.toFixed(2)}x
                             </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};
