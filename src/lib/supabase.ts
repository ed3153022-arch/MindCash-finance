import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're in a valid environment for Supabase
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey.length > 20;

// Mock client for when Supabase is not configured
const createMockClient = () => ({
  auth: {
    signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Call callback immediately with null user
      setTimeout(() => callback('SIGNED_OUT', null), 0);
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      };
    },
    resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
    updateUser: async () => ({ error: { message: 'Supabase not configured' } })
  },
  from: () => ({
    select: () => ({
      limit: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
    })
  })
});

// Create Supabase client with correct auth configuration
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Configurações corretas para persistência de sessão
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Correto para aplicações web
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'mindcash_user_session', // Chave específica para o app
        debug: false
      },
      global: {
        headers: {
          'X-Client-Info': 'mindcash-web-app'
        }
      }
    })
  : createMockClient();

// Test connection function
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    console.warn('⚠️ Supabase not configured - using mock client');
    return false;
  }

  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Check if Supabase is properly configured
export const isSupabaseReady = () => isSupabaseConfigured;

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};