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

      <div className="max-w-4xl mx-auto px-5 py-8">

        {/* TÍTULO */}
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* PÍLULAS RESUMO */}
        <div className="space-y-5 mb-10">

          {/* SALDO */}
          <div className="bg-[#0F0F0F] rounded-full px-8 py-6 border border-white/10">
            <p className="text-green-400 text-sm mb-1">Saldo</p>
            <h2 className="text-3xl font-bold text-green-500">
              R$ {saldo.toLocaleString()}
            </h2>
          </div>

          {/* SAÍDA */}
          <div className="bg-[#0F0F0F] rounded-full px-8 py-6 border border-white/10">
            <p className="text-red-400 text-sm mb-1">Saída</p>
            <h2 className="text-3xl font-bold text-red-500">
              R$ {saidas.toLocaleString()}
            </h2>
          </div>

          {/* ENTRADA */}
          <div className="bg-[#0F0F0F] rounded-full px-8 py-6 border border-white/10">
            <p className="text-green-300 text-sm mb-1">Entrada</p>
            <h2 className="text-3xl font-bold text-green-400">
              R$ {entradas.toLocaleString()}
            </h2>
          </div>

        </div>

        {/* BOTÕES */}
        <div className="flex gap-4 mb-10">

          <button className="flex-1 border border-white/20 rounded-2xl py-4 text-white hover:bg-white/5 transition">
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
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl py-4 font-semibold text-lg transition"
          >
            + Nova transação
          </button>

        </div>

        {/* ORÇAMENTO POR CATEGORIA */}
        <div className="bg-[#0F0F0F] p-6 rounded-3xl border border-white/10">

          <h3 className="text-lg font-semibold mb-6">
            Orçamento por categoria
          </h3>

          <div className="space-y-6">

            {categorias.map((categoria, index) => {
              const progresso = (categoria.atual / categoria.limite) * 100;

              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/90">{categoria.nome}</span>
                    <span className="text-white/70">
                      {categoria.atual} / {categoria.limite}
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

      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
