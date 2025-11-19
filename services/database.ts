
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseProvider {
  getUser(walletAddress: string): Promise<User>;
  updateUserBalance(walletAddress: string, newBalance: number): Promise<User>;
}

// --- LOCAL SIMULATION ADAPTER (Fallback) ---
class LocalAdapter implements DatabaseProvider {
  private latency = 200; 

  private async wait() {
    return new Promise(resolve => setTimeout(resolve, this.latency));
  }

  async getUser(walletAddress: string): Promise<User> {
    await this.wait();
    
    const key = `pump_casino_user_${walletAddress}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      return JSON.parse(stored);
    }

    const newUser: User = {
      username: walletAddress,
      balance: INITIAL_BALANCE,
      avatarUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${walletAddress}`
    };
    localStorage.setItem(key, JSON.stringify(newUser));
    return newUser;
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    const key = `pump_casino_user_${walletAddress}`;
    const currentUser = await this.getUser(walletAddress);
    const user: User = {
      ...currentUser,
      balance: newBalance
    };
    localStorage.setItem(key, JSON.stringify(user));
    return user;
  }
}

// --- REAL SUPABASE ADAPTER WITH HYBRID FALLBACK ---
class SupabaseAdapter implements DatabaseProvider {
  private supabase: SupabaseClient;
  private localBackup: LocalAdapter;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
    this.localBackup = new LocalAdapter();
  }

  async getUser(walletAddress: string): Promise<User> {
    try {
      // 1. Try to fetch from Supabase
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      // 2. If Supabase works and we found a user
      if (data && !error) {
        // Sync local backup
        this.localBackup.updateUserBalance(walletAddress, Number(data.balance));
        return { 
            username: data.wallet_address, 
            balance: Number(data.balance),
            avatarUrl: data.avatar_url || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${walletAddress}`
        };
      }
      
      // 3. If user not found in Supabase, try to create
      if (!data && !error) {
         console.log("Creating new user in Supabase...");
         const defaultAvatar = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${walletAddress}`;
         const { data: newUser, error: createError } = await this.supabase
          .from('users')
          .insert([{ 
              wallet_address: walletAddress, 
              balance: INITIAL_BALANCE,
              avatar_url: defaultAvatar
          }])
          .select()
          .single();
         
         if (!createError && newUser) {
             return { 
                 username: newUser.wallet_address, 
                 balance: Number(newUser.balance),
                 avatarUrl: newUser.avatar_url
             };
         }
         console.warn("Supabase create failed, falling back to local");
      }

      // 4. Fallback
      console.warn("Supabase Read Error or Missing, checking Local Backup...");
      return this.localBackup.getUser(walletAddress);

    } catch (err) {
      console.error("Supabase Critical Error (getUser), using Local:", err);
      return this.localBackup.getUser(walletAddress);
    }
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    // ALWAYS update local backup first
    const localUser = await this.localBackup.updateUserBalance(walletAddress, newBalance);

    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        console.warn("Supabase Write Failed. Data saved locally only.", error.message);
        return localUser;
      }

      return { 
          username: data.wallet_address, 
          balance: Number(data.balance),
          avatarUrl: data.avatar_url || localUser.avatarUrl
      };
    } catch (err) {
       console.warn("Supabase Exception. Data saved locally only.", err);
       return localUser;
    }
  }
}

// --- FACTORY ---
// WE USE THE KEYS PROVIDED BY THE USER AS DEFAULTS TO ENSURE IT WORKS
const PROVIDED_URL = "https://wkblzroluuljlsklxyeb.supabase.co";
const PROVIDED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmx6cm9sdXVsamxza2x4eWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxMzgsImV4cCI6MjA3OTE2MjEzOH0.HpPtkq8gGZGH0-WDMyoFMuTEZwU64j397NJNLBmld1A";

// Check process env first, then fall back to the hardcoded keys
const envUrl = process.env.VITE_SUPABASE_URL || PROVIDED_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY || PROVIDED_KEY;

let databaseInstance: DatabaseProvider;
export let isLive = false;

try {
  console.log("🟢 Initializing Database Connection...");
  databaseInstance = new SupabaseAdapter(envUrl, envKey);
  isLive = true;
} catch (e) {
  console.error("🔴 Supabase Initialization Failed:", e);
  databaseInstance = new LocalAdapter();
  isLive = false;
}

export const db = databaseInstance;
