
export enum GameType {
  BLACKJACK = 'Blackjack',
  DICE = 'Dice',
  SLOTS = 'Slots',
  ROULETTE = 'Roulette',
  CRASH = 'Crash',
  MINES = 'Mines',
}

export interface User {
  username: string;
  balance: number;
}

export interface LeaderboardEntry {
  username: string;
  winnings: number;
  rank: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  avatar?: string;
  isBot?: boolean;
  isSystem?: boolean;
}

export enum CardSuit {
  HEARTS = '♥',
  DIAMONDS = '♦',
  CLUBS = '♣',
  SPADES = '♠',
}

export interface Card {
  suit: CardSuit;
  value: string;
  numericValue: number;
}
