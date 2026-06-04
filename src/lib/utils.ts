import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction, FinancialSummary, CategoryData, Period } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function filterTransactionsByPeriod(transactions: Transaction[], period: Period): Transaction[] {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth());
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return transactions.filter(transaction => 
    new Date(transaction.date) >= startDate
  );
}

export function calculateFinancialSummary(transactions: Transaction[], monthlyGoal?: number): FinancialSummary {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;
  const monthlyGoalProgress = monthlyGoal ? Math.min((balance / monthlyGoal) * 100, 100) : 0;

  return {
    totalIncome: income,
    totalExpenses: expenses,
    balance,
    monthlyGoalProgress,
  };
}

export function getCategoryData(transactions: Transaction[]): CategoryData[] {
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, number>();
  
  expenses.forEach(transaction => {
    const current = categoryMap.get(transaction.category) || 0;
    categoryMap.set(transaction.category, current + transaction.amount);
  });

  const colors = [
    '#D4AF37', '#B8860B', '#DAA520', '#FFD700', '#F4A460',
    '#CD853F', '#DEB887', '#F5DEB3', '#FFEBCD', '#FFF8DC'
  ];

  return Array.from(categoryMap.entries()).map(([name, amount], index) => ({
    name,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    color: colors[index % colors.length],
  }));
}

export function shouldShowAlert(transactions: Transaction[], alertLimit?: number): boolean {
  if (!alertLimit) return false;
  
  const monthlyExpenses = filterTransactionsByPeriod(transactions, 'month')
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return monthlyExpenses > alertLimit;
}