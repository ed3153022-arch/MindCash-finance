'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Home,
  BarChart3, 
  Settings, 
  CreditCard,
  LogOut,
  Check,
  Crown,
  Sparkles,
  Zap,
  Target,
  Brain,
  Shield,
  Download,
  Code,
  Bell,
  Repeat,
  FileText,
  TrendingUpIcon,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { User } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface PlansProps {
  user: User;
  setCurrentView: (view: 'dashboard' | 'reports' | 'settings' | 'plans') => void;
  showPlanConfirmationModal: (planId: 'essencial' | 'pro' | 'premium', planName: string, planPrice: number) => void;
  startFreeTrial: () => void;
  logout: () => void;
  getRemainingTrialInfo: () => { remainingDays: number; remainingTransactions: number; isExpired: boolean } | null;
}

export function Plans({ user, setCurrentView, showPlanConfirmationModal, startFreeTrial, logout, getRemainingTrialInfo }: PlansProps) {
  const trialInfo = getRemainingTrialInfo();

  // Redirecionar para checkout da Kiwify
  const handleKiwifyCheckout = () => {
    window.open('https://pay.kiwify.com.br/1jxomi0', '_blank');
  };

  // Todas as funcionalidades do MindCash Plus
  const mindCashPlusFeatures = [
    {
      icon: Home,
      name: 'Dashboard Dinâmico',
      description: 'Visão geral completa com saldo, receitas, despesas e progresso visual'
    },
    {
      icon: FileText,
      name: 'Relatórios Avançados',
      description: 'Dados e estatísticas financeiras detalhadas com gráficos interativos'
    },
    {
      icon: Zap,
      name: 'Categorização Automática',
      description: 'IA identifica e classifica suas transações automaticamente'
    },
    {
      icon: TrendingUpIcon,
      name: 'Análise de Tendências',
      description: 'Padrões e previsões baseadas no seu histórico financeiro'
    },
    {
      icon: Target,
      name: 'Metas Personalizadas',
      description: 'Crie e acompanhe objetivos financeiros com progresso visual'
    },
    {
      icon: Repeat,
      name: 'Automação de Despesas',
      description: 'Registra e repete gastos fixos automaticamente'
    },
    {
      icon: Bell,
      name: 'Alertas Inteligentes',
      description: 'Notificações sobre gastos fora do padrão ou prazos importantes'
    },
    {
      icon: Shield,
      name: 'Backup Automático',
      description: 'Suas informações salvas periodicamente na nuvem'
    },
    {
      icon: Download,
      name: 'Exportação de Dados',
      description: 'Baixe relatórios completos em CSV ou PDF'
    },
    {
      icon: Brain,
      name: 'IA para Insights Financeiros',
      description: 'Recomendações e previsões personalizadas baseadas em IA'
    },
    {
      icon: Code,
      name: 'API Personalizada',
      description: 'Integre com Google Planilhas e outros serviços externos'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 py-6 px-4 sm:px-6 lg:px-8">
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
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900">
              {user.plan === 'premium' ? 'MindCash Plus' : user.plan === 'trial' ? 'Teste Grátis' : 'MindCash Plus'}
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
              <Button variant="ghost" size="sm" className="text-yellow-400">
                <CreditCard className="h-4 w-4 mr-2" />
                Assinatura
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setCurrentView('settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </nav>
            
            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Assinatura MindCash Plus
            </h2>
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-slate-400 text-lg">
            O plano completo para transformar sua relação com o dinheiro
          </p>
        </div>

        {/* Trial Alert - Contador de dias restantes */}
        {user.plan === 'trial' && trialInfo && trialInfo.remainingDays > 0 && (
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-500/20 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-yellow-300 font-bold text-lg">
                      Teste Grátis - {trialInfo.remainingDays} {trialInfo.remainingDays === 1 ? 'dia restante' : 'dias restantes'}
                    </h3>
                    <p className="text-yellow-400">
                      Acesso completo a todas as funcionalidades do MindCash Plus
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setCurrentView('dashboard')}
                  variant="outline"
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Plan Card */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-yellow-400 border-2 shadow-2xl shadow-yellow-400/20 relative">
            {/* Highlight Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-4 py-1 text-sm font-bold">
                PLANO COMPLETO
              </Badge>
            </div>
            
            <CardHeader className="text-center pt-8 px-8">
              <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 w-fit mb-4">
                <Crown className="h-8 w-8 text-slate-900" />
              </div>
              <CardTitle className="text-white text-3xl mb-2">MindCash Plus</CardTitle>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-yellow-400">
                  R$ 49,90
                </div>
                <p className="text-slate-400 text-lg">por mês</p>
              </div>
              <p className="text-slate-300 text-lg mt-4">
                Acesso completo a todas as funcionalidades premium
              </p>
            </CardHeader>
            
            <CardContent className="space-y-8 px-8 pb-8">
              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mindCashPlusFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <feature.icon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{feature.name}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Subscribe Button */}
              <div className="text-center">
                <Button 
                  onClick={handleKiwifyCheckout}
                  className="px-12 py-4 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg hover:shadow-xl hover:shadow-yellow-400/30"
                >
                  💳 Ativar MindCash Plus
                </Button>
                <p className="text-slate-400 text-sm mt-3">
                  Pagamento seguro via Kiwify • Cancele quando quiser
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardContent className="p-8">
              <div className="p-4 bg-yellow-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Automação Inteligente</h3>
              <p className="text-slate-400">
                Deixe a IA cuidar da categorização e análise das suas finanças automaticamente.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardContent className="p-8">
              <div className="p-4 bg-yellow-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Brain className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Insights Personalizados</h3>
              <p className="text-slate-400">
                Receba recomendações e previsões baseadas no seu perfil financeiro único.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 text-center">
            <CardContent className="p-8">
              <div className="p-4 bg-yellow-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Segurança Total</h3>
              <p className="text-slate-400">
                Seus dados protegidos com backup automático e criptografia de ponta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}