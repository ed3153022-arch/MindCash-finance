'use client';

import { X } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {

  const handleUpgrade = () => {
    window.location.assign('https://pay.kiwify.com.br/roY4TvP');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">

      <div className="relative w-[90%] max-w-md rounded-2xl border border-yellow-600/30 bg-neutral-900 p-8 shadow-2xl">

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-500 hover:text-white transition"
        >
          <X size={20} />
        </button>

        {/* Título */}
        <h2 className="mb-4 text-2xl font-semibold text-yellow-500">
          Seu acesso foi pausado
        </h2>

        {/* Texto principal */}
        <p className="mb-6 text-sm leading-relaxed text-neutral-400">
          Seu período de teste terminou.
          Para continuar registrando ganhos, gastos, metas
          e visualizar seu veredito estratégico,
          é necessário ativar o acesso completo.
        </p>

        {/* Benefícios */}
        <ul className="mb-8 space-y-2 text-sm text-neutral-500">
          <li>✔ Registros ilimitados</li>
          <li>✔ Metas mensais ativas</li>
          <li>✔ Veredito financeiro completo</li>
          <li>✔ Controle total da sua evolução</li>
        </ul>

        {/* Botão principal */}
        <button
          onClick={handleUpgrade}
          className="w-full rounded-lg bg-yellow-600 py-3 font-semibold text-black transition hover:bg-yellow-500"
        >
          Ativar acesso completo
        </button>

        {/* Rodapé discreto */}
        <p className="mt-4 text-center text-xs text-neutral-600">
          Continue evoluindo.
        </p>

      </div>
    </div>
  );
}
