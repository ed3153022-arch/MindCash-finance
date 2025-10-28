'use client';

import { useState, useEffect } from 'react';
import { User, Profile, AuthState } from '@/types';
import { AuthService } from '@/lib/auth';
import { ApiService } from '@/lib/api';

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setState({
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: 'Failed to get user session',
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const result = await AuthService.signIn({ email, password });
    
    if (result.success) {
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } else {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || 'Sign in failed' 
      }));
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const result = await AuthService.signUp({ email, password, fullName });
    
    if (result.success) {
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } else {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || 'Sign up failed' 
      }));
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    await AuthService.signOut();
    setState({
      user: null,
      loading: false,
      error: null,
    });
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    const result = await AuthService.resetPassword({ email });
    
    if (!result.success) {
      setState(prev => ({ 
        ...prev, 
        error: result.error || 'Password reset failed' 
      }));
      return false;
    }
    
    return true;
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    const result = await ApiService.getProfile(user.id);
    
    if (result.success) {
      setProfile(result.data || null);
    } else {
      setError(result.error || 'Failed to fetch profile');
    }
    
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user?.id) return false;

    setLoading(true);
    setError(null);

    const result = await ApiService.updateProfile(user.id, updates);
    
    if (result.success) {
      setProfile(result.data || null);
      setLoading(false);
      return true;
    } else {
      setError(result.error || 'Failed to update profile');
      setLoading(false);
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}