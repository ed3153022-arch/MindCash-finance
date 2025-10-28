'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinanceApp } from '@/hooks/useFinanceApp';
import { 
  Check, 
  Crown, 
  ArrowLeft,
  Sparkles,
  Star,
  X,
  Zap,
  Target,
  Brain,
  Shield,
  Download,
  Code,
  Mail,
  Bell,
  Repeat,
  FileText,
  Home,
  TrendingUpIcon
} from 'lucide-react';

export default function AssinaturaPage() {
  const router = useRouter();
  const { 
    user, 
    setCurrentView, 
    showPlanConfirmation,
    showPlanConfirmationModal,
    hidePlanConfirmationModal,
    confirmSubscription,
    showSuccessMessage,
    getRemainingTrialInfo
  } = useFinanceApp();

  const trialInfo = getRemainingTrialInfo();

  const handleSubscribe = () => {
    showPlanConfirmationModal('premium', 'MindCash Plus', 49.90);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      setCurrentView('dashboard');
      router.push('/');
    }
  };

  // Todas as funcionalidades do MindCash Plus
  const mindCashPlusFeatures = [
    {
      icon: Home,
      name: 'Dashboard Dinâmico',
      description: 'Visão geral completa com saldo, receitas, despesas e progresso visual em tempo real'
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
      description: 'Registra e repete gastos fixos automaticamente todo mês'
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
    },
    {
      icon: Mail,
      name: 'Suporte por E-mail',
      description: 'Contato direto com nossa equipe de suporte especializada'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Success Message */}
      {showSuccessMessage.show && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl shadow-2xl border border-green-500 animate-pulse">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5" />
            <span className="font-semibold">{showSuccessMessage.message}</span>
          </div>
        </div>
      )}

      {/* Plan Confirmation Modal */}
      {showPlanConfirmation.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md border-2 border-yellow-400 shadow-2xl shadow-yellow-400/20">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Crown className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Confirmar Assinatura</h3>
              <p className="text-slate-300 leading-relaxed">
                Você está prestes a assinar o <span className="text-yellow-400 font-semibold">MindCash Plus</span> por{' '}
                <span className="text-yellow-400 font-bold">R$ 49,90/mês</span>.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={hidePlanConfirmationModal}
                className="flex-1 py-4 px-6 bg-slate-700 text-slate-300 rounded-2xl font-semibold hover:bg-slate-600 transition-all duration-300 hover:scale-105"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSubscription}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 rounded-2xl font-bold hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-yellow-400/30"
              >
                Confirmar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition-all duration-300 hover:scale-105 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.4)] active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-yellow-400">MindCash</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user?.plan === 'premium' && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 rounded-full text-sm font-bold">
                  <Check className="h-4 w-4" />
                  MindCash Plus Ativo
                </div>
              )}
              <span className="text-sm text-slate-400">Olá, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              MindCash Plus
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
            O plano completo para transformar sua relação com o dinheiro. 
            Todas as funcionalidades premium em um único plano.
          </p>
        </div>

        {/* Trial Info */}
        {user?.plan === 'trial' && trialInfo && (
          <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-2xl p-6 mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-blue-800/30 rounded-full">
                <Sparkles className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-400">Teste Gratuito Ativo</h3>
            </div>
            <p className="text-blue-200 mb-4">
              Você está aproveitando nosso período de teste gratuito com acesso completo a todas as funcionalidades.
            </p>
            <div className="text-sm text-blue-300">
              <strong>Restam:</strong> {trialInfo.remainingDays} dias
            </div>
          </div>
        )}

        {/* Main Plan Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative bg-slate-800 rounded-3xl p-8 border-2 border-yellow-400 shadow-2xl shadow-yellow-400/20">
            {/* Highlight Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-2 rounded-full text-sm font-bold">
                PLANO COMPLETO
              </div>
            </div>

            {/* Plan Header */}
            <div className="text-center mb-8 pt-4">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl text-slate-900">
                  <Crown className="h-8 w-8" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold mb-2">MindCash Plus</h2>
              
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span className="text-5xl font-bold text-yellow-400">R$ 49,90</span>
                <span className="text-slate-400 text-lg">/mês</span>
              </div>
              
              <p className="text-slate-300 text-lg">
                Acesso completo a todas as funcionalidades premium
              </p>
            </div>

            {/* Subscribe Button */}
            <div className="text-center mb-8">
              <button
                onClick={handleSubscribe}
                className={`px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 ${
                  user?.plan === 'premium'
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg hover:shadow-xl hover:shadow-yellow-400/30'
                }`}
              >
                {user?.plan === 'premium' ? 'Plano Ativo' : 'Assinar MindCash Plus'}
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mindCashPlusFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
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
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="p-4 bg-yellow-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Automação Inteligente</h3>
            <p className="text-slate-400">
              Deixe a IA cuidar da categorização e análise das suas finanças automaticamente.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-yellow-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Brain className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Insights Personalizados</h3>
            <p className="text-slate-400">
              Receba recomendações e previsões baseadas no seu perfil financeiro único.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-yellow-400/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Segurança Total</h3>
            <p className="text-slate-400">
              Seus dados protegidos com backup automático e criptografia de ponta.
            </p>
          </div>
        </div>

        {/* Guarantee Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-yellow-400/20 rounded-full">
                <Crown className="h-6 w-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold">Garantia de Satisfação</h3>
            </div>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Experimente o MindCash Plus por 30 dias. Se não ficar completamente satisfeito, 
              devolvemos 100% do seu dinheiro, sem perguntas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}