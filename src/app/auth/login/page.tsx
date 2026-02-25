'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full space-y-6">
          
          <div className="text-center">
            <div className="mx-auto w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-4">
              <span className="text-yellow-400 font-bold text-2xl">S</span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Entrar na plataforma
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black border border-gray-300 hover:bg-gray-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.6h5.1c-.2 1.3-1.6 3.7-5.1 3.7-3.1 0-5.6-2.6-5.6-5.8s2.5-5.8 5.6-5.8c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.9 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.7-3.6 8.7-8.7 0-.6-.1-1-.2-1.1H12z"
                  />
                </svg>

                {loading ? 'Redirecionando...' : 'Continuar com Google'}
              </Button>

            </CardContent>
          </Card>

        </div>
      </div>
    </PageTransition>
  );
}
