
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseProvider {
  getUser(walletAddress: string): Promise<User>;
  updateUserBalance(walletAddress: string, newBalance: number): Promise<User>;
}

// --- LOCAL SIMULATION ADAPTER ---
class LocalAdapter implements DatabaseProvider {
  private latency = 400; 

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
      balance: INITIAL_BALANCE
    };
    localStorage.setItem(key, JSON.stringify(newUser));
    return newUser;
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    const key = `pump_casino_user_${walletAddress}`;
    const user: User = {
      username: walletAddress,
      balance: newBalance
    };
    localStorage.setItem(key, JSON.stringify(user));
    return user;
  }
}

// --- REAL SUPABASE ADAPTER ---
class SupabaseAdapter implements DatabaseProvider {
  private supabase: SupabaseClient;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async getUser(walletAddress: string): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error || !data) {
        // User doesn't exist, create them
        console.log("Creating new user in Supabase...");
        const { data: newUser, error: createError } = await this.supabase
          .from('users')
          .insert([{ wallet_address: walletAddress, balance: INITIAL_BALANCE }])
          .select()
          .single();
        
        if (createError) {
          console.error("Error creating user:", createError);
          // Fallback to local logic if DB write fails
          return { username: walletAddress, balance: INITIAL_BALANCE };
        }
        
        return { username: newUser.wallet_address, balance: Number(newUser.balance) };
      }

      return { username: data.wallet_address, balance: Number(data.balance) };
    } catch (err) {
      console.error("Supabase Error (getUser):", err);
      return { username: walletAddress, balance: INITIAL_BALANCE };
    }
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        console.error("Error updating balance:", error);
        throw error;
      }

      return { username: data.wallet_address, balance: Number(data.balance) };
    } catch (err) {
       console.error("Supabase Error (updateUserBalance):", err);
       // Fail gracefully
       return { username: walletAddress, balance: newBalance };
    }
  }
}

// --- FACTORY ---
// Access injected variables from vite.config.ts
const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY;

let databaseInstance: DatabaseProvider;
export let isLive = false;

// Strict validation to prevent crashing createClient
const isValidUrl = (url: string | undefined) => url && url.startsWith('http');
const isValidKey = (key: string | undefined) => key && key.length > 20;

if (isValidUrl(envUrl) && isValidKey(envKey)) {
  try {
    console.log("🟢 Initializing Supabase Connection...");
    databaseInstance = new SupabaseAdapter(envUrl as string, envKey as string);
    isLive = true;
  } catch (e) {
    console.error("🔴 Supabase Initialization Failed:", e);
    databaseInstance = new LocalAdapter();
    isLive = false;
  }
} else {
  console.warn("🟡 Supabase keys missing or invalid. Defaulting to Local Simulation.");
  console.log("Debug Info:", { hasUrl: !!envUrl, hasKey: !!envKey });
  databaseInstance = new LocalAdapter();
  isLive = false;
}

export const db = databaseInstance;
