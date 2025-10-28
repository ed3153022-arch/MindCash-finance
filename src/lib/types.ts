export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyGoal?: number;
  alertLimit?: number;
  plan?: 'trial' | 'essencial' | 'pro' | 'premium';
  trialStartDate?: string;
  trialTransactionCount?: number;
}

export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyGoalProgress: number;
}

export interface Plan {
  id: 'essencial' | 'pro' | 'premium';
  name: string;
  price: number;
  features: string[];
  highlight?: boolean;
  icon: string;
}

export type Period = 'day' | 'week' | 'month';

export const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Entretenimento',
  'Compras',
  'Investimentos',
  'Outros'
];

export const INCOME_CATEGORIES = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Outros'
];

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'essencial',
    name: 'Plano Essencial',
    price: 9.90,
    icon: '🪙',
    features: [
      'Até 50 lançamentos mensais',
      'Dashboard básico com saldo e despesas',
      'Relatórios simples e alertas de gastos',
      'Ideal para quem está começando'
    ]
  },
  {
    id: 'pro',
    name: 'Plano Pro',
    price: 19.90,
    icon: '💼',
    highlight: true,
    features: [
      'Lançamentos ilimitados',
      'Dashboard completo com gráficos',
      'Relatórios mensais detalhados',
      'Metas de economia e comparativos',
      'Suporte via chat dentro do app',
      'Melhor custo-benefício'
    ]
  },
  {
    id: 'premium',
    name: 'Plano Premium',
    price: 39.90,
    icon: '👑',
    features: [
      'Tudo do Pro + exportação de dados (CSV)',
      'Relatórios avançados e insights automáticos',
      'Personalização visual (tema dourado completo)',
      'Acesso antecipado a novas funções',
      'Experiência exclusiva e ilimitada'
    ]
  }
];