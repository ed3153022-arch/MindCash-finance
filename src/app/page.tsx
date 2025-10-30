'use client';

import { useFinanceApp } from '@/hooks/useFinanceApp';
import { LoginForm } from '@/components/LoginForm';
import { RegisterForm } from '@/components/RegisterForm';
import { Dashboard } from '@/components/Dashboard';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';
import { Plans } from '@/components/Plans';
import { PlanConfirmationModal } from '@/components/PlanConfirmationModal';
import { SuccessMessage } from '@/components/SuccessMessage';
import { PageTransition } from '@/components/PageTransition';

export default function HomePage() {
  const {
    currentView,
    isAuthenticated,
    showPlanConfirmation,
    showSuccessMessage,
    ...appState
  } = useFinanceApp();

  const renderCurrentView = () => {
    if (!isAuthenticated) {
      return currentView === 'register' ? (
        <RegisterForm {...appState} />
      ) : (
        <LoginForm {...appState} />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...appState} />;
      case 'reports':
        return <Reports {...appState} />;
      case 'settings':
        return <Settings {...appState} />;
      case 'plans':
        return <Plans {...appState} />;
      default:
        return <Dashboard {...appState} />;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8">
        {renderCurrentView()}
        
        {showPlanConfirmation.show && (
          <PlanConfirmationModal
            planName={showPlanConfirmation.planName}
            planPrice={showPlanConfirmation.planPrice}
            onConfirm={appState.confirmSubscription}
            onCancel={appState.hidePlanConfirmationModal}
          />
        )}
        
        {showSuccessMessage.show && (
          <SuccessMessage message={showSuccessMessage.message} />
        )}
      </div>
    </PageTransition>
  );
}