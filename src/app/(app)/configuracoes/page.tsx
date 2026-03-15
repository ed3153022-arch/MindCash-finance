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

        // 1. BUSCA DADOS
        const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        const { data: limits } = await supabase.from("limits").select("*").eq("user_id", user.id);

        // 2. SOMA DOS LIMITES POR CATEGORIA
        const totalLimiteMensal = limits?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 1;
        const limiteDiarioProporcional = totalLimiteMensal / 30;

        // 3. LOGICA DO GRAFICO (FORMATO YYYY-MM-DD)
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
            // y ajustado para ser visível: se gastar metade do limite diário, a linha sobe 50% da altura
            y: Math.min(100, (totalNoDia / (limiteDiarioProporcional || 1)) * 100), 
            ultrapassou: totalNoDia > limiteDiarioProporcional 
          };
        });

        setGraphData(dadosCalculados);

        // 4. ATRIBUTOS DA TEIA
        const totalGastoMes = txs?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const temTransacoes = (txs?.length || 0) > 0;
        const temLimites = (limits?.length || 0) > 0;

        setStats([
          { label: "Disciplina", value: temTransacoes ? 85 : 0 },
          { label: "Produtividade", value: temLimites ? 70 : 0 },
          { label: "Conhecimento", value: 90 },
          { label: "Resiliência", value: 65 },
          { label: "Autocontrole", value: temTransacoes ? Math.max(10, Math.round(100 - (totalGastoMes / totalLimiteMensal * 50))) : 10 },
          { label: "Visão", value: totalLimiteMensal > 100 ? 75 : 0 },
        ]);

      } catch (err) {
        console.error(err);
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
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">VEREDITO</h1>

        {/* Radar Chart */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-8">
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
                <p className="text-[8px] font-black uppercase text-zinc-500 italic">{s.label}</p>
                <p className="text-xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tendências */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tendências</h4>
            <div className="flex bg-black p-1 rounded-lg border border-white/5">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-3 py-1 text-[8px] font-black uppercase rounded ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-32 w-full relative">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {graphData.map((p, i) => {
                if (i === 0) return null;
                const prev = graphData[i-1];
                const spacing = 300 / (graphData.length - 1 || 1);
                return (
                  <line key={i} x1={(i-1) * spacing} y1={100 - prev.y} x2={i * spacing} y2={100 - p.y} stroke={p.ultrapassou ? "#ef4444" : "#facc15"} strokeWidth="3" />
                );
              })}
            </svg>
          </div>
        </div>
        
        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-700 font-black text-[10px] uppercase tracking-widest">[ RETORNAR AO DASHBOARD ]</button>
      </div>
    </div>
  );
}

// Funções Auxiliares (Mesma lógica anterior)
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
