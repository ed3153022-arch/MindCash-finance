'use client';

import { useEffect } from 'react';
import { useFinanceApp } from '@/hooks/useFinanceApp';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isAuthenticated } = useFinanceApp();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/signin');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
      Carregando MindCash…
    </div>
  );
}
