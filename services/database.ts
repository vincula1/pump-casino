import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';
import { storageService } from './storageService';

// 1. Setup Supabase Client with the keys provided
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wkblzroluuljlsklxyeb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmx6cm9sdXVsamxza2x4eWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxMzgsImV4cCI6MjA3OTE2MjEzOH0.HpPtkq8gGZGH0-WDMyoFMuTEZwU64j397NJNLBmld1A';

let supabase: SupabaseClient | null = null;
export let isLive = false;

try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    // We optimistically assume live mode if keys exist, but will fallback if requests fail
    isLive = true;
  }
} catch (error) {
  console.warn("Supabase init failed, falling back to local storage", error);
  isLive = false;
}

export const db = {
  getUser: async (walletAddress: string): Promise<User> => {
    // Attempt Supabase first
    if (isLive && supabase) {
      try {
        // 1. Try to fetch existing user
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (error) {
          // If error is "Row not found", create new user
          if (error.code === 'PGRST116') {
             console.log("User not found in DB, creating new user...");
             const { data: newUser, error: createError } = await supabase
               .from('users')
               .insert([
                 { 
                   wallet_address: walletAddress, 
                   balance: INITIAL_BALANCE,
                   avatar_url: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${walletAddress}`
                 }
               ])
               .select()
               .single();
               
             if (createError) {
               console.error("Failed to create user in DB", createError);
               throw createError;
             }
             return {
               username: newUser.wallet_address,
               balance: newUser.balance,
               avatarUrl: newUser.avatar_url
             };
          } else {
             // Some other error (e.g. table doesn't exist, connection issue)
             console.warn("Database error, switching to offline mode for this session:", error.message);
             // Do NOT set isLive = false globally here, just fallback for this request
             throw error;
          }
        }

        // User found
        return {
          username: data.wallet_address,
          balance: data.balance,
          avatarUrl: data.avatar_url
        };

      } catch (e) {
        // Fallback to local storage
        console.log("Falling back to local storage for getUser");
        return storageService.loadUserByWallet(walletAddress);
      }
    }

    // Offline mode default
    return storageService.loadUserByWallet(walletAddress);
  },

  updateUserBalance: async (walletAddress: string, newBalance: number) => {
    // Always update local storage for UI responsiveness and backup
    storageService.updateBalance(newBalance);

    if (isLive && supabase) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('wallet_address', walletAddress);

        if (error) {
           console.warn("Failed to sync balance to DB:", error.message);
        }
      } catch (e) {
         // Silent fail on sync, local state is updated
      }
    }
  }
};