'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface FeedbackProps {
  type: 'success' | 'error' | 'info';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function FeedbackToast({ type, message, isVisible, onClose, duration = 3000 }: FeedbackProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500'
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-4 right-4 z-50 ${colors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl border animate-slide-in-right max-w-sm`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium text-sm">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Hook para usar feedback toast
export function useFeedbackToast() {
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message, isVisible: true });
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, isVisible: false }));
  };

  const showSuccess = (message: string) => showFeedback('success', message);
  const showError = (message: string) => showFeedback('error', message);
  const showInfo = (message: string) => showFeedback('info', message);

  return {
    feedback,
    showSuccess,
    showError,
    showInfo,
    hideFeedback
  };
}