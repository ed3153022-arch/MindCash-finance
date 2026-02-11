'use client';

import { useRouter } from 'next/navigation';
import { useFinanceApp } from '@/hooks/useFinanceApp';
import {
  Check,
  Crown,
  ArrowLeft,
  Sparkles,
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

/**
 * URL do checkout da Kiwify
 * Substitua quando criar o produto
 */
const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/SEU_CHECKOUT_AQUI';

export default function AssinaturaPage() {
  const router = useRouter();

  const {
    user,
    setCurrentView,
    showPlanConfirmation,
    showPlanConfirmationModal,
    hidePlanConfirmationModal,
    getRemainingTrialInfo
  } = useFinanceApp();

  const trialInfo = getRemainingTrialInfo();
  const isPremium = user?.plan === 'premium';

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      setCurrentView('dashboard');
      router.push('/');
    }
  };

  const handleSubscribeClick = () => {
    if (isPremium) return;
    showPlanConfirmationModal('premium', 'MindCash Plus', 49.9);
  };

  const handleRedirectToCheckout = () => {
    window.location.href = KIWIFY_CHECKOUT_URL;
  };

  const mindCashPlusFeatures = [
    {
      icon: Home,
      name: 'Dashboard Dinâmico',
      description: 'Visão geral completa com saldo, receitas, despesas e progresso em tempo real'
    },
    {
      icon: FileText,
      name: 'Relatórios Avançados',
      description: 'Gráficos e estatísticas detalhadas do seu dinheiro'
    },
    {
      icon: Zap,
      name: 'Categorização Automática',
      description: 'IA classifica suas transações automaticamente'
    },
    {
      icon: TrendingUpIcon,
      name: 'Análise de Tendências',
      description: 'Previsões baseadas no seu histórico financeiro'
    },
    {
      icon: Target,
      name: 'Metas Financeiras',
      description: 'Crie metas e acompanhe seu progresso visualmente'
    },
    {
      icon: Repeat,
      name: 'Despesas Recorrentes',
      description: 'Automação de gastos fixos mensais'
    },
    {
      icon: Bell,
      name: 'Alertas Inteligentes',
      description: 'Avisos de gastos fora do padrão'
    },
    {
      icon: Shield,
      name: 'Backup Seguro',
      description: 'Seus dados protegidos na nuvem'
    },
    {
      icon: Download,
      name: 'Exportação',
      description: 'Exporte dados em CSV ou PDF'
    },
    {
      icon: Brain,
      name: 'IA Financeira',
      description: 'Insights personalizados para economizar mais'
    },
    {
      icon: Code,
      name: 'Integrações',
      description: 'API e integração com Google Planilhas'
    },
    {
      icon: Mail,
      name: 'Suporte',
      description: 'Atendimento por e-mail especializado'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* MODAL DE CONFIRMAÇÃO */}
      {showPlanConfirmation.show && !isPremium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border-2 border-yellow-400 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900">
                <Crown className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Finalizar Assinatura</h3>
              <p className="text-slate-300">
                Você será redirecionado para o checkout seguro da{' '}
                <span className="text-yellow-400 font-semibold">Kiwify</span> para
                concluir sua assinatura do <strong>MindCash Plus</strong>.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={hidePlanConfirmationModal}
                className="flex-1 rounded-2xl bg-slate-700 py-3 font-semibold text-slate-300 transition hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleRedirectToCheckout}
                className="flex-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 py-3 font-bold text-slate-900 transition hover:from-yellow-500 hover:to-yellow-700"
              >
                Ir para pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-slate-400 hover:text-yellow-400 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>

            <div className="flex items-center gap-4">
              {isPremium && (
                <div className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-bold">
                  <Check className="h-4 w-4" />
                  Plano Ativo
                </div>
              )}
              <span className="text-sm text-slate-400">
                Olá, {user?.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* HERO */}
        <div className="mb-14 text-center">
          <div className="flex justify-center items-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              MindCash Plus
            </h1>
            <Sparkles className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="mx-auto max-w-3xl text-lg text-slate-300">
            O plano completo para você assumir o controle total da sua vida
            financeira.
          </p>
        </div>

        {/* TRIAL */}
        {user?.plan === 'trial' && trialInfo && (
          <div className="mb-12 rounded-2xl border border-blue-700/50 bg-blue-900/20 p-6 text-center">
            <p className="text-blue-300">
              Teste gratuito ativo — restam{' '}
              <strong>{trialInfo.remainingDays} dias</strong>
            </p>
          </div>
        )}

        {/* CARD PRINCIPAL */}
        <div className="mx-auto mb-16 max-w-4xl rounded-3xl border-2 border-yellow-400 bg-slate-800 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900">
              <Crown className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-bold mb-2">MindCash Plus</h2>
            <div className="mb-4 flex justify-center items-baseline gap-2">
              <span className="text-5xl font-bold text-yellow-400">
                R$ 49,90
              </span>
              <span className="text-slate-400">/mês</span>
            </div>
          </div>

          <div className="mb-10 text-center">
            <button
              onClick={handleSubscribeClick}
              disabled={isPremium}
              className={`w-full max-w-md rounded-2xl py-4 text-lg font-bold transition mx-auto
                ${
                  isPremium
                    ? 'cursor-not-allowed bg-green-600 text-white'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700'
                }`}
            >
              {isPremium ? 'Plano Ativo' : 'Assinar MindCash Plus'}
            </button>
          </div>

          {/* FEATURES */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mindCashPlusFeatures.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl bg-slate-700/30 p-4 flex gap-3"
              >
                <feature.icon className="h-5 w-5 text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-semibold">{feature.name}</h4>
                  <p className="text-sm text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GARANTIA */}
        <div className="rounded-2xl border border-slate-600 bg-slate-800 p-8 text-center">
          <h3 className="text-xl font-bold mb-3">
            Garantia de 30 dias
          </h3>
          <p className="text-slate-300">
            Se não ficar satisfeito, devolvemos 100% do seu dinheiro.
          </p>
        </div>
      </main>
    </div>
  );
      }
