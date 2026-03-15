"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Lightbulb, TrendingUp, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  
  const [stats, setStats] = useState([
    { label: "Disciplina", value: 0 },
    { label: "Produtividade", value: 0 },
    { label: "Conhecimento", value: 0 },
    { label: "Resiliência", value: 0 },
    { label: "Autocontrole", value: 0 },
    { label: "Visão", value: 0 },
  ]);

  const [graphData, setGraphData] = useState<{ x: number; y: number; ultrapassou: boolean }[]>([]);

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. BUSCA TRANSAÇÕES E LIMITES (DA TABELA GOALS)
        const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        const { data: goals } = await supabase.from("goals").select("*").eq("user_id", user.id);

        // 2. SOMA DOS LIMITES (CATEGORIAS NA TABELA GOALS)
        // Verifique se o campo de valor na sua tabela goals se chama 'amount' ou 'target_value'
        const totalLimiteMensal = goals?.reduce((acc, curr) => acc + Number(curr.amount || curr.target_value || 0), 0) || 1;
        const limiteDiarioProporcional = totalLimiteMensal / 30;

        // 3. LOGICA DO GRÁFICO (YYYY-MM-DD)
        const pontosPorPeriodo = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const gastosPorDia = txs?.reduce((acc: any, t: any) => {
          const d = new Date(t.date);
          const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          acc[chave] = (acc[chave] || 0) + Number(t.amount);
          return acc;
        }, {}) || {};

        const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (pontosPorPeriodo - 1 - i));
          const chaveData = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const totalNoDia = gastosPorDia[chaveData] || 0;

          return { 
            x: i, 
            y: Math.min(100, (totalNoDia / (limiteDiarioProporcional || 1)) * 100), 
            ultrapassou: totalNoDia > limiteDiarioProporcional 
          };
        });

        setGraphData(dadosCalculados);

        // 4. ATRIBUTOS DA TEIA REATIVOS
        const totalGastoMes = txs?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const temTransacoes = (txs?.length || 0) > 0;
        const temMetas = (goals?.length || 0) > 0;

        setStats([
          { label: "Disciplina", value: temTransacoes ? 85 : 10 },
          { label: "Produtividade", value: temMetas ? 70 : 10 },
          { label: "Conhecimento", value: 90 },
          { label: "Resiliência", value: 65 },
          { label: "Autocontrole", value: temTransacoes ? Math.max(10, Math.round(100 - (totalGastoMes / totalLimiteMensal * 50))) : 20 },
          { label: "Visão", value: totalLimiteMensal > 100 ? 75 : 15 },
        ]);

      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVereditoData();
  }, [periodo]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-8 pt-10">
        <header className="space-y-2">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">VEREDITO</h1>
            <p className="text-zinc-500 text-[9px] font-black tracking-[0.3em] uppercase italic">Inteligência Financeira</p>
        </header>

        {/* Radar */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-56 h-56 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.2)" stroke="#facc15" strokeWidth="2" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-6 w-full text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black uppercase text-zinc-600 italic mb-1">{s.label}</p>
                <p className="text-2xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tendências Reais */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2"><TrendingUp size={14} className="text-zinc-500"/><h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Tendência {periodo}</h4></div>
            <div className="flex bg-black p-1 rounded-xl border border-white/5">
                {["dia", "semana", "mês"].map(t => (
                  <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-700'}`}>{t}</button>
                ))}
            </div>
          </div>
          <div className="h-40 w-full relative pt-4">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {graphData.map((p, i) => {
                if (i === 0) return null;
                const prev = graphData[i-1];
                const spacing = 300 / (graphData.length - 1 || 1);
                return (
                  <line key={i} x1={(i-1) * spacing} y1={100 - prev.y} x2={i * spacing} y2={100 - p.y} stroke={p.ultrapassou ? "#ef4444" : "#facc15"} strokeWidth="3" strokeLinecap="round" />
                );
              })}
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-8 text-zinc-800 font-black text-[10px] uppercase tracking-[0.4em] hover:text-white transition-all underline underline-offset-8 decoration-zinc-900 text-center">
            RETORNAR AO DASHBOARD
        </button>
      </div>
    </div>
  );
}

// Auxiliares (Desenho da Teia)
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
