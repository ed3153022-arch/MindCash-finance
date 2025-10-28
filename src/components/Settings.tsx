'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Home,
  BarChart3, 
  Settings as SettingsIcon, 
  CreditCard,
  LogOut,
  Save,
  User,
  Bell,
  Target
} from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SettingsProps {
  user: UserType;
  setCurrentView: (view: 'dashboard' | 'reports' | 'settings' | 'plans') => void;
  updateUser: (updates: Partial<UserType>) => void;
  logout: () => void;
}

export function Settings({ user, setCurrentView, updateUser, logout }: SettingsProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [monthlyGoal, setMonthlyGoal] = useState(user.monthlyGoal.toString());
  const [alertLimit, setAlertLimit] = useState(user.alertLimit?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateUser({
      name,
      email,
      monthlyGoal: parseFloat(monthlyGoal),
      alertLimit: parseFloat(alertLimit) || 0,
    });
    
    setIsLoading(false);
    alert('Configurações salvas com sucesso!');
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'trial': return 'bg-blue-500';
      case 'essencial': return 'bg-green-500';
      case 'pro': return 'bg-purple-500';
      case 'premium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'trial': return 'Teste Grátis';
      case 'essencial': return 'Essencial';
      case 'pro': return 'Pro';
      case 'premium': return 'Premium';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-2 rounded-xl">
              <DollarSign className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MindCash</h1>
              <p className="text-sm text-slate-400">Olá, {user.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge className={`${getPlanBadgeColor(user.plan || 'trial')} text-white`}>
              {getPlanName(user.plan || 'trial')}
            </Badge>
            
            <nav className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setCurrentView('dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setCurrentView('reports')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setCurrentView('plans')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Planos
              </Button>
              <Button variant="ghost" size="sm" className="text-yellow-400">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </nav>
            
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription className="text-slate-400">
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Configurações Financeiras
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure suas metas e alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyGoal" className="text-white">Meta Mensal de Economia</Label>
                  <Input
                    id="monthlyGoal"
                    type="number"
                    step="0.01"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-slate-400 text-sm">
                    Valor atual: {formatCurrency(parseFloat(monthlyGoal) || 0)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="alertLimit" className="text-white">Limite de Alerta de Gastos</Label>
                  <Input
                    id="alertLimit"
                    type="number"
                    step="0.01"
                    value={alertLimit}
                    onChange={(e) => setAlertLimit(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-slate-400 text-sm">
                    Você será alertado ao ultrapassar: {formatCurrency(parseFloat(alertLimit) || 0)}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Plan Information */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Informações do Plano
            </CardTitle>
            <CardDescription className="text-slate-400">
              Detalhes da sua assinatura atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Plano Atual</p>
                <p className="text-slate-400">
                  {getPlanName(user.plan || 'trial')}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className={`${getPlanBadgeColor(user.plan || 'trial')} text-white`}>
                  {getPlanName(user.plan || 'trial')}
                </Badge>
                <Button 
                  onClick={() => setCurrentView('plans')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  Gerenciar Plano
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notificações
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure como você quer receber alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Alertas de Gastos</p>
                  <p className="text-slate-400 text-sm">
                    Receba notificações quando ultrapassar limites
                  </p>
                </div>
                <div className="text-green-400 font-medium">Ativo</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Relatórios Mensais</p>
                  <p className="text-slate-400 text-sm">
                    Resumo mensal das suas finanças
                  </p>
                </div>
                <div className="text-green-400 font-medium">Ativo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}