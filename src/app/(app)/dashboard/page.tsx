"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UpgradeModal from "@/components/UpgradeModal";

export default function DashboardPage() {
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  if (trialEndsAt && subscriptionStatus !== "active") {
    const now = new Date();
    isBlocked = trialEndsAt.getTime() < now.getTime();
  }

  if (loading) return null;

  return (
    <div className="bg-black text-white min-h-[calc(100vh-64px)]">

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* BOTÃO NOVA TRANSAÇÃO FIXO BONITO */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (isBlocked) {
                setShowUpgradeModal(true);
                return;
              }
              setShowUpgradeModal(true);
            }}
            className="w-full bg-yellow-500 hover:bg-yellow-400 transition-all text-black py-4 rounded-2xl font-bold text-lg shadow-lg"
          >
            + Nova Transação
          </button>
        </div>

        {/* ORÇAMENTO MENSAL */}
        <div className="bg-neutral-900 p-6 rounded-3xl mb-8 shadow-xl">
          <div className="flex justify-between mb-3">
            <span className="text-gray-400">Orçamento Mensal</span>
            <span className="text-yellow-500 font-semibold">
              R$ {orcamentoMensal.toLocaleString()}
            </span>
          </div>

          <div className="w-full bg-neutral-700 h-4 rounded-full overflow-hidden">
            <div
              className="bg-yellow-500 h-4 transition-all duration-500"
              style={{
                width: `${(gastoAtual / orcamentoMensal) * 100}%`,
              }}
            />
          </div>

          <p className="text-sm text-gray-400 mt-3">
            R$ {gastoAtual.toLocaleString()} gastos
          </p>
        </div>

        {/* RESUMO */}
        <div className="grid gap-6 mb-10">

          <div className="bg-neutral-900 p-6 rounded-3xl shadow-lg">
            <p className="text-gray-400">Entradas</p>
            <h2 className="text-green-500 text-3xl font-bold mt-2">
              R$ {entradas.toLocaleString()}
            </h2>
          </div>

          <div className="bg-neutral-900 p-6 rounded-3xl shadow-lg">
            <p className="text-gray-400">Saídas</p>
            <h2 className="text-red-500 text-3xl font-bold mt-2">
              R$ {saidas.toLocaleString()}
            </h2>
          </div>

          <div className="bg-neutral-900 p-6 rounded-3xl shadow-lg">
            <p className="text-gray-400">Saldo Atual</p>
            <h2 className="text-yellow-500 text-3xl font-bold mt-2">
              R$ {saldo.toLocaleString()}
            </h2>
          </div>

        </div>

        {/* ORÇAMENTO POR CATEGORIA */}
        <div className="bg-neutral-900 p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-semibold mb-5 text-yellow-500">
            Orçamento por Categoria
          </h3>

          <div className="space-y-3 text-gray-400">
            <div>Moradia — R$ 1.500 / 2.500</div>
            <div>Alimentação — R$ 746 / 1.500</div>
            <div>Transporte — R$ 124 / 250</div>
            <div>Saúde — R$ 67 / 200</div>
          </div>
        </div>

      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
        }
