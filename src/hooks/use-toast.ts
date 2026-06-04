'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';
import { AuthService } from '@/lib/auth';

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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

  // =========================
  // REFRESH AUTH
  // =========================
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
      setState({
        user: null,
        loading: false,
        error: error.message || 'Falha ao obter sessão do usuário',
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const user = await AuthService.getCurrentUser();

        if (mounted) {
          setState({
            user,
            loading: false,
            error: null,
          });
        }
      } catch (error: any) {
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

    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      if (mounted) {
        setState(prev => ({
          ...prev,
          user,
          loading: false,
          error: null,
        }));
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // =========================
  // EMAIL LOGIN (mantido)
  // =========================
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

  // =========================
  // GOOGLE LOGIN
  // =========================
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const result = await AuthService.signInWithGoogle();

      if (result.success) {
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Falha no login com Google',
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

  // =========================
  // SIGN UP
  // =========================
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

  // =========================
  // SIGN OUT
  // =========================
  const signOut = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    await AuthService.signOut();
    setState({
      user: null,
      loading: false,
      error: null,
    });
  };

  // =========================
  // RESET PASSWORD
  // =========================
  const resetPassword = async (email: string): Promise<boolean> => {
    const result = await AuthService.resetPassword({ email });

    if (!result.success) {
      setState(prev => ({
        ...prev,
        error: result.error || 'Falha na recuperação',
      }));
      return false;
    }

    return true;
  };

  return {
    ...state,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    refreshAuth,
  };
}
