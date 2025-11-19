
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DatabaseProvider {
  getUser(walletAddress: string): Promise<User>;
  updateUserBalance(walletAddress: string, newBalance: number): Promise<User>;
}

// --- LOCAL SIMULATION ADAPTER (Always works) ---
class LocalAdapter implements DatabaseProvider {
  async getUser(walletAddress: string): Promise<User> {
    const key = `pump_casino_user_${walletAddress}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Local storage access failed", e);
    }

    const newUser: User = {
      username: walletAddress,
      balance: INITIAL_BALANCE,
      avatarUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${walletAddress}`
    };
    
    try {
        localStorage.setItem(key, JSON.stringify(newUser));
    } catch (e) {}
    
    return newUser;
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    const key = `pump_casino_user_${walletAddress}`;
    const currentUser = await this.getUser(walletAddress);
    const user: User = {
      ...currentUser,
      balance: newBalance
    };
    try {
        localStorage.setItem(key, JSON.stringify(user));
    } catch (e) {}
    return user;
  }
}

// --- SUPABASE ADAPTER ---
class SupabaseAdapter implements DatabaseProvider {
  private supabase: SupabaseClient;
  private localBackup: LocalAdapter;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key, {
        auth: { persistSession: false } // Don't persist auth session, we use wallet address
    });
    this.localBackup = new LocalAdapter();
  }

  async getUser(walletAddress: string): Promise<User> {
    try {
      // Attempt to fetch from real DB
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Found user, update local backup just in case
        this.localBackup.updateUserBalance(walletAddress, Number(data.balance));
        return { 
            username: data.wallet_address, 
            balance: Number(data.balance),
            avatarUrl: data.avatar_url || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${walletAddress}`
        };
      }
      
      // User not found, create new
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
        
      if (createError) throw createError;

      return { 
          username: newUser.wallet_address, 
          balance: Number(newUser.balance),
          avatarUrl: newUser.avatar_url
      };

    } catch (err) {
      console.warn("Supabase unavailable, using local fallback:", err);
      // Silent Fallback to Local Storage
      return this.localBackup.getUser(walletAddress);
    }
  }

  async updateUserBalance(walletAddress: string, newBalance: number): Promise<User> {
    // Optimistic: Update local first so UI is instant
    const localResult = await this.localBackup.updateUserBalance(walletAddress, newBalance);

    try {
      // Background: Try to sync to Supabase
      await this.supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('wallet_address', walletAddress);
    } catch (err) {
        console.warn("Failed to sync balance to Supabase", err);
    }

    return localResult;
  }
}

// --- INIT LOGIC ---

// Hardcoded fallback keys provided by user
const FALLBACK_URL = "https://wkblzroluuljlsklxyeb.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmx6cm9sdXVsamxza2x4eWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxMzgsImV4cCI6MjA3OTE2MjEzOH0.HpPtkq8gGZGH0-WDMyoFMuTEZwU64j397NJNLBmld1A";

const envUrl = process.env.VITE_SUPABASE_URL;
const envKey = process.env.VITE_SUPABASE_ANON_KEY;

const finalUrl = (envUrl && envUrl.length > 5) ? envUrl : FALLBACK_URL;
const finalKey = (envKey && envKey.length > 5) ? envKey : FALLBACK_KEY;

export let db: DatabaseProvider;
export let isLive = false;

// Safe Initialization
try {
    if (finalUrl && finalKey) {
        db = new SupabaseAdapter(finalUrl, finalKey);
        // We assume it's live until it fails
        isLive = true;
    } else {
        console.warn("Missing Supabase Credentials, running in Local Mode");
        db = new LocalAdapter();
        isLive = false;
    }
} catch (e) {
    console.error("Database initialization crashed, recovering to Local Mode");
    db = new LocalAdapter();
    isLive = false;
}
