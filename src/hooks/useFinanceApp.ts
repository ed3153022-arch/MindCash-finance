'use client';

import { useState, useEffect } from 'react';
import { Transaction, User, Period } from '@/lib/types';
import { generateId } from '@/lib/utils';

export function useFinanceApp() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period>('month');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  // Load data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('mindcash_user');
    const savedTransactions = localStorage.getItem('mindcash_transactions');
    const savedAuth = localStorage.getItem('mindcash_auth');

    if (savedAuth === 'true' && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    }

    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('mindcash_user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mindcash_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mindcash_auth', isAuthenticated.toString());
  }, [isAuthenticated]);

  // Check trial limits
  const isTrialExpired = () => {
    if (!user || user.plan !== 'trial') return false;
    
    const trialStartDate = new Date(user.trialStartDate || '');
    const daysSinceStart = Math.floor((Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const transactionCount = user.trialTransactionCount || 0;
    
    return daysSinceStart >= 7 || transactionCount >= 4;
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
    const remainingTransactions = Math.max(0, 4 - (user.trialTransactionCount || 0));
    
    return {
      remainingDays,
      remainingTransactions,
      isExpired: isTrialExpired()
    };
  };

  const login = (email: string, password: string) => {
    // Simulate login - in real app, this would be an API call
    const mockUser: User = {
      id: generateId(),
      name: email.split('@')[0],
      email,
      monthlyGoal: 5000,
      alertLimit: 3000,
      plan: 'trial',
      trialStartDate: new Date().toISOString(),
      trialTransactionCount: 0,
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const register = (name: string, email: string, password: string) => {
    // Simulate registration - in real app, this would be an API call
    const newUser: User = {
      id: generateId(),
      name,
      email,
      monthlyGoal: 5000,
      alertLimit: 3000,
      plan: 'trial',
      trialStartDate: new Date().toISOString(),
      trialTransactionCount: 0,
    };
    
    setUser(newUser);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('login');
    localStorage.removeItem('mindcash_user');
    localStorage.removeItem('mindcash_auth');
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
    
    // Update trial transaction count
    if (user?.plan === 'trial') {
      setUser(prev => prev ? {
        ...prev,
        trialTransactionCount: (prev.trialTransactionCount || 0) + 1
      } : null);
    }
    
    return true;
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
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
    if (user) {
      setUser({
        ...user,
        plan: planId,
        trialStartDate: undefined,
        trialTransactionCount: undefined,
      });
    }
  };

  const startFreeTrial = () => {
    if (user && user.plan !== 'trial') {
      setUser({
        ...user,
        plan: 'trial',
        trialStartDate: new Date().toISOString(),
        trialTransactionCount: 0,
      });
      
      // Show success message
      setShowSuccessMessage({
        show: true,
        message: 'Modo de teste ativado! Você tem 7 dias ou 4 lançamentos.'
      });
      
      // Hide success message after 3 seconds
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