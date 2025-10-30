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
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Menu
} from 'lucide-react';
import { Transaction, User, Period } from '@/lib/types';
import { formatCurrency, formatDate, filterTransactionsByPeriod, calculateFinancialSummary, getCategoryData } from '@/lib/utils';

interface ReportsProps {
  user: User;
  transactions: Transaction[];
  currentPeriod: Period;
  setCurrentPeriod: (period: Period) => void;
  setCurrentView: (view: 'dashboard' | 'reports' | 'settings' | 'plans') => void;
  logout: () => void;
}

export function Reports({ 
  user, 
  transactions, 
  currentPeriod, 
  setCurrentPeriod, 
  setCurrentView, 
  logout 
}: ReportsProps) {
  const filteredTransactions = filterTransactionsByPeriod(transactions, currentPeriod);
  const summary = calculateFinancialSummary(filteredTransactions, user.monthlyGoal);
  const categoryData = getCategoryData(filteredTransactions);

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
            <Badge className={`${getPlanBadgeColor(user.plan || 'trial')} text-white`}>
              {getPlanName(user.plan || 'trial')}
            </Badge>
            
            <nav className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setCurrentView('dashboard')}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-yellow-400">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setCurrentView('plans')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Planos
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Relatórios Financeiros</h2>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total de Receitas</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(summary.totalIncome)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-400">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Saldo Final</p>
                  <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Transações</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {filteredTransactions.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="px-8 pt-8 pb-6">
              <CardTitle className="text-white flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Análise por Categoria
              </CardTitle>
              <CardDescription className="text-slate-400">
                Distribuição dos seus gastos
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-4">
                {categoryData.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    Nenhuma despesa registrada no período
                  </p>
                ) : (
                  categoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{category.name}</span>
                        <div className="text-right">
                          <span className="text-white font-bold">
                            {formatCurrency(category.amount)}
                          </span>
                          <span className="text-slate-400 text-sm ml-2">
                            ({category.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="px-8 pt-8 pb-6">
              <CardTitle className="text-white">Histórico Detalhado</CardTitle>
              <CardDescription className="text-slate-400">
                Últimas transações do período
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    Nenhuma transação encontrada
                  </p>
                ) : (
                  filteredTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
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
                      <p className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="px-8 pt-8 pb-6">
            <CardTitle className="text-white">Insights Financeiros</CardTitle>
            <CardDescription className="text-slate-400">
              Análise automática dos seus dados
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-300 font-semibold mb-2">Categoria Dominante</h4>
                <p className="text-white">
                  {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
                </p>
                <p className="text-blue-400 text-sm">
                  {categoryData.length > 0 ? `${categoryData[0].percentage.toFixed(1)}% dos gastos` : ''}
                </p>
              </div>

              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-300 font-semibold mb-2">Economia Mensal</h4>
                <p className="text-white">
                  {formatCurrency(Math.max(0, summary.balance))}
                </p>
                <p className="text-green-400 text-sm">
                  {summary.balance >= 0 ? 'Você está economizando!' : 'Gastos acima da receita'}
                </p>
              </div>

              <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="text-yellow-300 font-semibold mb-2">Meta de Economia</h4>
                <p className="text-white">
                  {summary.monthlyGoalProgress.toFixed(0)}%
                </p>
                <p className="text-yellow-400 text-sm">
                  {summary.monthlyGoalProgress >= 100 ? 'Meta atingida!' : 'Continue assim!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}