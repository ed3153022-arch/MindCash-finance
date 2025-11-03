import { supabase, testSupabaseConnection, isSupabaseReady } from './supabase';
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
  // Verificar se deve usar Supabase ou sistema local
  private static shouldUseSupabase(): boolean {
    return isSupabaseReady();
  }

  // Sign up with email and password
  static async signUp({ email, password, fullName }: SignUpData): Promise<ApiResponse<User>> {
    try {
      console.log('🔄 Attempting to sign up user:', email);
      
      // Usar sistema local se Supabase não estiver configurado
      if (!this.shouldUseSupabase()) {
        console.log('📱 Using local authentication system');
        return await LocalAuthService.signUp(email, password, fullName);
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        
        // Handle specific error cases
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
          errorMessage = 'Já existe uma conta com este e-mail. Faça login.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Por favor, digite um e-mail válido.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Falha ao criar conta. Tente novamente.',
        };
      }

      console.log('✅ Sign up successful:', data.user.email);

      return {
        success: true,
        data: data.user as User,
        message: 'Conta criada com sucesso!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected sign up error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao criar conta. Tente novamente.',
      };
    }
  }

  // Sign in with email and password
  static async signIn({ email, password }: SignInData): Promise<ApiResponse<User>> {
    try {
      console.log('🔄 Attempting to sign in user:', email);
      
      // Usar sistema local se Supabase não estiver configurado
      if (!this.shouldUseSupabase()) {
        console.log('📱 Using local authentication system');
        return await LocalAuthService.signIn(email, password);
      }
      
      // Limpar qualquer sessão anterior antes de fazer login
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid credentials')) {
          errorMessage = 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Verifique seu e-mail e clique no link de confirmação antes de fazer login.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas de login. Aguarde um momento e tente novamente.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Nenhuma conta encontrada com este e-mail. Cadastre-se primeiro.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Falha no login. Tente novamente.',
        };
      }

      console.log('✅ Sign in successful:', data.user.email);
      console.log('✅ Session created and persisted');

      return {
        success: true,
        data: data.user as User,
        message: 'Login realizado com sucesso!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected sign in error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao fazer login. Tente novamente.',
      };
    }
  }

  // Sign out
  static async signOut(): Promise<ApiResponse> {
    try {
      console.log('🔄 Signing out user...');
      
      // Usar sistema local se Supabase não estiver configurado
      if (!this.shouldUseSupabase()) {
        console.log('📱 Using local authentication system');
        return await LocalAuthService.signOut();
      }
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Sign out error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Sign out successful');
      return {
        success: true,
        message: 'Logout realizado com sucesso!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected sign out error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao fazer logout',
      };
    }
  }

  // Reset password
  static async resetPassword({ email }: ResetPasswordData): Promise<ApiResponse> {
    try {
      console.log('🔄 Sending password reset email to:', email);
      
      if (!this.shouldUseSupabase()) {
        return {
          success: false,
          error: 'Recuperação de senha não disponível no modo local.',
        };
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Password reset email sent');
      return {
        success: true,
        message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.',
      };
    } catch (error: any) {
      console.error('❌ Unexpected password reset error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao enviar e-mail de recuperação',
      };
    }
  }

  // Update password
  static async updatePassword({ password }: UpdatePasswordData): Promise<ApiResponse> {
    try {
      console.log('🔄 Updating password...');
      
      if (!this.shouldUseSupabase()) {
        return {
          success: false,
          error: 'Atualização de senha não disponível no modo local.',
        };
      }
      
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Password updated successfully');
      return {
        success: true,
        message: 'Senha atualizada com sucesso!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected password update error:', error);
      return {
        success: false,
        error: 'Erro inesperado ao atualizar senha',
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Usar sistema local se Supabase não estiver configurado
      if (!this.shouldUseSupabase()) {
        return LocalAuthService.getCurrentUser();
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Error getting current user:', error);
        return null;
      }
      
      return user as User | null;
    } catch (error) {
      console.error('❌ Unexpected error getting current user:', error);
      return null;
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      if (!this.shouldUseSupabase()) {
        return null;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting current session:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('❌ Unexpected error getting current session:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    // Usar sistema local se Supabase não estiver configurado
    if (!this.shouldUseSupabase()) {
      return LocalAuthService.onAuthStateChange(callback);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      
      // Garantir que a sessão seja persistida corretamente
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ User signed in, session persisted');
      } else if (event === 'SIGNED_OUT') {
        console.log('✅ User signed out, session cleared');
      }
      
      callback(session?.user as User | null);
    });
    
    return { data: { subscription } };
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      // Usar sistema local se Supabase não estiver configurado
      if (!this.shouldUseSupabase()) {
        return LocalAuthService.isAuthenticated();
      }

      const session = await this.getCurrentSession();
      const isAuth = !!session?.user;
      console.log('🔍 Authentication check:', isAuth ? 'Authenticated' : 'Not authenticated');
      return isAuth;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }
}