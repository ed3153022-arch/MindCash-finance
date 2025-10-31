'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, DollarSign, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  login: (email: string, password: string) => void;
  setCurrentView: (view: 'login' | 'register') => void;
}

// Base de usuários válidos para demonstração
const validUsers = [
  { email: 'admin@mindcash.com', password: '123456' },
  { email: 'usuario@teste.com', password: 'senha123' },
  { email: 'demo@mindcash.com', password: 'demo123' }
];

export function LoginForm({ login, setCurrentView }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validar credenciais
    const user = validUsers.find(u => u.email === email);
    
    if (!user) {
      setErrorMessage('Conta não encontrada. Verifique o e-mail digitado.');
      setIsLoading(false);
      return;
    }
    
    if (user.password !== password) {
      setErrorMessage('Senha incorreta. Tente novamente.');
      setIsLoading(false);
      return;
    }
    
    // Login bem-sucedido
    login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-3 rounded-2xl">
              <DollarSign className="h-8 w-8 text-slate-900" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            MindCash
          </h1>
          <p className="text-slate-400 mt-2">Controle Financeiro Inteligente</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="px-8 pt-8 pb-6">
            <CardTitle className="text-white">Entrar na sua conta</CardTitle>
            <CardDescription className="text-slate-400">
              Digite suas credenciais para acessar o MindCash
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {/* Mensagem de erro */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400">
                Não tem uma conta?{' '}
                <Button
                  variant="link"
                  className="text-yellow-400 hover:text-yellow-300 p-0"
                  onClick={() => setCurrentView('register')}
                >
                  Criar conta
                </Button>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}