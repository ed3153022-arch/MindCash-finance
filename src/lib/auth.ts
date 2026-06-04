import { supabase } from './supabase';
import { LocalAuthService } from './local-auth';
import { User, ApiResponse } from '@/types';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

export class AuthService {
  private static isSupabaseAvailable(): boolean {
    return !!supabase?.auth;
  }

  // =========================
  // SIGN UP
  // =========================
  static async signUp({ email, password, fullName }: SignUpData): Promise<ApiResponse<User>> {
    try {
      if (!this.isSupabaseAvailable()) {
        return await LocalAuthService.signUp(email, password, fullName);
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName || '' },
        },
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || 'Erro ao criar conta.',
        };
      }

      return {
        success: true,
        data: data.user as User,
        message: 'Conta criada com sucesso!',
      };
    } catch {
      return {
        success: false,
        error: 'Erro inesperado ao criar conta.',
      };
    }
  }

  // =========================
  // SIGN IN
  // =========================
  static async signIn({ email, password }: SignInData): Promise<ApiResponse<User>> {
    try {
      if (!this.isSupabaseAvailable()) {
        return await LocalAuthService.signIn(email, password);
      }

      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user || !data.session) {
        return {
          success: false,
          error: error?.message || 'Falha no login.',
        };
      }

      return {
        success: true,
        data: data.user as User,
        message: 'Login realizado com sucesso!',
      };
    } catch {
      return {
        success: false,
        error: 'Erro inesperado ao fazer login.',
      };
    }
  }

  // =========================
  // SIGN IN WITH GOOGLE
  // =========================
  static async signInWithGoogle(): Promise<ApiResponse> {
    try {
      if (!this.isSupabaseAvailable()) {
        return {
          success: false,
          error: 'Login social não disponível.',
        };
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Erro inesperado ao fazer login com Google.',
      };
    }
  }

  // =========================
  // SIGN OUT
  // =========================
  static async signOut(): Promise<ApiResponse> {
    try {
      if (!this.isSupabaseAvailable()) {
        return await LocalAuthService.signOut();
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Erro ao fazer logout.',
      };
    }
  }

  // =========================
  // RESET PASSWORD
  // =========================
  static async resetPassword({ email }: ResetPasswordData): Promise<ApiResponse> {
    try {
      if (!this.isSupabaseAvailable()) {
        return {
          success: false,
          error: 'Recuperação não disponível.',
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'E-mail de recuperação enviado.',
      };
    } catch {
      return {
        success: false,
        error: 'Erro ao enviar recuperação.',
      };
    }
  }

  // =========================
  // UPDATE PASSWORD
  // =========================
  static async updatePassword({ password }: UpdatePasswordData): Promise<ApiResponse> {
    try {
      if (!this.isSupabaseAvailable()) {
        return {
          success: false,
          error: 'Atualização não disponível.',
        };
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Senha atualizada com sucesso!',
      };
    } catch {
      return {
        success: false,
        error: 'Erro ao atualizar senha.',
      };
    }
  }

  // =========================
  // CURRENT USER
  // =========================
  static async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.isSupabaseAvailable()) {
        return LocalAuthService.getCurrentUser();
      }

      const { data } = await supabase.auth.getUser();
      return data.user as User | null;
    } catch {
      return null;
    }
  }

  // =========================
  // CURRENT SESSION
  // =========================
  static async getCurrentSession() {
    try {
      if (!this.isSupabaseAvailable()) {
        return null;
      }

      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  }

  // =========================
  // AUTH STATE CHANGE
  // =========================
  static onAuthStateChange(callback: (user: User | null) => void) {
    if (!this.isSupabaseAvailable()) {
      return LocalAuthService.onAuthStateChange(callback);
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user as User | null);
    });

    return { data };
  }

  // =========================
  // IS AUTHENTICATED
  // =========================
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return !!session?.user;
  }
}
