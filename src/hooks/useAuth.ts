'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';
import { AuthService } from '@/lib/auth';

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const user = await AuthService.getCurrentUser();
      setState({
        user,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('❌ Error refreshing auth state:', error);
      setState({
        user: null,
        loading: false,
        error: error.message || 'Failed to get user session',
      });
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial auth session...');
        
        const user = await AuthService.getCurrentUser();
        
        setState({
          user,
          loading: false,
          error: null,
        });
        
        console.log(user ? '✅ User authenticated' : '❌ No authenticated user');
      } catch (error: any) {
        console.error('❌ Error getting initial session:', error);
        setState({
          user: null,
          loading: false,
          error: error.message || 'Failed to get user session',
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log('🔄 Setting up auth state listener...');
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      console.log('🔄 Auth state change detected:', user?.email || 'No user');
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener...');
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Validate inputs
      if (!email || !password) {
        const error = 'Email and password are required';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (!email.includes('@')) {
        const error = 'Please enter a valid email address';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (password.length < 6) {
        const error = 'Password must be at least 6 characters long';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }
      
      const result = await AuthService.signIn({ email, password });
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          user: result.data || null,
          loading: false,
          error: null
        }));
        return { success: true };
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.error || 'Sign in failed' 
        }));
        return { success: false, error: result.error || 'Sign in failed' };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Validate inputs
      if (!email || !password) {
        const error = 'Email and password are required';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (!email.includes('@')) {
        const error = 'Please enter a valid email address';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }

      if (password.length < 6) {
        const error = 'Password must be at least 6 characters long';
        setState(prev => ({ ...prev, loading: false, error }));
        return { success: false, error };
      }
      
      const result = await AuthService.signUp({ email, password, fullName });
      
      if (result.success) {
        setState(prev => ({ 
          ...prev, 
          user: result.data || null,
          loading: false,
          error: null
        }));
        return { success: true };
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.error || 'Sign up failed' 
        }));
        return { success: false, error: result.error || 'Sign up failed' };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      await AuthService.signOut();
      
      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      setState({
        user: null,
        loading: false,
        error: error.message || 'Sign out failed',
      });
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      if (!email || !email.includes('@')) {
        setState(prev => ({ 
          ...prev, 
          error: 'Please enter a valid email address' 
        }));
        return false;
      }

      const result = await AuthService.resetPassword({ email });
      
      if (!result.success) {
        setState(prev => ({ 
          ...prev, 
          error: result.error || 'Password reset failed' 
        }));
        return false;
      }
      
      setState(prev => ({ ...prev, error: null }));
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Password reset failed' 
      }));
      return false;
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshAuth,
  };
}