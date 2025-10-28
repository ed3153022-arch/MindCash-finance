'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, CreditCard, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PlanConfirmationModalProps {
  planName: string;
  planPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PlanConfirmationModal({ 
  planName, 
  planPrice, 
  onConfirm, 
  onCancel 
}: PlanConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Confirmar Assinatura</CardTitle>
            <CardDescription className="text-slate-400">
              Você está prestes a assinar o plano {planName}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Plano {planName}</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(planPrice)}
              </span>
            </div>
            <p className="text-slate-400 text-sm">por mês</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-slate-300">Transações ilimitadas</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-slate-300">Relatórios avançados</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-slate-300">Suporte prioritário</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Nota:</strong> Esta é uma simulação. Em um ambiente real, 
              você seria redirecionado para o gateway de pagamento.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}