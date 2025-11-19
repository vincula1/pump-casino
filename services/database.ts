
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
        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

      // 2. If Supabase works and we found a user
      if (data && !error) {
        // Sync local backup just in case
        this.localBackup.updateUserBalance(walletAddress, Number(data.balance));
        return { username: data.wallet_address, balance: Number(data.balance) };
      }
      
      // 3. If user not found in Supabase, try to create
      if (!data && !error) {
         console.log("Creating new user in Supabase...");
         const { data: newUser, error: createError } = await this.supabase
          .from('users')
          .insert([{ wallet_address: walletAddress, balance: INITIAL_BALANCE }])
          .select()
          .single();
         
         if (!createError && newUser) {
             return { username: newUser.wallet_address, balance: Number(newUser.balance) };
         }
         // If create failed (e.g. RLS policy), fall through to backup
         console.warn("Supabase create failed, falling back to local");
      }

      // 4. If we had an error or create failed, check Local Storage
      console.warn("Supabase Read Error or Missing, checking Local Backup...");
      return this.localBackup.getUser(walletAddress);

    } catch (err) {
      console.error("Supabase Critical Error (getUser), using Local:", err);
      return this.localBackup.getUser(walletAddress);
    }
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    // ALWAYS update local backup first to ensure UI feels responsive and data is safe locally
    await this.localBackup.updateUserBalance(walletAddress, newBalance);

    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        console.warn("Supabase Write Failed (RLS/Network). Data saved to Local Storage only.", error.message);
        // We still return the success object because we saved it locally
        return { username: walletAddress, balance: newBalance };
      }

      return { username: data.wallet_address, balance: Number(data.balance) };
    } catch (err) {
       console.warn("Supabase Exception (updateUserBalance). Data saved to Local Storage only.", err);
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
    console.log("🟢 Initializing Supabase Hybrid Adapter...");
    databaseInstance = new SupabaseAdapter(envUrl as string, envKey as string);
    isLive = true;
  } catch (e) {
    console.error("🔴 Supabase Initialization Failed:", e);
    databaseInstance = new LocalAdapter();
    isLive = false;
  }
} else {
  console.warn("🟡 Supabase keys missing or invalid. Defaulting to Local Simulation.");
  databaseInstance = new LocalAdapter();
  isLive = false;
}

export const db = databaseInstance;
