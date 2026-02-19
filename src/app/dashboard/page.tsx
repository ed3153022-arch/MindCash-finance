"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UpgradeModal from "@/components/UpgradeModal";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 🔥 Dados simulados (depois conectamos no banco real)
  const entradas = 10000;
  const saidas = 2637;
  const saldo = entradas - saidas;
  const orcamentoMensal = 5000;
  const gastoAtual = 2637;

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data } = await supabase
        .from("users")
        .select("trial_ends_at, subscription_status")
        .eq("id", user.id)
        .single();

      if (data) {
        setTrialEndsAt(data.trial_ends_at ? new Date(data.trial_ends_at) : null);
        setSubscriptionStatus(data.subscription_status);
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  let isBlocked = false;
  let daysLeft = 0;

  if (trialEndsAt && subscriptionStatus !== "active") {
    const now = new Date();
    const diff = trialEndsAt.getTime() - now.getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    isBlocked = daysLeft <= 0;
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">

      {/* AVISO DE TRIAL */}
      {!isBlocked && daysLeft > 0 && daysLeft <= 3 && (
        <div className="bg-yellow-600 text-black text-center py-2 rounded mb-6 font-semibold">
          Seu teste termina em {daysLeft} dia(s)
        </div>
      )}

      {isBlocked && (
        <div className="bg-red-600 text-white text-center py-3 rounded mb-6 font-semibold">
          Seu período de teste acabou. Ative seu plano.
        </div>
      )}

      {/* BOTÃO NOVA TRANSAÇÃO */}
      <div className="mb-8">
        <button
          onClick={() => {
            if (isBlocked) {
              setShowUpgradeModal(true);
              return;
            }
            alert("Abrir modal de nova transação");
          }}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black py-3 rounded-xl font-bold text-lg"
        >
          + Nova Transação
        </button>
      </div>

      {/* ORÇAMENTO MENSAL */}
      <div className="bg-neutral-900 p-5 rounded-2xl mb-8 shadow-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-400">Orçamento Mensal</span>
          <span className="text-yellow-500 font-semibold">
            R$ {orcamentoMensal.toLocaleString()}
          </span>
        </div>

        <div className="w-full bg-neutral-700 h-3 rounded-full overflow-hidden">
          <div
            className="bg-yellow-500 h-3 transition-all duration-500"
            style={{
              width: `${(gastoAtual / orcamentoMensal) * 100}%`,
            }}
          />
        </div>

        <p className="text-sm text-gray-400 mt-2">
          R$ {gastoAtual.toLocaleString()} gastos
        </p>
      </div>

      {/* RESUMO FINANCEIRO VERTICAL */}
      <div className="space-y-4 mb-10">

        <div className="bg-neutral-900 p-5 rounded-xl">
          <p className="text-gray-400">Entradas</p>
          <h2 className="text-green-500 text-2xl font-bold">
            R$ {entradas.toLocaleString()}
          </h2>
        </div>

        <div className="bg-neutral-900 p-5 rounded-xl">
          <p className="text-gray-400">Saídas</p>
          <h2 className="text-red-500 text-2xl font-bold">
            R$ {saidas.toLocaleString()}
          </h2>
        </div>

        <div className="bg-neutral-900 p-5 rounded-xl">
          <p className="text-gray-400">Saldo Atual</p>
          <h2 className="text-yellow-500 text-2xl font-bold">
            R$ {saldo.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* ORÇAMENTO POR CATEGORIA */}
      <div className="bg-neutral-900 p-5 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-yellow-500">
          Orçamento por Categoria
        </h3>

        <div className="space-y-3 text-sm text-gray-400">
          <div>Moradia — R$ 1.500 / 2.500</div>
          <div>Alimentação — R$ 746 / 1.500</div>
          <div>Transporte — R$ 124 / 250</div>
          <div>Saúde — R$ 67 / 200</div>
        </div>

        {isBlocked && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="mt-4 w-full bg-yellow-500 text-black py-2 rounded-lg font-semibold"
          >
            Desbloquear Relatórios
          </button>
        )}
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
