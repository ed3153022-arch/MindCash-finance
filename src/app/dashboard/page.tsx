'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallback safety (normalmente o middleware já bloqueia)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar o dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">MindCash</h1>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* VEREDITO FINANCEIRO BLOQUEADO */}
          <Card className="border-dashed border-muted">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>Veredito Financeiro</span>
                <span className="text-sm text-muted-foreground">🔒</span>
              </CardTitle>
              <CardDescription>
                Análise automática da sua vida financeira
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para visualizar seu veredito mensal, tendências e relatórios
                completos, é necessário ativar um plano.
              </p>

              <Button onClick={() => router.push('/plans')}>
                Desbloquear veredito
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
