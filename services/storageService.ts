
import { User, LeaderboardEntry } from '../types';
import { INITIAL_BALANCE } from '../constants';

const STORAGE_PREFIX = 'pump_casino_';
const USER_KEY = `${STORAGE_PREFIX}user`;
const LEADERBOARD_KEY = `${STORAGE_PREFIX}leaderboard`;

export const storageService = {
  // Get the currently stored user
  getUser: (): User | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load user from storage", e);
      return null;
    }
  },

  // Save or Update user
  saveUser: (user: User) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save user", e);
    }
  },

  // Specific balance update helper
  updateBalance: (newBalance: number) => {
    const user = storageService.getUser();
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      storageService.saveUser(updatedUser);
      return updatedUser;
    }
    return null;
  },

  // Clear session (logout)
  clearSession: () => {
    localStorage.removeItem(USER_KEY);
  },
  
  // Look up a specific wallet address to see if they played before
  loadUserByWallet: (walletAddress: string): User => {
    const currentStored = storageService.getUser();
    
    // If the stored user matches the wallet connecting, return them (restores balance)
    if (currentStored && currentStored.username === walletAddress) {
      return currentStored;
    }

    // Otherwise, return a fresh user object (New Account)
    return {
      username: walletAddress,
      balance: INITIAL_BALANCE
    };
  },

  // --- LEADERBOARD PERSISTENCE ---
  
  getLeaderboard: (): LeaderboardEntry[] | null => {
    try {
        const stored = localStorage.getItem(LEADERBOARD_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
  },

  saveLeaderboard: (data: LeaderboardEntry[]) => {
      try {
          localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
      } catch (e) {
          console.error("Failed to save leaderboard", e);
      }
  }
};
