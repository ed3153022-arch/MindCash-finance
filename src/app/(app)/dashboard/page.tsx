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

  const categorias = [
    { nome: "🏠 Moradia", atual: 1500, limite: 2500 },
    { nome: "🍔 Alimentação", atual: 746, limite: 1500 },
    { nome: "🚗 Transporte", atual: 124, limite: 250 },
    { nome: "🎬 Entretenimento", atual: 300, limite: 800 },
    { nome: "💊 Saúde", atual: 67, limite: 200 },
    { nome: "📚 Educação", atual: 400, limite: 1000 },
    { nome: "💳 Assinaturas", atual: 120, limite: 300 },
    { nome: "🛍 Compras", atual: 600, limite: 900 },
  ];

  return (
    <div className="bg-black text-white min-h-[calc(100vh-64px)]">

      <div className="max-w-4xl mx-auto px-6 py-14">

        {/* TÍTULO */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-wide">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-3">
            Controle absoluto sobre suas finanças.
          </p>
        </div>

        {/* PÍLULAS RESUMO */}
        <div className="space-y-8 mb-16">

          {/* SALDO */}
          <div className="bg-[#0F0F0F] rounded-full px-10 py-8 border border-white/10">
            <p className="text-green-400 text-sm mb-3 uppercase tracking-wider">
              Saldo
            </p>
            <h2 className="text-4xl font-bold text-green-500">
              R$ {saldo.toLocaleString()}
            </h2>
          </div>

          {/* SAÍDA */}
          <div className="bg-[#0F0F0F] rounded-full px-10 py-8 border border-white/10">
            <p className="text-red-400 text-sm mb-3 uppercase tracking-wider">
              Saída
            </p>
            <h2 className="text-4xl font-bold text-red-500">
              R$ {saidas.toLocaleString()}
            </h2>
          </div>

          {/* ENTRADA */}
          <div className="bg-[#0F0F0F] rounded-full px-10 py-8 border border-white/10">
            <p className="text-green-300 text-sm mb-3 uppercase tracking-wider">
              Entrada
            </p>
            <h2 className="text-4xl font-bold text-green-400">
              R$ {entradas.toLocaleString()}
            </h2>
          </div>

        </div>

        {/* BOTÕES */}
        <div className="flex gap-6 mb-16">

          <button className="flex-1 border border-white/20 rounded-2xl py-5 text-white hover:bg-white/5 transition">
            Metas 📈
          </button>

          <button
            onClick={() => {
              if (isBlocked) {
                setShowUpgradeModal(true);
                return;
              }
              setShowUpgradeModal(true);
            }}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl py-5 font-semibold text-lg transition"
          >
            + Nova transação
          </button>

        </div>

        {/* ORÇAMENTO MENSAL */}
        <div className="bg-[#0F0F0F] p-10 rounded-3xl border border-white/10 mb-16">

          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 uppercase text-sm tracking-wider">
              Orçamento mensal
            </span>
            <span className="text-yellow-400 font-semibold text-sm">
              {porcentagem.toFixed(0)}% utilizado
            </span>
          </div>

          <div className="w-full bg-[#1C1C1C] h-3 rounded-full overflow-hidden mb-6">
            <div
              className="bg-yellow-400 h-3 transition-all duration-700"
              style={{ width: `${porcentagem}%` }}
            />
          </div>

          <p className="text-gray-500 text-sm">
            R$ {gastoAtual.toLocaleString()} de R${" "}
            {orcamentoMensal.toLocaleString()}
          </p>

        </div>

        {/* ORÇAMENTO POR CATEGORIA */}
        <div className="bg-[#0F0F0F] p-10 rounded-3xl border border-white/10">

          <h3 className="text-lg font-semibold mb-10 tracking-wide">
            Orçamento por categoria
          </h3>

          <div className="space-y-10">

            {categorias.map((categoria, index) => {
              const progresso = (categoria.atual / categoria.limite) * 100;

              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-white/90">{categoria.nome}</span>
                    <span className="text-white/60">
                      R$ {categoria.atual} / {categoria.limite}
                    </span>
                  </div>

                  <div className="w-full bg-[#1C1C1C] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-yellow-400 h-2 transition-all duration-700"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>
              );
            })}

          </div>

        </div>

        {/* FRASE FINAL */}
        <div className="mt-20 text-center text-gray-600 text-sm tracking-wide">
          Disciplina financeira constrói liberdade.
        </div>

      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
      }
