import { supabase, testSupabaseConnection } from './supabase';
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
  // Test connection before operations
  private static async ensureConnection(): Promise<boolean> {
    try {
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to authentication service');
      }
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Sign up with email and password
  static async signUp({ email, password, fullName }: SignUpData): Promise<ApiResponse<User>> {
    try {
      console.log('🔄 Attempting to sign up user:', email);
      
      // Test connection first
      const connected = await this.ensureConnection();
      if (!connected) {
        return {
          success: false,
          error: 'Unable to connect to authentication service. Please check your internet connection.',
        };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
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
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Account creation failed. Please try again.',
        };
      }

      console.log('✅ Sign up successful:', data.user.email);

      return {
        success: true,
        data: data.user as User,
        message: 'Account created successfully! Please check your email to verify your account.',
      };
    } catch (error: any) {
      console.error('❌ Unexpected sign up error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign up. Please try again.',
      };
    }
  }

  // Sign in with email and password
  static async signIn({ email, password }: SignInData): Promise<ApiResponse<User>> {
    try {
      console.log('🔄 Attempting to sign in user:', email);
      
      // Test connection first
      const connected = await this.ensureConnection();
      if (!connected) {
        return {
          success: false,
          error: 'Unable to connect to authentication service. Please check your internet connection.',
        };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'No account found with this email. Please sign up first.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Sign in failed. Please try again.',
        };
      }

      console.log('✅ Sign in successful:', data.user.email);

      return {
        success: true,
        data: data.user as User,
        message: 'Signed in successfully!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected sign in error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign in. Please try again.',
      };
    }
  }

  // Sign out
  static async signOut(): Promise<ApiResponse> {
    try {
      console.log('🔄 Signing out user...');
      
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
        message: 'Signed out successfully!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected sign out error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during sign out',
      };
    }
  }

  // Reset password
  static async resetPassword({ email }: ResetPasswordData): Promise<ApiResponse> {
    try {
      console.log('🔄 Sending password reset email to:', email);
      
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
        message: 'Password reset email sent! Please check your inbox.',
      };
    } catch (error: any) {
      console.error('❌ Unexpected password reset error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred while sending reset email',
      };
    }
  }

  // Update password
  static async updatePassword({ password }: UpdatePasswordData): Promise<ApiResponse> {
    try {
      console.log('🔄 Updating password...');
      
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
        message: 'Password updated successfully!',
      };
    } catch (error: any) {
      console.error('❌ Unexpected password update error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred while updating password',
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      callback(session?.user as User | null);
    });
    
    return { data: { subscription } };
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getCurrentSession();
      return !!session?.user;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }
}