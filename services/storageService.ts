
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';

const STORAGE_PREFIX = 'pump_casino_';
const USER_KEY = `${STORAGE_PREFIX}user`;

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
  // In a real backend, this would be a DB query. 
  // Here we simplify by just checking the current session or creating a fresh state.
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
  }
};
