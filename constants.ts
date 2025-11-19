
import { GameType } from './types';

export const INITIAL_BALANCE = 1000;
export const APP_NAME = "PUMP CASINO";

export const GAME_CONFIGS = {
  [GameType.BLACKJACK]: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-900',
    description: 'Classic strategy. Beat the dealer to 21.',
    image: '' 
  },
  [GameType.DICE]: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-900',
    description: 'Set your odds. Pure probability.',
    image: ''
  },
  [GameType.SLOTS]: {
    color: 'text-gold-500',
    bgColor: 'bg-yellow-900',
    description: 'Spin for the jackpot. Match symbols.',
    image: ''
  },
  [GameType.ROULETTE]: {
    color: 'text-red-500',
    bgColor: 'bg-red-900',
    description: 'Predict the wheel. High stakes.',
    image: ''
  },
  [GameType.CRASH]: {
    color: 'text-purple-500',
    bgColor: 'bg-purple-900',
    description: 'Ride the multiplier. Timing is key.',
    image: ''
  },
  [GameType.MINES]: {
    color: 'text-rose-500',
    bgColor: 'bg-rose-900',
    description: 'Uncover gems, avoid bombs. Push your luck.',
    image: ''
  }
};

export const SYMBOLS = ['🍒', '🍋', '🍊', '💎', '7️⃣', '🎰'];
