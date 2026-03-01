"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UpgradeModal from "@/components/UpgradeModal";

export default function DashboardPage() {
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Valores estáticos para exibição
  const entradas = 10000;
  const saidas = 2637;
  const saldo = entradas - saidas;
  const orcamentoMensal = 5000;
  const gastoAtual = 2637;

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    <div className="bg-black text-white min-h-screen antialiased">
      {/* CONTAINER PRINCIPAL: px-6 garante o respiro nas bordas do mobile */}
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        {/* HEADER: Título e Subtítulo */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm">
              Controle absoluto sobre suas finanças.
            </p>
          </div>
          
          {/* BOTÕES: Lado a lado no mobile e desktop */}
          <div className="flex flex-row gap-3 w-full md:w-auto">
            <button className="flex-1 md:px-6 px-4 py-4 border border-white/10 rounded-2xl text-sm font-medium hover:bg-white/5 transition flex items-center justify-center whitespace-nowrap">
              Metas 📈
            </button>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1 md:px-8 bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl py-4 text-sm font-bold transition shadow-lg shadow-yellow-400/20 flex items-center justify-center whitespace-nowrap"
            >
              + Transação
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO (Saldo, Saída, Entrada) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-[#111111] rounded-2xl p-6 border border-white/5 ring-1 ring-white/5">
            <p className="text-green-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Saldo Atual</p>
            <h2 className="text-3xl font-bold text-green-500">R$ {saldo.toLocaleString()}</h2>
          </div>

          <div className="bg-[#111111] rounded-2xl p-6 border border-white/5 ring-1 ring-white/5">
            <p className="text-red-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Saídas</p>
            <h2 className="text-3xl font-bold text-red-500">R$ {saidas.toLocaleString()}</h2>
          </div>

          <div className="bg-[#111111] rounded-2xl p-6 border border-white/5 ring-1 ring-white/5">
            <p className="text-green-300 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Entradas</p>
            <h2 className="text-3xl font-bold text-green-400">R$ {entradas.toLocaleString()}</h2>
          </div>
        </div>

        {/* SEÇÃO DE DETALHES (Orçamento e Categorias) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Coluna Orçamento Mensal */}
          <div className="lg:col-span-1">
            <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 h-full ring-1 ring-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Orçamento Mensal</span>
                <span className="text-yellow-400 text-xs font-bold px-2 py-1 bg-yellow-400/10 rounded-lg">
                  {porcentagem.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-[#1C1C1C] h-2.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-yellow-400 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${porcentagem}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">
                <span className="text-white font-medium">R$ {gastoAtual.toLocaleString()}</span> de R$ {orcamentoMensal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Coluna Gastos por Categoria */}
          <div className="lg:col-span-2">
            <div className="bg-[#111111] p-6 md:p-8 rounded-2xl border border-white/5 ring-1 ring-white/5">
              <h3 className="text-lg font-bold mb-6">Gastos por Categoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {categorias.map((categoria, index) => {
                  const progresso = (categoria.atual / categoria.limite) * 100;
                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-white/90 font-medium text-sm group-hover:text-white transition-colors">
                          {categoria.nome}
                        </span>
                        <span className="text-[11px] font-mono tracking-tight">
                          <span className="text-white">R$ {categoria.atual.toLocaleString()}</span>
                          <span className="text-white/30 mx-1">/</span>
                          <span className="text-white/40">R$ {categoria.limite.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="w-full bg-[#1C1C1C] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full opacity-90 group-hover:opacity-100 transition-all duration-700 shadow-[0_0_10px_rgba(250,204,21,0.2)]"
                          style={{ width: `${Math.min(progresso, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pb-10 text-center text-gray-600 text-[10px] tracking-[0.3em] uppercase">
          Disciplina financeira constrói liberdade.
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
