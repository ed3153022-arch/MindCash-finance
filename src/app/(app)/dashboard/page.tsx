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

  const porcentagem = (gastoAtual / orcamentoMensal) * 100;

  return (
    <div className="bg-[#0B0B0F] text-white min-h-[calc(100vh-64px)]">

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* TÍTULO */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-wide">
            CONTROLE FINANCEIRO
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Você controla o dinheiro ou ele controla você?
          </p>
        </div>

        {/* SALDO PRINCIPAL */}
        <div className="bg-[#141419] rounded-3xl p-8 mb-10 shadow-xl border border-white/5">
          <p className="text-gray-400 uppercase text-sm tracking-wider">
            Saldo Atual
          </p>

          <h2 className="text-4xl font-bold mt-4 text-emerald-500">
            R$ {saldo.toLocaleString()}
          </h2>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div>
              <p className="text-gray-500 text-sm">Entradas</p>
              <p className="text-emerald-400 text-xl font-semibold mt-1">
                R$ {entradas.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Saídas</p>
              <p className="text-red-400 text-xl font-semibold mt-1">
                R$ {saidas.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ORÇAMENTO MENSAL */}
        <div className="bg-[#141419] p-8 rounded-3xl mb-10 shadow-lg border border-white/5">
          <div className="flex justify-between mb-4">
            <span className="text-gray-400 uppercase text-sm tracking-wider">
              Orçamento Mensal
            </span>
            <span className="text-emerald-400 font-semibold">
              {porcentagem.toFixed(0)}% utilizado
            </span>
          </div>

          <div className="w-full bg-[#1C1C22] h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-3 transition-all duration-700"
              style={{ width: `${porcentagem}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            R$ {gastoAtual.toLocaleString()} de R$ {orcamentoMensal.toLocaleString()}
          </p>
        </div>

        {/* BOTÃO NOVA TRANSAÇÃO */}
        <div className="mb-12">
          <button
            onClick={() => {
              if (isBlocked) {
                setShowUpgradeModal(true);
                return;
              }
              setShowUpgradeModal(true);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-900/30"
          >
            + Nova Transação
          </button>
        </div>

        {/* ORÇAMENTO POR CATEGORIA */}
        <div className="bg-[#141419] p-8 rounded-3xl shadow-lg border border-white/5">
          <h3 className="text-lg font-semibold mb-6 tracking-wide text-gray-300">
            Orçamento por Categoria
          </h3>

          <div className="space-y-6">

            {[
              { nome: "Moradia", atual: 1500, limite: 2500 },
              { nome: "Alimentação", atual: 746, limite: 1500 },
              { nome: "Transporte", atual: 124, limite: 250 },
              { nome: "Saúde", atual: 67, limite: 200 },
            ].map((categoria, index) => {
              const progresso = (categoria.atual / categoria.limite) * 100;

              return (
                <div key={index}>
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>{categoria.nome}</span>
                    <span>
                      R$ {categoria.atual} / {categoria.limite}
                    </span>
                  </div>

                  <div className="w-full bg-[#1C1C22] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 transition-all duration-700"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* FRASE FINAL MINDCASH */}
        <div className="mt-14 text-center text-gray-600 text-sm tracking-wide">
          Riqueza é disciplina aplicada diariamente.
        </div>

      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
