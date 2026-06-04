'use client';

import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Component will be unmounted by parent
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className="bg-green-500/10 border-green-500/20 min-w-80">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-2 rounded-full">
              <Check className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-green-300 font-medium">Sucesso!</p>
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}