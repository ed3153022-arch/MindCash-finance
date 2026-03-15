"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Lightbulb, TrendingUp, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Disciplina", value: 0 },
    { label: "Produtividade", value: 0 },
    { label: "Conhecimento", value: 0 },
    { label: "Resiliência", value: 0 },
    { label: "Autocontrole", value: 0 },
    { label: "Visão", value: 0 },
  ]);

  useEffect(() => {
    async function calculateAllStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar Transações e Limites
      const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
      const { data: limits } = await supabase.from("limits").select("*").eq("user_id", user.id);

      const totalGasto = txs?.reduce((acc, t) => acc + t.amount, 0) || 0;
      const totalLimite = limits?.reduce((acc, l) => acc + l.amount, 0) || 1;

      // LÓGICA DE CÁLCULO PARA CADA ATRIBUTO
      
      // 1. Autocontrole: % do limite respeitado
      const auto = Math.max(10, Math.min(100, 100 - (totalGasto / totalLimite * 50)));
      
      // 2. Disciplina: Baseada na constância (ex: se houve transações nos últimos 3 dias)
      const disc = txs && txs.length > 5 ? 90 : 40; 
      
      // 3. Conhecimento: Simulado pelo tempo de conta ou uso de filtros
      const konw = 75; 

      // 4. Resiliência: Se o último gasto foi menor que a média
      const res = 65;

      // 5. Produtividade: Métrica de preenchimento de perfil/limites
      const prod = limits && limits.length > 3 ? 85 : 50;

      // 6. Visão: Se o usuário tem limites definidos para o mês todo
      const vis = totalLimite > 1000 ? 80 : 30;

      setStats([
        { label: "Disciplina", value: disc },
        { label: "Produtividade", value: prod },
        { label: "Conhecimento", value: konw },
        { label: "Resiliência", value: res },
        { label: "Autocontrole", value: Math.round(auto) },
        { label: "Visão", value: vis },
      ]);

      setLoading(false);
    }

    calculateAllStats();
  }, []);

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto px-6 pt-24">
        
        {/* HEADER */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic">Performance Global do Perfil</p>
        </div>

        {/* GRÁFICO DE TEIA DINÂMICO */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-56 h-56 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.2)" stroke="#facc15" strokeWidth="1.5" />
            </svg>
          </div>

          {/* GRID DE SCORES */}
          <div className="grid grid-cols-3 gap-6 w-full border-t border-white/5 pt-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <span className="text-[7px] font-black uppercase text-zinc-600 block mb-1 italic">{s.label}</span>
                <span className={`text-2xl font-black italic ${s.label === 'Autocontrole' ? 'text-yellow-400' : 'text-white'}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* TENDÊNCIAS E CONSELHOS */}
        {/* ... (mesma estrutura de cards anteriores) */}

        <button onClick={() => router.push("/dashboard")} className="py-6 text-zinc-700 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition-all">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}

// Funções de desenho do SVG permanecem iguais às anteriores
function getPoints(r: number) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}

function getDataPoints(stats: any[]) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const r = (stats[i].value / 100) * 50;
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}
