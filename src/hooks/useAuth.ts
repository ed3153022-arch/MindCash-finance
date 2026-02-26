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
  signInWithGoogle: () => Promise<{ error?: string }>;
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
        error: error.message || 'Falha ao obter sessão do usuário',
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: any = null;

    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial auth session...');
        
        const user = await AuthService.getCurrentUser();
        
        if (mounted) {
          setState({
            user,
            loading: false,
            error: null,
          });
        }
        
        console.log(user ? '✅ User authenticated on load' : '❌ No authenticated user on load');
      } catch (error: any) {
        console.error('❌ Error getting initial session:', error);
        if (mounted) {
          setState({
            user: null,
            loading: false,
            error: error.message || 'Falha ao obter sessão do usuário',
          });
        }
      }
    };

    getInitialSession();

    console.log('🔄 Setting up auth state listener...');
    const { data: { subscription: authSubscription } } =
      AuthService.onAuthStateChange((user) => {
        console.log('🔄 Auth state change detected:', user?.email || 'No user');
        if (mounted) {
          setState(prev => ({
            ...prev,
            user,
            loading: false,
            error: null,
          }));
        }
      });
    
    subscription = authSubscription;

    return () => {
      mounted = false;
      if (subscription && subscription.unsubscribe) {
        console.log('🔄 Cleaning up auth state listener...');
        subscription.unsubscribe();
      }
    };
  }, []);

  // EMAIL LOGIN
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.signIn({ email, password });

      if (result.success) {
        setState(prev => ({
          ...prev,
          user: result.data || null,
          loading: false,
          error: null,
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Falha no login',
        }));
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  // GOOGLE LOGIN 🔥
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.signInWithGoogle();

      if (result?.error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
        }));
        return { error: result.error };
      }

      return {};
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao entrar com Google';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.signUp({ email, password, fullName });

      if (result.success) {
        setState(prev => ({
          ...prev,
          user: result.data || null,
          loading: false,
          error: null,
        }));
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Falha no cadastro',
        }));
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro inesperado';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
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
      setState({
        user: null,
        loading: false,
        error: error.message || 'Falha no logout',
      });
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const result = await AuthService.resetPassword({ email });

      if (!result.success) {
        setState(prev => ({
          ...prev,
          error: result.error || 'Falha na recuperação de senha',
        }));
        return false;
      }

      setState(prev => ({ ...prev, error: null }));
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Falha na recuperação de senha',
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
    signInWithGoogle,
  };
}
