'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, DollarSign, Gift, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentView: (view: 'login' | 'register') => void;
}

export function RegisterForm({ register, setCurrentView }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register(name, email, password);
      
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

        {/* Teste Grátis Banner */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <Gift className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-green-300 font-semibold text-sm">🎉 Teste Grátis Automático</h3>
              <p className="text-green-400 text-xs">
                Ao criar sua conta, você ganha 7 dias grátis automaticamente!
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="px-8 pt-8 pb-6">
            <CardTitle className="text-white">Criar sua conta</CardTitle>
            <CardDescription className="text-slate-400">
              Comece a controlar suas finanças hoje mesmo
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
                <Label htmlFor="name" className="text-white">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

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
                <p className="text-xs text-slate-500">
                  Cada e-mail pode usar o teste grátis apenas uma vez
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
                {isLoading ? 'Criando conta...' : '🚀 Criar conta e começar teste grátis'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400">
                Já tem uma conta?{' '}
                <Button
                  variant="link"
                  className="text-yellow-400 hover:text-yellow-300 p-0"
                  onClick={() => setCurrentView('login')}
                >
                  Fazer login
                </Button>
              </p>
            </div>

            {/* Informações sobre o teste grátis */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm font-medium mb-2">ℹ️ Como funciona o teste grátis:</p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• 7 dias de acesso completo ao MindCash Plus</p>
                <p>• Inicia automaticamente ao criar a conta</p>
                <p>• Cada e-mail pode usar apenas uma vez</p>
                <p>• Após expirar, assine para continuar usando</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}