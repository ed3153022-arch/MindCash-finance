import { supabase } from './supabase';
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
  // Sign up with email and password
  static async signUp({ email, password, fullName }: SignUpData): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.user as User,
        message: 'Account created successfully! Please check your email to verify your account.',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign up',
      };
    }
  }

  // Sign in with email and password
  static async signIn({ email, password }: SignInData): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.user as User,
        message: 'Signed in successfully!',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign in',
      };
    }
  }

  // Sign out
  static async signOut(): Promise<ApiResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Signed out successfully!',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign out',
      };
    }
  }

  // Reset password
  static async resetPassword({ email }: ResetPasswordData): Promise<ApiResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox.',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred while sending reset email',
      };
    }
  }

  // Update password
  static async updatePassword({ password }: UpdatePasswordData): Promise<ApiResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Password updated successfully!',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred while updating password',
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user as User | null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as User | null);
    });
  }
}