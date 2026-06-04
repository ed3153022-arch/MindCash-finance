'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-md">

          <Card className="bg-neutral-900 border-neutral-800 shadow-xl">
            <CardContent className="py-10 px-8 space-y-8 text-center">

              {/* Logo */}
              <div className="flex flex-col items-center space-y-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-400 flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-xl">M</span>
                </div>

                <h2 className="text-2xl font-bold text-white">
                  bem-vindo ao MindCash Finance 
                </h2>

                <p className="text-sm text-gray-400">
                  Continue com sua conta Google para acessar o MindCash.
                </p>
              </div>

              {/* Error */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Google Button */}
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#000000"
                        d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.3-1.6 3.81-5.27 3.81-3.17 0-5.75-2.62-5.75-5.85s2.58-5.85 5.75-5.85c1.8 0 3 .77 3.69 1.44l2.52-2.44C16.8 3.98 14.68 3 12 3 7 3 3 7.03 3 12s4 9 9 9c5.2 0 8.64-3.64 8.64-8.76 0-.59-.07-1.04-.29-1.14z"
                      />
                    </svg>
                    Continuar com Google
                  </>
                )}
              </Button>

            </CardContent>
          </Card>

        </div>
      </div>
    </PageTransition>
  );
}
