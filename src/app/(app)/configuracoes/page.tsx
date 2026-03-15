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

        // 1. BUSCA TRANSAÇÕES E LIMITES
        const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        const { data: limits } = await supabase.from("limits").select("*").eq("user_id", user.id);

        // 2. LÓGICA DE SOMA DOS LIMITES POR CATEGORIA [NOVO]
        // Somamos todos os limites individuais para ter o teto mensal total
        const totalLimiteMensal = limits?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 1;
        const limiteDiarioProporcional = totalLimiteMensal / 30;

        // 3. PROCESSAMENTO DO GRÁFICO DE TENDÊNCIAS
        const pontosPorPeriodo = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        
        const gastosPorDia = txs?.reduce((acc: any, t: any) => {
          const d = new Date(t.date);
          const chave = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          acc[chave] = (acc[chave] || 0) + Number(t.amount);
          return acc;
        }, {}) || {};

        const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (pontosPorPeriodo - 1 - i));
          const chaveData = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          
          const totalNoDia = gastosPorDia[chaveData] || 0;

          return { 
            x: i, 
            // Altura da linha baseada na proporção do limite diário total
            y: Math.min(100, (totalNoDia / (limiteDiarioProporcional || 1)) * 60), 
            ultrapassou: totalNoDia > limiteDiarioProporcional 
          };
        });

        setGraphData(dadosCalculados);

        // 4. ATUALIZAÇÃO DOS SCORES (BASEADO NA SOMA DOS LIMITES)
        const totalGastoMes = txs?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const temDados = (txs?.length || 0) > 0;

        setStats([
          { label: "Disciplina", value: temDados ? 85 : 0 },
          { label: "Produtividade", value: (limits?.length || 0) > 0 ? 70 : 0 },
          { label: "Conhecimento", value: temDados ? 90 : 0 },
          { label: "Resiliência", value: 65 },
          { label: "Autocontrole", value: temDados ? Math.max(10, Math.round(100 - (totalGastoMes / totalLimiteMensal * 50))) : 0 },
          { label: "Visão", value: totalLimiteMensal > 100 ? 80 : 0 },
        ]);

      } catch (err) {
        console.error("Erro ao carregar veredito:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVereditoData();
  }, [periodo]);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-yellow-400 animate-spin" size={40} />
      <p className="text-yellow-400 font-black italic uppercase text-[10px]">Calculando Veredito...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20 p-6">
      <div className="max-w-2xl mx-auto space-y-8 pt-20">
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase leading-none tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic px-1">Análise Comportamental</p>
        </div>

        {/* STATUS */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black flex items-center justify-between shadow-lg">
          <h3 className="text-black text-3xl font-black italic uppercase">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-8 w-8 fill-black" />
        </div>

        {/* TEIA RADAR */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.15)" stroke="#facc15" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full border-t border-white/5 pt-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[7px] font-black uppercase text-zinc-600 italic mb-1">{s.label}</p>
                <p className={`text-xl font-black italic ${s.value > 0 ? 'text-white' : 'text-zinc-800'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GRÁFICO DE TENDÊNCIAS DINÂMICO */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2"><TrendingUp size={14} className="text-zinc-500"/><h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tendências</h4></div>
            <div className="flex bg-black p-1 rounded-xl border border-white/5">
              {(["dia", "semana", "mês"] as const).map((t) => (
                <button key={t} onClick={() => setPeriodo(t)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase italic transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="relative h-32 w-full pt-4">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {graphData.map((p, i) => {
                if (i === 0) return null;
                const prev = graphData[i-1];
                const spacing = 300 / (graphData.length - 1 || 1);
                return (
                  <line key={i} x1={(i-1) * spacing} y1={100 - prev.y} x2={i * spacing} y2={100 - p.y} stroke={p.ultrapassou ? "#ef4444" : "#facc15"} strokeWidth="2.5" />
                );
              })}
            </svg>
            <div className="flex justify-between mt-6 px-1 border-t border-white/5 pt-2">
                {graphData.filter((_, i) => periodo === "semana" ? true : i % 5 === 0).map((d) => (
                  <span key={d.x} className="text-[8px] font-black text-zinc-700 italic">{d.x + 1}</span>
                ))}
            </div>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-6 text-zinc-800 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}

// Auxiliares SVG
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
