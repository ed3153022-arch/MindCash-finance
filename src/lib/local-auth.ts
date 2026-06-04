// Sistema de autenticação local para desenvolvimento
import { User, ApiResponse } from '@/types';

export interface LocalUser {
  id: string;
  email: string;
  password: string;
  fullName?: string;
  createdAt: string;
}

export interface SessionData {
  user: LocalUser;
  token: string;
  expiresAt: number;
}

const STORAGE_KEYS = {
  USERS: 'mindcash_users',
  SESSION: 'mindcash_user_session'
};

export class LocalAuthService {
  // Gerar ID único
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Gerar token de sessão
  private static generateToken(): string {
    return btoa(Date.now().toString() + Math.random().toString());
  }

  // Hash simples para senha (apenas para desenvolvimento)
  private static hashPassword(password: string): string {
    return btoa(password + 'mindcash_salt');
  }

  // Verificar senha
  private static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // Obter usuários do localStorage
  private static getUsers(): LocalUser[] {
    try {
      const users = localStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  // Salvar usuários no localStorage
  private static saveUsers(users: LocalUser[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Obter sessão atual
  private static getCurrentSession(): SessionData | null {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!session) return null;

      const sessionData: SessionData = JSON.parse(session);
      
      // Verificar se a sessão não expirou
      if (Date.now() > sessionData.expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return null;
      }

      return sessionData;
    } catch {
      return null;
    }
  }

  // Salvar sessão
  private static saveSession(user: LocalUser): string {
    const token = this.generateToken();
    const sessionData: SessionData = {
      user,
      token,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 dias
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    return token;
  }

  // Cadastrar usuário
  static async signUp(email: string, password: string, fullName?: string): Promise<ApiResponse<User>> {
    try {
      // Validações
      if (!email || !password) {
        return {
          success: false,
          error: 'E-mail e senha são obrigatórios'
        };
      }

      if (!email.includes('@')) {
        return {
          success: false,
          error: 'Por favor, digite um e-mail válido'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres'
        };
      }

      const users = this.getUsers();
      
      // Verificar se o usuário já existe
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return {
          success: false,
          error: 'Já existe uma conta com este e-mail. Faça login.'
        };
      }

      // Criar novo usuário
      const newUser: LocalUser = {
        id: this.generateId(),
        email: email.toLowerCase(),
        password: this.hashPassword(password),
        fullName,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);

      // Criar sessão automaticamente
      this.saveSession(newUser);

      return {
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          user_metadata: { full_name: newUser.fullName }
        } as User,
        message: 'Conta criada com sucesso!'
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro inesperado ao criar conta. Tente novamente.'
      };
    }
  }

  // Fazer login
  static async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      // Validações
      if (!email || !password) {
        return {
          success: false,
          error: 'E-mail e senha são obrigatórios'
        };
      }

      const users = this.getUsers();
      
      // Encontrar usuário
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return {
          success: false,
          error: 'E-mail ou senha incorretos'
        };
      }

      // Verificar senha
      if (!this.verifyPassword(password, user.password)) {
        return {
          success: false,
          error: 'E-mail ou senha incorretos'
        };
      }

      // Criar nova sessão
      this.saveSession(user);

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.fullName }
        } as User,
        message: 'Login realizado com sucesso!'
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro inesperado ao fazer login. Tente novamente.'
      };
    }
  }

  // Fazer logout
  static async signOut(): Promise<ApiResponse> {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return {
        success: true,
        message: 'Logout realizado com sucesso!'
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao fazer logout'
      };
    }
  }

  // Obter usuário atual
  static getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    if (!session) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      user_metadata: { full_name: session.user.fullName }
    } as User;
  }

  // Verificar se está autenticado
  static isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  // Simular listener de mudanças de estado
  static onAuthStateChange(callback: (user: User | null) => void) {
    // Verificar estado inicial
    const currentUser = this.getCurrentUser();
    callback(currentUser);

    // Simular subscription (para compatibilidade)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // Cleanup se necessário
          }
        }
      }
    };
  }
}