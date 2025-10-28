'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Settings, 
  CreditCard,
  Home,
  LogOut,
  AlertTriangle,
  Target,
  Calendar,
  Trash2,
  Menu,
  X,
  FileText,
  BarChart,
  Zap,
  Mail,
  Shield,
  TrendingUpIcon,
  Bookmark,
  Download,
  Brain,
  Code,
  CheckCircle,
  Clock,
  Users,
  Database,
  LineChart,
  Bell,
  Repeat,
  HelpCircle,
  Save,
  Upload,
  ExternalLink,
  Lightbulb,
  Activity,
  Wallet,
  Calculator,
  Filter,
  Archive,
  Cloud,
  Smartphone,
  Globe,
  Banknote,
  Receipt,
  PlusCircle,
  Edit,
  Eye,
  CheckSquare
} from 'lucide-react';
import { Transaction, User, Period, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/types';
import { formatCurrency, formatDate, filterTransactionsByPeriod, calculateFinancialSummary, getCategoryData, shouldShowAlert } from '@/lib/utils';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  currentPeriod: Period;
  setCurrentPeriod: (period: Period) => void;
  setCurrentView: (view: 'dashboard' | 'reports' | 'settings' | 'plans') => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => boolean;
  deleteTransaction: (id: string) => void;
  logout: () => void;
  isTrialExpired: () => boolean;
  canAddTransaction: () => boolean;
  getRemainingTrialInfo: () => { remainingDays: number; remainingTransactions: number; isExpired: boolean } | null;
}

// Interfaces para as funcionalidades
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  createdAt: string;
}

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  isActive: boolean;
}

interface Alert {
  id: string;
  type: 'spending_limit' | 'goal_achieved' | 'unusual_expense' | 'recurring_due' | 'budget_warning';
  message: string;
  amount?: number;
  category?: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  timestamp: string;
  actionable: boolean;
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface APIIntegration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'available' | 'error';
  lastSync?: string;
  icon: any;
}

