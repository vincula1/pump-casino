
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../types';
import { INITIAL_BALANCE } from '../constants';
import { storageService } from './storageService';

// 1. Setup Supabase Client with the keys provided
// Use environment variables with fallback for demo purposes
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkblzroluuljlsklxyeb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrYmx6cm9sdXVsamxza2x4eWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODYxMzgsImV4cCI6MjA3OTE2MjEzOH0.HpPtkq8gGZGH0-WDMyoFMuTEZwU64j397NJNLBmld1A';

export let supabase: SupabaseClient | null = null;
export let isLive = false;

try {
  // Basic validation to ensure we don't init with placeholder strings if they were somehow injected
  if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey && supabaseKey.length > 20) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false // We handle session via wallet
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
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
          .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

        if (!data) {
             // User not found, create new user
             // We catch the insert error specifically
             console.log("User not found in DB, creating new user...");
             try {
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
                
                if (createError) throw createError;
                
                return {
                  username: newUser.wallet_address,
                  balance: newUser.balance,
                  avatarUrl: newUser.avatar_url
                };
             } catch (insertError) {
                console.warn("Insert failed (likely RLS or connectivity), using local fallback", insertError);
                // Fallback to local if DB write fails
                return storageService.loadUserByWallet(walletAddress);
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
        console.log("Falling back to local storage for getUser", e);
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
