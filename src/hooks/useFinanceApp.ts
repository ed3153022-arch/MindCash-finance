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
      remainingTransactions: 999, // Removido limite de transações
      isExpired: isTrialExpired()
    };
  };

  const login = (email: string, password: string) => {
    // Verificar se o e-mail já usou o teste grátis e se expirou
    const trialData = getTrialUsageByEmail(email);
    let userPlan: 'trial' | 'premium' = 'trial';
    let trialStartDate: string | undefined = new Date().toISOString();

    if (trialData && trialData.hasUsedTrial) {
      // Se já usou o teste grátis, verificar se expirou
      if (isTrialExpiredForEmail(email)) {
        // Teste grátis expirado - bloquear acesso (usuário precisa assinar)
        userPlan = 'trial'; // Manter como trial mas será bloqueado
        trialStartDate = trialData.startDate;
        
        // Marcar como expirado
        setTrialUsageByEmail(email, {
          startDate: trialData.startDate,
          hasUsedTrial: true,
          isExpired: true
        });
      } else {
        // Ainda dentro do período de teste
        userPlan = 'trial';
        trialStartDate = trialData.startDate;
      }
    } else {
      // Primeiro login - iniciar teste grátis automaticamente
      const startDate = new Date().toISOString();
      setTrialUsageByEmail(email, {
        startDate: startDate,
        hasUsedTrial: true,
        isExpired: false
      });
      userPlan = 'trial';
      trialStartDate = startDate;
    }

    const mockUser: User = {
      id: generateId(),
      name: email.split('@')[0],
      email,
      monthlyGoal: 5000,
      alertLimit: 3000,
      plan: userPlan,
      trialStartDate: trialStartDate,
      trialTransactionCount: 0,
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const register = (name: string, email: string, password: string) => {
    // Verificar se o e-mail já foi usado para teste grátis
    const canStart = canUserStartTrial(email);
    
    if (canStart) {
      // Primeiro registro - iniciar teste grátis automaticamente
      const startDate = new Date().toISOString();
      setTrialUsageByEmail(email, {
        startDate: startDate,
        hasUsedTrial: true,
        isExpired: false
      });

      const newUser: User = {
        id: generateId(),
        name,
        email,
        monthlyGoal: 5000,
        alertLimit: 3000,
        plan: 'trial',
        trialStartDate: startDate,
        trialTransactionCount: 0,
      };
      
      setUser(newUser);
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    } else {
      // E-mail já usou teste grátis - não permitir novo registro
      alert('Este e-mail já foi usado para teste grátis. Faça login ou use outro e-mail.');
      return;
    }
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
      // Quando usuário assina um plano pago, liberar acesso normalmente
      setUser({
        ...user,
        plan: planId,
        trialStartDate: undefined,
        trialTransactionCount: undefined,
      });
      
      // Não alterar o registro de teste grátis - ele permanece como "usado"
      // mas o usuário agora tem acesso via plano pago
    }
  };

  const startFreeTrial = () => {
    // Esta função não é mais necessária pois o teste grátis inicia automaticamente
    // Mantida para compatibilidade
    if (user && user.email && canUserStartTrial(user.email)) {
      const startDate = new Date().toISOString();
      setTrialUsageByEmail(user.email, {
        startDate: startDate,
        hasUsedTrial: true,
        isExpired: false
      });

      setUser({
        ...user,
        plan: 'trial',
        trialStartDate: startDate,
        trialTransactionCount: 0,
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