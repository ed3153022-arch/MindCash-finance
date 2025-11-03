import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('URL:', supabaseUrl ? '✅ Present' : '❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  console.error('Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  // Throw error to prevent app from running with invalid config
  if (typeof window !== 'undefined') {
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
  }
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
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