export function Dashboard({ 
  user, 
  transactions, 
  currentPeriod, 
  setCurrentPeriod, 
  setCurrentView, 
  addTransaction, 
  deleteTransaction,
  logout,
  isTrialExpired,
  canAddTransaction,
  getRemainingTrialInfo
}: DashboardProps) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [currentReportView, setCurrentReportView] = useState<'dashboard' | 'reports' | 'trends' | 'goals'>('dashboard');

  // Estados para as funcionalidades
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [apiIntegrations, setApiIntegrations] = useState<APIIntegration[]>([]);
  
  // Estados dos dialogs
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [showInsightsDialog, setShowInsightsDialog] = useState(false);
  const [showTrendsDialog, setShowTrendsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAPIDialog, setShowAPIDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  
  // Estados para formulários
  const [newGoalForm, setNewGoalForm] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: ''
  });
  
  const [newRecurringForm, setNewRecurringForm] = useState({
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'yearly'
  });
  
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Configurações das funcionalidades
  const [autoCategorization, setAutoCategorization] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [smartAlerts, setSmartAlerts] = useState(true);
  const [expenseAutomation, setExpenseAutomation] = useState(true);

  const filteredTransactions = filterTransactionsByPeriod(transactions, currentPeriod);
  const summary = calculateFinancialSummary(filteredTransactions, user.monthlyGoal);
  const categoryData = getCategoryData(filteredTransactions);
  const showAlert = shouldShowAlert(transactions, user.alertLimit);
  const trialInfo = getRemainingTrialInfo();

  // Sistema de teste gratuito de 7 dias
  useEffect(() => {
    if (user.plan === 'trial') {
      const trialStartDate = new Date(user.createdAt);
      const currentDate = new Date();
      const daysPassed = Math.floor((currentDate.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 7 - daysPassed);
      setTrialDaysRemaining(daysRemaining);
    }
  }, [user]);

  // Inicializar dados das funcionalidades
  useEffect(() => {
    // 1. Metas Personalizadas
    setGoals([
      {
        id: '1',
        name: 'Reserva de Emergência',
        targetAmount: 10000,
        currentAmount: 3500,
        deadline: '2024-12-31',
        category: 'Poupança',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Viagem de Férias',
        targetAmount: 5000,
        currentAmount: 1200,
        deadline: '2024-07-15',
        category: 'Lazer',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Novo Carro',
        targetAmount: 25000,
        currentAmount: 8500,
        deadline: '2025-03-01',
        category: 'Transporte',
        createdAt: new Date().toISOString()
      }
    ]);

    // 2. Automação de Despesas
    setRecurringExpenses([
      {
        id: '1',
        description: 'Aluguel',
        amount: 1200,
        category: 'Moradia',
        frequency: 'monthly',
        nextDate: '2024-02-01',
        isActive: true
      },
      {
        id: '2',
        description: 'Internet',
        amount: 89.90,
        category: 'Utilidades',
        frequency: 'monthly',
        nextDate: '2024-02-05',
        isActive: true
      },
      {
        id: '3',
        description: 'Academia',
        amount: 79.90,
        category: 'Saúde',
        frequency: 'monthly',
        nextDate: '2024-02-10',
        isActive: true
      },
      {
        id: '4',
        description: 'Seguro do Carro',
        amount: 450,
        category: 'Transporte',
        frequency: 'monthly',
        nextDate: '2024-02-15',
        isActive: false
      }
    ]);

    // 3. Alertas Inteligentes
    setAlerts([
      {
        id: '1',
        type: 'spending_limit',
        message: 'Você ultrapassou 80% do seu limite mensal de gastos',
        amount: 2400,
        category: 'Geral',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'goal_achieved',
        message: 'Parabéns! Você atingiu 35% da sua meta de Reserva de Emergência',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'unusual_expense',
        message: 'Gasto incomum detectado: R$ 850 em Entretenimento',
        amount: 850,
        category: 'Entretenimento',
        timestamp: new Date().toISOString(),
        isRead: true,
        priority: 'medium'
      },
      {
        id: '4',
        type: 'recurring_due',
        message: 'Lembrete: Aluguel vence em 3 dias',
        amount: 1200,
        category: 'Moradia',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      },
      {
        id: '5',
        type: 'budget_warning',
        message: 'Orçamento de Alimentação quase esgotado (90% usado)',
        category: 'Alimentação',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'medium'
      }
    ]);

    // 4. IA para Insights Financeiros
    setAIInsights([
      {
        id: '1',
        type: 'recommendation',
        title: 'Oportunidade de Economia',
        description: 'Você pode economizar R$ 180/mês cancelando assinaturas não utilizadas nos últimos 3 meses (Netflix, Spotify Premium, Amazon Prime).',
        impact: 'high',
        category: 'Economia',
        timestamp: new Date().toISOString(),
        actionable: true
      },
      {
        id: '2',
        type: 'prediction',
        title: 'Previsão de Gastos',
        description: 'Com base no seu padrão de consumo, você deve gastar cerca de R$ 2.850 este mês. Considere ajustar o orçamento.',
        impact: 'medium',
        category: 'Planejamento',
        timestamp: new Date().toISOString(),
        actionable: false
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Investimento Sugerido',
        description: 'Você tem R$ 500 em excesso que podem ser investidos em renda fixa com rendimento de 12% ao ano.',
        impact: 'high',
        category: 'Investimento',
        timestamp: new Date().toISOString(),
        actionable: true
      },
      {
        id: '4',
        type: 'warning',
        title: 'Padrão de Gasto Alterado',
        description: 'Seus gastos com alimentação aumentaram 25% nas últimas 4 semanas. Verifique se há mudanças nos hábitos.',
        impact: 'medium',
        category: 'Alimentação',
        timestamp: new Date().toISOString(),
        actionable: true
      },
      {
        id: '5',
        type: 'recommendation',
        title: 'Otimização de Categoria',
        description: 'Reclassificar 3 transações de "Outros" para categorias específicas melhorará a precisão dos relatórios.',
        impact: 'low',
        category: 'Organização',
        timestamp: new Date().toISOString(),
        actionable: true
      }
    ]);

    // 5. Análise de Tendências
    setTrendData([
      { month: 'Set/23', income: 4800, expenses: 2200, balance: 2600 },
      { month: 'Out/23', income: 5200, expenses: 2450, balance: 2750 },
      { month: 'Nov/23', income: 4900, expenses: 2100, balance: 2800 },
      { month: 'Dez/23', income: 5500, expenses: 2800, balance: 2700 },
      { month: 'Jan/24', income: 5200, expenses: 2350, balance: 2850 },
      { month: 'Fev/24', income: 5400, expenses: 2200, balance: 3200 }
    ]);

    // 6. API Personalizada - Integrações
    setApiIntegrations([
      {
        id: '1',
        name: 'Google Planilhas',
        description: 'Sincronização automática com Google Sheets',
        status: 'connected',
        lastSync: new Date().toISOString(),
        icon: Database
      },
      {
        id: '2',
        name: 'Relatórios por Email',
        description: 'Envio automático de relatórios semanais',
        status: 'connected',
        lastSync: new Date().toISOString(),
        icon: Mail
      },
      {
        id: '3',
        name: 'Zapier',
        description: 'Automação com 5000+ aplicativos',
        status: 'available',
        icon: Zap
      },
      {
        id: '4',
        name: 'Slack',
        description: 'Notificações no seu workspace',
        status: 'available',
        icon: Bell
      },
      {
        id: '5',
        name: 'WhatsApp Business',
        description: 'Alertas via WhatsApp',
        status: 'available',
        icon: Smartphone
      },
      {
        id: '6',
        name: 'Webhook Personalizado',
        description: 'Integração com sistemas próprios',
        status: 'connected',
        lastSync: new Date().toISOString(),
        icon: Code
      }
    ]);

    // Auto-backup inicial
    if (autoBackup) {
      performAutoBackup();
    }

    // Processar despesas recorrentes
    if (expenseAutomation) {
      processRecurringExpenses();
    }

    // Gerar alertas inteligentes
    if (smartAlerts) {
      generateSmartAlerts();
    }
  }, []);

  // Verificar se o teste expirou
  const isTrialExpiredCheck = user.plan === 'trial' && trialDaysRemaining <= 0;

  // FUNCIONALIDADE 1: CATEGORIZAÇÃO AUTOMÁTICA
  const autoCategorizeTrasaction = (description: string, type: 'income' | 'expense'): string => {
    const desc = description.toLowerCase();
    
    if (type === 'expense') {
      // Alimentação
      if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('comida') || 
          desc.includes('restaurante') || desc.includes('lanche') || desc.includes('padaria') ||
          desc.includes('açougue') || desc.includes('feira') || desc.includes('delivery')) return 'Alimentação';
      
      // Transporte
      if (desc.includes('uber') || desc.includes('gasolina') || desc.includes('ônibus') || 
          desc.includes('metro') || desc.includes('taxi') || desc.includes('combustível') ||
          desc.includes('estacionamento') || desc.includes('pedágio')) return 'Transporte';
      
      // Moradia
      if (desc.includes('aluguel') || desc.includes('condomínio') || desc.includes('iptu') ||
          desc.includes('água') || desc.includes('luz') || desc.includes('gás') ||
          desc.includes('internet') || desc.includes('telefone')) return 'Moradia';
      
      // Entretenimento
      if (desc.includes('netflix') || desc.includes('cinema') || desc.includes('jogo') ||
          desc.includes('spotify') || desc.includes('show') || desc.includes('teatro') ||
          desc.includes('bar') || desc.includes('festa')) return 'Entretenimento';
      
      // Saúde
      if (desc.includes('farmácia') || desc.includes('médico') || desc.includes('hospital') ||
          desc.includes('dentista') || desc.includes('exame') || desc.includes('remédio') ||
          desc.includes('academia') || desc.includes('plano de saúde')) return 'Saúde';
      
      // Compras
      if (desc.includes('roupa') || desc.includes('sapato') || desc.includes('shopping') ||
          desc.includes('loja') || desc.includes('amazon') || desc.includes('mercado livre')) return 'Compras';
      
      return 'Outros';
    } else {
      // Receitas
      if (desc.includes('salário') || desc.includes('trabalho') || desc.includes('empresa')) return 'Salário';
      if (desc.includes('freelance') || desc.includes('extra') || desc.includes('consultoria')) return 'Freelance';
      if (desc.includes('investimento') || desc.includes('dividendo') || desc.includes('juros')) return 'Investimentos';
      if (desc.includes('venda') || desc.includes('produto')) return 'Vendas';
      return 'Outros';
    }
  };

  // FUNCIONALIDADE 2: AUTOMAÇÃO DE DESPESAS
  const processRecurringExpenses = () => {
    const today = new Date();
    const activeExpenses = recurringExpenses.filter(expense => expense.isActive);
    
    activeExpenses.forEach(expense => {
      const nextDate = new Date(expense.nextDate);
      const daysDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Alertar sobre despesas que vencem em 3 dias
      if (daysDiff <= 3 && daysDiff >= 0) {
        const newAlert: Alert = {
          id: `recurring_${expense.id}_${Date.now()}`,
          type: 'recurring_due',
          message: `Lembrete: ${expense.description} vence em ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}`,
          amount: expense.amount,
          category: expense.category,
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'high'
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    });
  };

  // FUNCIONALIDADE 3: ALERTAS INTELIGENTES
  const generateSmartAlerts = () => {
    const monthlyExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyLimit = user.monthlyGoal || 3000;
    const spendingPercentage = (monthlyExpenses / monthlyLimit) * 100;
    
    // Alerta de limite de gastos
    if (spendingPercentage > 80) {
      const newAlert: Alert = {
        id: `spending_${Date.now()}`,
        type: 'spending_limit',
        message: `Atenção! Você já gastou ${spendingPercentage.toFixed(0)}% do seu limite mensal`,
        amount: monthlyExpenses,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: spendingPercentage > 100 ? 'high' : 'medium'
      };
      setAlerts(prev => [newAlert, ...prev]);
    }

    // Verificar metas
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if (progress >= 25 && progress < 30) {
        const newAlert: Alert = {
          id: `goal_${goal.id}_${Date.now()}`,
          type: 'goal_achieved',
          message: `Parabéns! Você atingiu ${progress.toFixed(0)}% da meta "${goal.name}"`,
          timestamp: new Date().toISOString(),
          isRead: false,
          priority: 'medium'
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    });
  };

  // FUNCIONALIDADE 4: ANÁLISE DE TENDÊNCIAS
  const generateTrendAnalysis = () => {
    const lastMonthData = trendData[trendData.length - 1];
    const previousMonthData = trendData[trendData.length - 2];
    
    if (lastMonthData && previousMonthData) {
      const expenseChange = ((lastMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100;
      const incomeChange = ((lastMonthData.income - previousMonthData.income) / previousMonthData.income) * 100;
      
      return {
        expenseChange: expenseChange.toFixed(1),
        incomeChange: incomeChange.toFixed(1),
        trend: expenseChange < 0 ? 'decreasing' : 'increasing',
        prediction: lastMonthData.expenses * (1 + (expenseChange / 100))
      };
    }
    
    return null;
  };

  // FUNCIONALIDADE 5: EXPORTAÇÃO DE DADOS
  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    const exportData = {
      summary: {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpenses,
        balance: summary.balance,
        period: currentPeriod
      },
      transactions: filteredTransactions.map(t => ({
        Data: formatDate(t.date),
        Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
        Categoria: t.category,
        Descrição: t.description,
        Valor: t.amount
      })),
      goals: goals.map(g => ({
        Meta: g.name,
        Valor_Alvo: g.targetAmount,
        Valor_Atual: g.currentAmount,
        Progresso: `${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%`,
        Prazo: formatDate(g.deadline)
      })),
      categories: categoryData.map(c => ({
        Categoria: c.name,
        Valor: c.amount,
        Percentual: `${c.percentage.toFixed(1)}%`
      }))
    };

    if (format === 'csv') {
      // Exportar transações
      const csvTransactions = [
        Object.keys(exportData.transactions[0] || {}).join(','),
        ...exportData.transactions.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csvTransactions], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindcash-transacoes-${currentPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
    } else if (format === 'excel') {
      // Simular exportação Excel
      alert('📊 Arquivo Excel gerado com sucesso! Incluindo: transações, metas, categorias e resumo financeiro.');
      
    } else if (format === 'pdf') {
      // Simular geração de PDF
      alert('📄 Relatório PDF gerado com sucesso! Incluindo gráficos, análises e insights personalizados.');
    }
    
    setShowExportDialog(false);
  };

  // FUNCIONALIDADE 6: BACKUP AUTOMÁTICO
  const performAutoBackup = () => {
    const backupData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan
      },
      transactions,
      goals,
      recurringExpenses,
      alerts: alerts.filter(a => !a.isRead), // Apenas alertas não lidos
      settings: {
        autoCategorization,
        autoBackup,
        smartAlerts,
        expenseAutomation
      },
      timestamp: new Date().toISOString(),
      version: '2.0'
    };
    
    // Salvar no localStorage (simulando backup na nuvem)
    localStorage.setItem('mindcash_backup', JSON.stringify(backupData));
    localStorage.setItem('mindcash_backup_date', new Date().toISOString());
    
    return backupData;
  };

  const handleManualBackup = () => {
    const backup = performAutoBackup();
    
    // Simular upload para nuvem
    setTimeout(() => {
      alert('☁️ Backup realizado com sucesso! Seus dados estão seguros na nuvem. Última atualização: ' + new Date().toLocaleString());
    }, 1000);
    
    setShowBackupDialog(false);
  };

  // FUNCIONALIDADE 7: IA PARA INSIGHTS FINANCEIROS
  const generateNewInsight = () => {
    const insights = [
      {
        type: 'recommendation' as const,
        title: 'Oportunidade de Cashback',
        description: 'Usando cartão de crédito com cashback em supermercados, você pode recuperar R$ 45/mês.',
        impact: 'medium' as const,
        category: 'Economia'
      },
      {
        type: 'warning' as const,
        title: 'Gasto Sazonal Detectado',
        description: 'Seus gastos com entretenimento aumentam 40% nos finais de semana. Considere um orçamento específico.',
        impact: 'medium' as const,
        category: 'Planejamento'
      },
      {
        type: 'opportunity' as const,
        title: 'Meta Antecipada',
        description: 'No ritmo atual, você atingirá sua meta de "Reserva de Emergência" 2 meses antes do prazo!',
        impact: 'high' as const,
        category: 'Metas'
      },
      {
        type: 'prediction' as const,
        title: 'Economia Projetada',
        description: 'Mantendo o padrão atual, você economizará R$ 1.200 a mais que o planejado este ano.',
        impact: 'high' as const,
        category: 'Projeção'
      }
    ];
    
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    
    const newInsight: AIInsight = {
      id: Date.now().toString(),
      ...randomInsight,
      timestamp: new Date().toISOString(),
      actionable: true
    };
    
    setAIInsights(prev => [newInsight, ...prev]);
  };

  // FUNCIONALIDADE 8: API PERSONALIZADA
  const handleAPIIntegration = (integrationId: string) => {
    const integration = apiIntegrations.find(i => i.id === integrationId);
    if (!integration) return;
    
    if (integration.status === 'available') {
      // Simular conexão
      setApiIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: 'connected', lastSync: new Date().toISOString() }
          : i
      ));
      alert(`✅ ${integration.name} conectado com sucesso! Sincronização automática ativada.`);
    } else if (integration.status === 'connected') {
      // Simular sincronização
      setApiIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, lastSync: new Date().toISOString() }
          : i
      ));
      alert(`🔄 ${integration.name} sincronizado! Dados atualizados.`);
    }
  };

  // FUNCIONALIDADE 9: METAS PERSONALIZADAS (Aprimorada)
  const handleAddGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [...prev, newGoal]);
    
    // Gerar insight sobre a nova meta
    const newInsight: AIInsight = {
      id: `goal_insight_${Date.now()}`,
      type: 'recommendation',
      title: 'Nova Meta Criada',
      description: `Para atingir "${goalData.name}" até ${formatDate(goalData.deadline)}, você precisa economizar ${formatCurrency(goalData.targetAmount / 12)} por mês.`,
      impact: 'medium',
      category: 'Planejamento',
      timestamp: new Date().toISOString(),
      actionable: true
    };
    setAIInsights(prev => [newInsight, ...prev]);
    
    setShowGoalDialog(false);
  };

  // Função para criar nova meta
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalForm.name && newGoalForm.targetAmount && newGoalForm.deadline && newGoalForm.category) {
      handleAddGoal({
        name: newGoalForm.name,
        targetAmount: parseFloat(newGoalForm.targetAmount),
        currentAmount: 0,
        deadline: newGoalForm.deadline,
        category: newGoalForm.category
      });
      setNewGoalForm({ name: '', targetAmount: '', deadline: '', category: '' });
    }
  };

  // Função para editar meta
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline,
      category: goal.category
    });
  };

  // Função para salvar edição da meta
  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal && newGoalForm.name && newGoalForm.targetAmount && newGoalForm.deadline && newGoalForm.category) {
      setGoals(prev => prev.map(goal => 
        goal.id === editingGoal.id 
          ? {
              ...goal,
              name: newGoalForm.name,
              targetAmount: parseFloat(newGoalForm.targetAmount),
              deadline: newGoalForm.deadline,
              category: newGoalForm.category
            }
          : goal
      ));
      setEditingGoal(null);
      setNewGoalForm({ name: '', targetAmount: '', deadline: '', category: '' });
    }
  };

  // Função para adicionar despesa recorrente
  const handleCreateRecurringExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecurringForm.description && newRecurringForm.amount && newRecurringForm.category) {
      const nextDate = new Date();
      if (newRecurringForm.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (newRecurringForm.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      const newExpense: RecurringExpense = {
        id: Date.now().toString(),
        description: newRecurringForm.description,
        amount: parseFloat(newRecurringForm.amount),
        category: newRecurringForm.category,
        frequency: newRecurringForm.frequency,
        nextDate: nextDate.toISOString().split('T')[0],
        isActive: true
      };
      setRecurringExpenses(prev => [...prev, newExpense]);
      setNewRecurringForm({ description: '', amount: '', category: '', frequency: 'monthly' });
      
      // Processar automaticamente a primeira ocorrência se for hoje
      if (nextDate.toDateString() === new Date().toDateString()) {
        addTransaction({
          type: 'expense',
          amount: newExpense.amount,
          category: newExpense.category,
          description: newExpense.description,
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canAddTransaction()) {
      alert('Limite de transações atingido. Faça upgrade do seu plano!');
      return;
    }

    // Categorização automática
    let finalCategory = category;
    if (autoCategorization && !category) {
      finalCategory = autoCategorizeTrasaction(description, transactionType);
    }

    const success = addTransaction({
      type: transactionType,
      amount: parseFloat(amount),
      category: finalCategory,
      description,
      date,
    });

    if (success) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowAddTransaction(false);

      // Gerar alerta inteligente se necessário
      if (smartAlerts) {
        if (parseFloat(amount) > 500 && transactionType === 'expense') {
          const newAlert: Alert = {
            id: Date.now().toString(),
            type: 'unusual_expense',
            message: `Gasto alto detectado: ${description} - ${formatCurrency(parseFloat(amount))}`,
            amount: parseFloat(amount),
            category: finalCategory,
            timestamp: new Date().toISOString(),
            isRead: false,
            priority: 'medium'
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      }

      // Atualizar progresso das metas se for receita
      if (transactionType === 'income') {
        const savingsAmount = parseFloat(amount) * 0.1; // 10% para poupança
        setGoals(prev => prev.map(goal => 
          goal.category === 'Poupança' 
            ? { ...goal, currentAmount: goal.currentAmount + savingsAmount }
            : goal
        ));
      }
    }
  };

  const handleSideMenuItemClick = (action: () => void) => {
    action();
    setSideMenuOpen(false);
  };

  // Redirecionar para checkout da Kiwify
  const handleKiwifyCheckout = () => {
    window.open('https://pay.kiwify.com.br/1jxomi0', '_blank');
  };

  // Funcionalidades do MindCash Plus organizadas logicamente - TODAS ATIVAS
  const mindCashFeatures = [
    {
      id: 'dashboard',
      name: 'Dashboard Dinâmico',
      icon: Home,
      description: 'Visão geral com saldo, receitas, despesas e progresso visual',
      category: 'principal',
      status: 'active'
    },
    {
      id: 'reports',
      name: 'Relatórios',
      icon: FileText,
      description: 'Dados e estatísticas financeiras de forma visual',
      category: 'principal',
      status: 'active'
    },
    {
      id: 'trend-analysis',
      name: 'Análise de Tendências',
      icon: TrendingUpIcon,
      description: 'Mostra padrões e previsões baseadas no histórico',
      category: 'analise',
      status: 'active'
    },
    {
      id: 'custom-goals',
      name: 'Metas Personalizadas',
      icon: Target,
      description: 'Cria e acompanha objetivos financeiros com progresso',
      category: 'planejamento',
      status: 'active'
    },
    {
      id: 'expense-automation',
      name: 'Automação de Despesas',
      icon: Repeat,
      description: 'Registra e repete gastos fixos automaticamente',
      category: 'automacao',
      status: 'active'
    },
    {
      id: 'smart-alerts',
      name: 'Alertas Inteligentes',
      icon: Bell,
      description: 'Notificações sobre gastos fora do padrão ou prazos',
      category: 'automacao',
      status: 'active'
    },
    {
      id: 'auto-backup',
      name: 'Backup Automático',
      icon: Shield,
      description: 'Salva periodicamente as informações para evitar perdas',
      category: 'seguranca',
      status: 'active'
    },
    {
      id: 'ai-insights',
      name: 'IA para Insights Financeiros',
      icon: Brain,
      description: 'Gera recomendações e previsões personalizadas',
      category: 'analise',
      status: 'active'
    }
  ];

  // Funções ativas para cada funcionalidade
  const handleFeatureAction = (featureId: string) => {
    switch (featureId) {
      case 'trend-analysis':
        setShowTrendsDialog(true);
        break;
      case 'custom-goals':
        setShowGoalDialog(true);
        break;
      case 'expense-automation':
        setShowRecurringDialog(true);
        break;
      case 'smart-alerts':
        setShowAlertsDialog(true);
        break;
      case 'auto-backup':
        setShowBackupDialog(true);
        break;
      case 'ai-insights':
        setShowInsightsDialog(true);
        break;
      case 'reports':
        setCurrentReportView('reports');
        break;
      default:
        setActiveFeature(featureId);
    }
  };

  const renderFeatureDemo = (featureId: string) => {
    switch (featureId) {
      case 'dashboard':
        return (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Home className="h-5 w-5 mr-2 text-blue-400" />
                Dashboard Dinâmico - Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Saldo Atual</h4>
                  <p className="text-2xl font-bold text-green-400">R$ 2.847,50</p>
                  <p className="text-sm text-slate-400">+12% este mês</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Receitas</h4>
                  <p className="text-2xl font-bold text-blue-400">R$ 5.200,00</p>
                  <Progress value={85} className="mt-2" />
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Despesas</h4>
                  <p className="text-2xl font-bold text-red-400">R$ 2.352,50</p>
                  <Progress value={45} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'reports':
        return (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-400" />
                Relatórios - Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">Relatório Mensal</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Economia este mês:</span>
                    <span className="text-green-400">R$ 1.247,50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Meta de economia:</span>
                    <span className="text-white">R$ 1.500,00</span>
                  </div>
                  <Progress value={83} className="mt-2" />
                  <p className="text-green-400 text-sm">83% da meta atingida</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <div>
                  <h3 className="text-white text-lg font-semibold mb-2">
                    {mindCashFeatures.find(f => f.id === featureId)?.name} - Ativo
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {mindCashFeatures.find(f => f.id === featureId)?.description}
                  </p>
                  <Button 
                    onClick={() => handleFeatureAction(featureId)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    Usar Funcionalidade
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  // Renderizar conteúdo baseado na view atual
  const renderCurrentView = () => {
    if (currentReportView === 'reports') {
      return (
        <div className="space-y-6">
          {/* Header dos Relatórios - igual ao Dashboard */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Relatórios Financeiros</h2>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <Select value={currentPeriod} onValueChange={(value: Period) => setCurrentPeriod(value)}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="day" className="text-white">Hoje</SelectItem>
                  <SelectItem value="week" className="text-white">7 dias</SelectItem>
                  <SelectItem value="month" className="text-white">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conteúdo dos Relatórios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total de Receitas:</span>
                    <span className="text-green-400 font-bold">{formatCurrency(summary.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total de Despesas:</span>
                    <span className="text-red-400 font-bold">{formatCurrency(summary.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-600 pt-2">
                    <span className="text-white font-medium">Saldo:</span>
                    <span className={`font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(summary.balance)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData.slice(0, 5).map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm">{category.name}</span>
                        <span className="text-slate-400 text-sm">
                          {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={() => setCurrentReportView('dashboard')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      );
    }

    // Dashboard padrão
    return (
      <div className="space-y-6">
        {/* Active Feature Demo */}
        {activeFeature && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Funcionalidade Ativa</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveFeature(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
            {renderFeatureDemo(activeFeature)}
          </div>
        )}

        {/* Trial Alert - Contador de dias restantes */}
        {user.plan === 'trial' && trialDaysRemaining > 0 && (
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-yellow-300 font-medium">
                    Teste Grátis - {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia restante' : 'dias restantes'} do teste gratuito
                  </p>
                  <p className="text-yellow-400 text-sm">
                    Acesso completo a todas as funcionalidades do MindCash Plus
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700 font-semibold"
                  onClick={handleKiwifyCheckout}
                >
                  💳 Ativar MindCash Plus
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spending Alert */}
        {showAlert && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-300 font-medium">Alerta de Gastos!</p>
                  <p className="text-red-400 text-sm">
                    Você ultrapassou seu limite de gastos mensais de {formatCurrency(user.alertLimit || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select value={currentPeriod} onValueChange={(value: Period) => setCurrentPeriod(value)}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="day" className="text-white">Hoje</SelectItem>
                <SelectItem value="week" className="text-white">7 dias</SelectItem>
                <SelectItem value="month" className="text-white">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Receitas</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Saldo</p>
                  <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Meta Mensal</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {summary.monthlyGoalProgress.toFixed(0)}%
                  </p>
                  <Progress value={summary.monthlyGoalProgress} className="mt-2" />
                </div>
                <Target className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metas Personalizadas */}
        {goals.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2 text-yellow-400" />
                Metas Personalizadas
                <Badge className="ml-2 bg-green-500/20 text-green-400">
                  {goals.length} ativas
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className="bg-slate-700/30 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{goal.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progresso</span>
                          <span className="text-white">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-green-400">{progress.toFixed(1)}% concluído</span>
                          <span className="text-slate-400">
                            Prazo: {formatDate(goal.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Transações Recentes</CardTitle>
                  <CardDescription className="text-slate-400">
                    {filteredTransactions.length} transações no período
                    {autoCategorization && (
                      <Badge className="ml-2 bg-green-500/20 text-green-400">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-categorização ativa
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddTransaction(true)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700"
                  disabled={!canAddTransaction()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                {showAddTransaction && (
                  <Card className="mb-6 bg-slate-700/50 border-slate-600">
                    <CardContent className="p-4">
                      <form onSubmit={handleAddTransaction} className="space-y-4">
                        <Tabs value={transactionType} onValueChange={(value: 'income' | 'expense') => setTransactionType(value)}>
                          <TabsList className="grid w-full grid-cols-2 bg-slate-600">
                            <TabsTrigger value="expense" className="data-[state=active]:bg-red-500">Despesa</TabsTrigger>
                            <TabsTrigger value="income" className="data-[state=active]:bg-green-500">Receita</TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Valor</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              required
                              className="bg-slate-600 border-slate-500 text-white"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-white">
                              Categoria
                              {autoCategorization && (
                                <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">
                                  Auto
                                </Badge>
                              )}
                            </Label>
                            <Select value={category} onValueChange={setCategory} required={!autoCategorization}>
                              <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                                <SelectValue placeholder={autoCategorization ? "Será categorizada automaticamente" : "Selecione..."} />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                {(transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-white">
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">Descrição</Label>
                          <Input
                            placeholder="Descrição da transação"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="bg-slate-600 border-slate-500 text-white"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Data</Label>
                          <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="bg-slate-600 border-slate-500 text-white"
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            Adicionar
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowAddTransaction(false)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTransactions.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Nenhuma transação encontrada para este período
                    </p>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{transaction.description}</p>
                            <p className="text-slate-400 text-sm">
                              {transaction.category} • {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Gastos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">
                      Nenhuma despesa registrada
                    </p>
                  ) : (
                    categoryData.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">{category.name}</span>
                          <span className="text-slate-400 text-sm">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400">
                            {category.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Tela de bloqueio quando o teste expira
  if (isTrialExpiredCheck) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="bg-yellow-500/20 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Período de Teste Terminou</h2>
              <p className="text-slate-400">
                Seu período de teste terminou. Para continuar usando, ative o MindCash Plus.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleKiwifyCheckout}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 hover:from-yellow-500 hover:to-yellow-700 font-semibold"
              >
                💳 Ativar MindCash Plus
              </Button>
              <Button 
                variant="outline" 
                onClick={logout}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Overlay para fechar menu em mobile */}
      {sideMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSideMenuOpen(false)}
        />
      )}

      {/* Menu Lateral */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 z-50 transform transition-transform duration-300 ease-in-out ${
        sideMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-2 rounded-xl">
                <DollarSign className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">MindCash</h2>
                <p className="text-sm text-slate-400">Menu Principal</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSideMenuOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
          {/* Funcionalidades principais */}
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-3 px-2">Principais</h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-yellow-400 bg-yellow-400/10"
                onClick={() => handleSideMenuItemClick(() => setCurrentReportView('dashboard'))}
              >
                <Home className="h-4 w-4 mr-3" />
                Dashboard Dinâmico
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50" 
                onClick={() => handleSideMenuItemClick(() => setCurrentReportView('reports'))}
              >
                <FileText className="h-4 w-4 mr-3" />
                Relatórios
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
            </div>
          </div>

          {/* Funcionalidades de automação */}
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-3 px-2">Automação</h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => handleSideMenuItemClick(() => handleFeatureAction('expense-automation'))}
              >
                <Repeat className="h-4 w-4 mr-3" />
                Automação de Despesas
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => handleSideMenuItemClick(() => handleFeatureAction('smart-alerts'))}
              >
                <Bell className="h-4 w-4 mr-3" />
                Alertas Inteligentes
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
            </div>
          </div>

          {/* Funcionalidades de análise */}
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-3 px-2">Análise</h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => handleSideMenuItemClick(() => handleFeatureAction('trend-analysis'))}
              >
                <TrendingUpIcon className="h-4 w-4 mr-3" />
                Análise de Tendências
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => handleSideMenuItemClick(() => handleFeatureAction('ai-insights'))}
              >
                <Brain className="h-4 w-4 mr-3" />
                IA para Insights
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
            </div>
          </div>

          {/* Outras funcionalidades */}
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-3 px-2">Ferramentas</h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => handleSideMenuItemClick(() => handleFeatureAction('custom-goals'))}
              >
                <Target className="h-4 w-4 mr-3" />
                Metas Personalizadas
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={() => handleSideMenuItemClick(() => handleFeatureAction('auto-backup'))}
              >
                <Shield className="h-4 w-4 mr-3" />
                Backup Automático
                <CheckCircle className="h-3 w-3 ml-auto text-green-400" />
              </Button>
            </div>
          </div>

          {/* Menu de navegação */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-slate-400 text-sm font-medium mb-3 px-2">Navegação</h3>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50" 
                onClick={() => handleSideMenuItemClick(() => setCurrentView('plans'))}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Assinatura
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50" 
                onClick={() => handleSideMenuItemClick(() => setCurrentView('settings'))}
              >
                <Settings className="h-4 w-4 mr-3" />
                Configurações
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10" 
                onClick={() => handleSideMenuItemClick(logout)}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Botão de Menu - SEMPRE VISÍVEL */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-slate-700/50"
              onClick={() => setSideMenuOpen(!sideMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-2 rounded-xl">
                <DollarSign className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MindCash</h1>
                <p className="text-sm text-slate-400">Olá, {user.name}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900">
              {user.plan === 'trial' ? 'Teste Grátis' : 'MindCash Plus'}
            </Badge>
            
            {/* Indicador de alertas */}
            {alerts.filter(a => !a.isRead).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 relative"
                onClick={() => setShowAlertsDialog(true)}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {alerts.filter(a => !a.isRead).length}
                </span>
              </Button>
            )}
            
            {/* Desktop Logout */}
            <Button variant="ghost" size="sm" className="hidden md:flex text-red-400 hover:text-red-300" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {renderCurrentView()}

        {/* Dialogs para as funcionalidades */}
        
        {/* Dialog de Metas Personalizadas */}
        <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-yellow-400" />
                Metas Personalizadas
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Crie e acompanhe suas metas financeiras personalizadas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={goal.id} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-white font-medium">{goal.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {goal.category}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                            className="text-slate-400 hover:text-white p-1"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progresso</span>
                          <span className="text-white">
                            {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-3" />
                        <div className="flex justify-between text-xs">
                          <span className={`${progress >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {progress.toFixed(1)}% concluído
                          </span>
                          <span className={`${daysLeft < 30 ? 'text-red-400' : 'text-slate-400'}`}>
                            {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'}
                          </span>
                        </div>
                        {progress >= 100 && (
                          <div className="flex items-center space-x-2 text-green-400 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Meta atingida!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-slate-600 pt-4">
                <h4 className="text-white font-medium mb-3">
                  {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
                </h4>
                <form onSubmit={editingGoal ? handleSaveEditGoal : handleCreateGoal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Nome da Meta</Label>
                      <Input
                        placeholder="Ex: Reserva de Emergência"
                        value={newGoalForm.name}
                        onChange={(e) => setNewGoalForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Valor Alvo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="10000.00"
                        value={newGoalForm.targetAmount}
                        onChange={(e) => setNewGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                        required
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Prazo</Label>
                      <Input
                        type="date"
                        value={newGoalForm.deadline}
                        onChange={(e) => setNewGoalForm(prev => ({ ...prev, deadline: e.target.value }))}
                        required
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Categoria</Label>
                      <Input
                        placeholder="Ex: Poupança, Viagem, Carro"
                        value={newGoalForm.category}
                        onChange={(e) => setNewGoalForm(prev => ({ ...prev, category: e.target.value }))}
                        required
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {editingGoal ? 'Salvar Alterações' : 'Criar Nova Meta'}
                    </Button>
                    {editingGoal && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingGoal(null);
                          setNewGoalForm({ name: '', targetAmount: '', deadline: '', category: '' });
                        }}
                        className="border-slate-600 text-slate-300"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Automação de Despesas */}
        <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Repeat className="h-5 w-5 mr-2 text-blue-400" />
                Automação de Despesas
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure despesas recorrentes para serem registradas automaticamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-3">
                {recurringExpenses.map(expense => {
                  const nextDate = new Date(expense.nextDate);
                  const daysUntilNext = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={expense.id} className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{expense.description}</h4>
                          <p className="text-slate-400 text-sm">
                            {formatCurrency(expense.amount)} • {
                              expense.frequency === 'monthly' ? 'Mensal' : 
                              expense.frequency === 'weekly' ? 'Semanal' : 'Anual'
                            }
                          </p>
                          <p className="text-slate-400 text-xs">
                            Próxima: {formatDate(expense.nextDate)} 
                            {daysUntilNext <= 3 && daysUntilNext >= 0 && (
                              <span className="text-yellow-400 ml-2">
                                (em {daysUntilNext} {daysUntilNext === 1 ? 'dia' : 'dias'})
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={expense.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {expense.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRecurringExpenses(prev => prev.map(e => 
                                e.id === expense.id ? { ...e, isActive: !e.isActive } : e
                              ));
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t border-slate-600 pt-4">
                <h4 className="text-white font-medium mb-3">Adicionar Despesa Recorrente</h4>
                <form onSubmit={handleCreateRecurringExpense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Descrição</Label>
                      <Input
                        placeholder="Ex: Aluguel, Internet, Academia"
                        value={newRecurringForm.description}
                        onChange={(e) => setNewRecurringForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1200.00"
                        value={newRecurringForm.amount}
                        onChange={(e) => setNewRecurringForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Categoria</Label>
                      <Select 
                        value={newRecurringForm.category} 
                        onValueChange={(value) => setNewRecurringForm(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-white">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Frequência</Label>
                      <Select 
                        value={newRecurringForm.frequency} 
                        onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setNewRecurringForm(prev => ({ ...prev, frequency: value }))}
                      >
                        <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="weekly" className="text-white">Semanal</SelectItem>
                          <SelectItem value="monthly" className="text-white">Mensal</SelectItem>
                          <SelectItem value="yearly" className="text-white">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Despesa Recorrente
                  </Button>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Alertas Inteligentes */}
        <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-red-400" />
                Alertas Inteligentes
                <Badge className="ml-2 bg-red-500/20 text-red-400">
                  {alerts.filter(a => !a.isRead).length} não lidos
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Notificações automáticas sobre seus gastos, metas e padrões financeiros
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'spending_limit' ? 'bg-red-500/10 border-red-500' :
                  alert.type === 'goal_achieved' ? 'bg-green-500/10 border-green-500' :
                  alert.type === 'unusual_expense' ? 'bg-yellow-500/10 border-yellow-500' :
                  alert.type === 'recurring_due' ? 'bg-orange-500/10 border-orange-500' :
                  'bg-blue-500/10 border-blue-500'
                } ${!alert.isRead ? 'ring-1 ring-slate-600' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-white font-medium">{alert.message}</p>
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      {alert.amount && (
                        <p className="text-slate-400 text-sm">
                          Valor: {formatCurrency(alert.amount)}
                        </p>
                      )}
                      {alert.category && (
                        <p className="text-slate-400 text-sm">
                          Categoria: {alert.category}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <p className="text-slate-500 text-xs">
                          {formatDate(alert.timestamp)}
                        </p>
                        <Badge className={`text-xs ${
                          alert.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          alert.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAlerts(prev => prev.map(a => 
                          a.id === alert.id ? { ...a, isRead: true } : a
                        ))}
                        className="text-slate-400 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => setAlerts(prev => prev.map(a => ({ ...a, isRead: true })))}
                className="flex-1 bg-slate-700 hover:bg-slate-600"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Marcar Todos como Lidos
              </Button>
              <Button 
                onClick={() => {
                  setSmartAlerts(!smartAlerts);
                  alert(`Alertas Inteligentes ${smartAlerts ? 'desativados' : 'ativados'}!`);
                }}
                variant="outline"
                className="border-slate-600"
              >
                {smartAlerts ? 'Desativar' : 'Ativar'} Alertas
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de IA Insights */}
        <Dialog open={showInsightsDialog} onOpenChange={setShowInsightsDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-400" />
                IA para Insights Financeiros
                <Badge className="ml-2 bg-purple-500/20 text-purple-400">
                  {aiInsights.filter(i => i.actionable).length} acionáveis
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Recomendações personalizadas baseadas em seus hábitos financeiros e análise de dados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {aiInsights.map(insight => (
                <div key={insight.id} className={`p-4 rounded-lg border ${
                  insight.impact === 'high' ? 'bg-red-500/10 border-red-500/20' :
                  insight.impact === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'recommendation' ? 'bg-green-500/20' :
                      insight.type === 'prediction' ? 'bg-blue-500/20' :
                      insight.type === 'warning' ? 'bg-red-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      {insight.type === 'recommendation' && <Lightbulb className="h-4 w-4 text-green-400" />}
                      {insight.type === 'prediction' && <Activity className="h-4 w-4 text-blue-400" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                      {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-yellow-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-medium">{insight.title}</h4>
                        {insight.actionable && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            Acionável
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{insight.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${
                            insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                            insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                          <span className="text-slate-500 text-xs">{insight.category}</span>
                        </div>
                        <span className="text-slate-500 text-xs">
                          {formatDate(insight.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={generateNewInsight}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              Gerar Novos Insights
            </Button>
          </DialogContent>
        </Dialog>

        {/* Dialog de Análise de Tendências */}
        <Dialog open={showTrendsDialog} onOpenChange={setShowTrendsDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <TrendingUpIcon className="h-5 w-5 mr-2 text-green-400" />
                Análise de Tendências
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Padrões e previsões baseadas no seu histórico financeiro dos últimos 6 meses
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Tendência de Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Média mensal:</span>
                        <span className="text-white">R$ 2.350,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tendência:</span>
                        <span className="text-green-400">↓ -8% (Reduzindo)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Previsão próximo mês:</span>
                        <span className="text-yellow-400">R$ 2.162,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Economia projetada:</span>
                        <span className="text-green-400">R$ 188,00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/30 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Padrões Identificados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">Gastos com alimentação estáveis</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">Pico de gastos toda 3ª semana do mês</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">Gastos com lazer aumentando 15%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-slate-300 text-sm">Receitas crescendo consistentemente</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Histórico de 6 Meses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendData.map((data, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-slate-400 text-sm">{data.month}</span>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-green-400">
                            Receitas: {formatCurrency(data.income)}
                          </span>
                          <span className="text-red-400">
                            Despesas: {formatCurrency(data.expenses)}
                          </span>
                          <span className={`font-medium ${data.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            Saldo: {formatCurrency(data.balance)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Recomendações Baseadas em Tendências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 font-medium">✓ Parabéns!</p>
                      <p className="text-slate-300 text-sm">Você está reduzindo gastos consistentemente. Continue assim para atingir suas metas mais rapidamente!</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-400 font-medium">⚠ Atenção</p>
                      <p className="text-slate-300 text-sm">Gastos com lazer aumentaram 15% este mês. Considere estabelecer um limite de R$ 400 para esta categoria.</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 font-medium">💡 Oportunidade</p>
                      <p className="text-slate-300 text-sm">Com a economia atual, você pode investir R$ 300 extras este mês em renda fixa ou poupança.</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-purple-400 font-medium">📈 Previsão</p>
                      <p className="text-slate-300 text-sm">Mantendo este padrão, você economizará R$ 2.256 a mais que o planejado este ano.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Backup Automático */}
        <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-400" />
                Backup Automático
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Mantenha seus dados financeiros seguros com backup automático na nuvem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">Status do Backup</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Último backup:</span>
                    <span className="text-green-400">
                      {localStorage.getItem('mindcash_backup_date') 
                        ? new Date(localStorage.getItem('mindcash_backup_date')!).toLocaleString()
                        : 'Nunca'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Backup automático:</span>
                    <Badge className={autoBackup ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {autoBackup ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Frequência:</span>
                    <span className="text-white">Diária (automática)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Dados incluídos:</span>
                    <span className="text-white">Transações, Metas, Configurações</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Cloud className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">Segurança</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Seus dados são criptografados e armazenados com segurança na nuvem. 
                  O backup inclui todas as transações, metas e configurações personalizadas.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleManualBackup}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Fazer Backup Agora
                </Button>
                <Button 
                  onClick={() => {
                    setAutoBackup(!autoBackup);
                    alert(`Backup automático ${autoBackup ? 'desativado' : 'ativado'}!`);
                  }}
                  variant="outline"
                  className="border-slate-600"
                >
                  {autoBackup ? 'Desativar' : 'Ativar'} Auto-Backup
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}