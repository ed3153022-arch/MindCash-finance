"use client";

import { useEffect, useState } from "react";

export default function TrialAlert() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const trialStart = localStorage.getItem("mindcash_trial_start");
    if (!trialStart) return;

    const start = Number(trialStart);
    const now = Date.now();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const daysLeft = 7 - diffDays;

    setRemaining(daysLeft);
  }, []);

  if (remaining === null) return null;

  if (remaining <= 0) {
    return (
      <div className="w-full bg-red-900/40 text-red-200 text-sm text-center py-2">
        Seu período gratuito terminou. Cadastre-se para continuar usando.
      </div>
    );
  }

  if (remaining <= 2) {
    return (
      <div className="w-full bg-yellow-900/40 text-yellow-200 text-sm text-center py-2">
        Faltam {remaining} dia(s) para o fim do acesso gratuito.
      </div>
    );
  }

  return null;
}
