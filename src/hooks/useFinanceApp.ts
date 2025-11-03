'use client';

import { useState, useEffect } from 'react';
import { Transaction, User, Period } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useAuth } from './useAuth';

export function useFinanceApp() {
  const auth = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period>('month');
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'settings' | 'plans' | 'login' | 'register'>('login');
  const [showPlanConfirmation, setShowPlanConfirmation] = useState<{
    show: boolean;
    planId: 'essencial' | 'pro' | 'premium' | null;
    planName: string;
    planPrice: number;
  }>({
    show: false,
    planId: null,
    planName: '',
    planPrice: 0
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: ''
  });

  // Derived state from auth
  const isAuthenticated = !!auth.user;
  const user = auth.user ? {
    id: auth.user.id,
    name: auth.user.user_metadata?.full_name || auth.user.email?.split('@')[0] || 'Usuário',
    email: auth.user.email || '',
    monthlyGoal: 5000,
    alertLimit: 3000,
    plan: 'trial' as const,
    trialStartDate: new Date().toISOString(),
    trialTransactionCount: 0,
  } : null;

  // Load transactions from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedTransactions = localStorage.getItem(`mindcash_transactions_${user.email}`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
    }
  }, [isAuthenticated, user?.email]);

  // Save transactions to localStorage
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`mindcash_transactions_${user.email}`, JSON.stringify(transactions));
    }
  }, [transactions, user?.email]);

  // Update view based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      if (currentView === 'login' || currentView === 'register') {
        setCurrentView('dashboard');
      }
    } else {
      if (currentView !== 'login' && currentView !== 'register') {
        setCurrentView('login');
      }
    }
  }, [isAuthenticated, currentView]);

  // Sistema de controle de teste grátis por e-mail
  const getTrialUsageByEmail = (email: string) => {
    const trialUsage = localStorage.getItem('mindcash_trial_usage');
    if (!trialUsage) return null;
    
    const usageData = JSON.parse(trialUsage);
    return usageData[email] || null;
  };

  const setTrialUsageByEmail = (email: string, data: { startDate: string; hasUsedTrial: boolean; isExpired: boolean }) => {
    const trialUsage = localStorage.getItem('mindcash_trial_usage');
    const usageData = trialUsage ? JSON.parse(trialUsage) : {};
    
    usageData[email] = data;
    localStorage.setItem('mindcash_trial_usage', JSON.stringify(usageData));
  };

  const canUserStartTrial = (email: string) => {
    const trialData = getTrialUsageByEmail(email);
    return !trialData || !trialData.hasUsedTrial;
  };

  const isTrialExpiredForEmail = (email: string) => {
    const trialData = getTrialUsageByEmail(email);
    if (!trialData || !trialData.hasUsedTrial) return false;
    
    const trialStartDate = new Date(trialData.startDate);
    const daysSinceStart = Math.floor((Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceStart >= 7;
  };

  // Check trial limits
  const isTrialExpired = () => {
    if (!user || user.plan !== 'trial') return false;
    
    const trialStartDate = new Date(user.trialStartDate || '');
    const daysSinceStart = Math.floor((Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceStart >= 7;
  };

  const canAddTransaction = () => {
    if (!user) return false;
    if (user.plan !== 'trial') return true;
    return !isTrialExpired();
  };

  const getRemainingTrialInfo = () => {
    if (!user || user.plan !== 'trial') return null;
    
    const trialStartDate = new Date(user.trialStartDate || '');
    const daysSinceStart = Math.floor((Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, 7 - daysSinceStart);
    
    return {
      remainingDays,
      remainingTransactions: 999,
      isExpired: isTrialExpired()
    };
  };

  const login = async (email: string, password: string) => {
    const result = await auth.signIn(email, password);
    if (result.success) {
      // Inicializar teste grátis se necessário
      const trialData = getTrialUsageByEmail(email);
      if (!trialData || !trialData.hasUsedTrial) {
        const startDate = new Date().toISOString();
        setTrialUsageByEmail(email, {
          startDate: startDate,
          hasUsedTrial: true,
          isExpired: false
        });
      }
    }
    return result;
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await auth.signUp(email, password, name);
    if (result.success) {
      // Inicializar teste grátis automaticamente
      const startDate = new Date().toISOString();
      setTrialUsageByEmail(email, {
        startDate: startDate,
        hasUsedTrial: true,
        isExpired: false
      });
    }
    return result;
  };

  const logout = async () => {
    await auth.signOut();
    setTransactions([]);
    setCurrentView('login');
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!canAddTransaction()) {
      return false;
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    // Para atualizações do usuário, podemos implementar lógica adicional se necessário
    // Por enquanto, mantemos compatibilidade
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const showPlanConfirmationModal = (planId: 'essencial' | 'pro' | 'premium', planName: string, planPrice: number) => {
    setShowPlanConfirmation({
      show: true,
      planId,
      planName,
      planPrice
    });
  };

  const hidePlanConfirmationModal = () => {
    setShowPlanConfirmation({
      show: false,
      planId: null,
      planName: '',
      planPrice: 0
    });
  };

  const confirmSubscription = () => {
    if (showPlanConfirmation.planId) {
      subscribeToPlan(showPlanConfirmation.planId);
      hidePlanConfirmationModal();
      
      // Show success message
      setShowSuccessMessage({
        show: true,
        message: `Plano ${showPlanConfirmation.planName} ativo com sucesso!`
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage({ show: false, message: '' });
      }, 3000);
    }
  };

  const subscribeToPlan = (planId: 'essencial' | 'pro' | 'premium') => {
    // Salvar plano no localStorage por e-mail
    if (user?.email) {
      localStorage.setItem(`mindcash_plan_${user.email}`, planId);
    }
  };

  const startFreeTrial = () => {
    if (user && user.email && canUserStartTrial(user.email)) {
      const startDate = new Date().toISOString();
      setTrialUsageByEmail(user.email, {
        startDate: startDate,
        hasUsedTrial: true,
        isExpired: false
      });
      
      setShowSuccessMessage({
        show: true,
        message: 'Teste grátis de 7 dias ativado!'
      });
      
      setTimeout(() => {
        setShowSuccessMessage({ show: false, message: '' });
      }, 3000);
    }
  };

  return {
    user,
    transactions,
    currentPeriod,
    isAuthenticated,
    currentView,
    showPlanConfirmation,
    showSuccessMessage,
    setCurrentPeriod,
    setCurrentView,
    login,
    register,
    logout,
    addTransaction,
    updateUser,
    deleteTransaction,
    subscribeToPlan,
    showPlanConfirmationModal,
    hidePlanConfirmationModal,
    confirmSubscription,
    startFreeTrial,
    isTrialExpired,
    canAddTransaction,
    getRemainingTrialInfo,
  };
}