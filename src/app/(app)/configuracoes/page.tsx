"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, TrendingUp, ChevronLeft, Loader2 } from "lucide-react";
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

        // 1. Busca Transações e Metas
        const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        const { data: goals } = await supabase.from("goals").select("*").eq("user_id", user.id);

        // --- CÁLCULO DINÂMICO DA TEIA ---
        const totalLimiteMensal = goals?.reduce((acc, curr) => acc + Number(curr.amount || curr.target_value || 0), 0) || 1000;
        const totalGastoMes = txs?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const limiteDiario = totalLimiteMensal / 30;

        // Lógica de cálculo para cada atributo
        const disciplina = txs && txs.length > 0 ? Math.min(100, txs.length * 5) : 10;
        const produtividade = goals && goals.length > 0 ? Math.min(100, goals.length * 20) : 10;
        const autocontrole = totalLimiteMensal > 0 ? Math.max(10, Math.round(100 - (totalGastoMes / totalLimiteMensal * 100))) : 50;
        const visao = totalLimiteMensal > 500 ? 85 : 40;

        setStats([
          { label: "Disciplina", value: disciplina },
          { label: "Produtividade", value: produtividade },
          { label: "Conhecimento", value: conhecimento },
          { label: "Resiliência", value: resiliência },
          { label: "Autocontrole", value: autocontrole },
          { label: "Visão", value: visao },
        ]);

        // --- CÁLCULO DA LINHA NEON ---
        const pontosPorPeriodo = periodo === "dia" ? 12 : periodo === "semana" ? 7 : 30;
        
        const gastosMapeados = txs?.reduce((acc: any, t: any) => {
          const d = new Date(t.date || t.created_at);
          const chave = periodo === "dia" ? d.getHours() : d.toISOString().split('T')[0];
          acc[chave] = (acc[chave] || 0) + Number(t.amount);
          return acc;
        }, {}) || {};

        const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
          let totalNoPonto = 0;
          if (periodo === "dia") {
            totalNoPonto = gastosMapeados[i * 2] || 0; // Blocos de 2 horas
          } else {
            const d = new Date();
            d.setDate(d.getDate() - (pontosPorPeriodo - 1 - i));
            const chave = d.toISOString().split('T')[0];
            totalNoPonto = gastosMapeados[chave] || 0;
          }

          return { 
            x: i, 
            y: Math.min(95, (totalNoPonto / (limiteDiario || 1)) * 120 + 5), 
            ultrapassou: totalNoPonto > limiteDiario 
          };
        });

        setGraphData(dadosCalculados);
      } catch (err) {
        console.error("Erro ao calcular Veredito:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVereditoData();
  }, [periodo]);

  // Função para gerar curva suave do gráfico de linha
  const getCurvePath = () => {
    if (graphData.length < 2) return "";
    const width = 300;
    const height = 100;
    const spacing = width / (graphData.length - 1);
    
    return graphData.reduce((path, p, i) => {
      const x = i * spacing;
      const y = height - p.y;
      if (i === 0) return `M ${x},${y}`;
      const prevX = (i - 1) * spacing;
      const prevY = height - graphData[i - 1].y;
      const cp1x = prevX + (x - prevX) / 2;
      return `${path} C ${cp1x},${prevY} ${cp1x},${y} ${x},${y}`;
    }, "");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-8 pt-12">
        
        <header>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[9px] font-bold tracking-[0.3em] uppercase italic px-1">Inteligência Financeira</p>
        </header>

        {/* Status Bar */}
        <div className="bg-yellow-400 p-5 rounded-2xl border-2 border-black flex items-center justify-between shadow-[0_0_20px_rgba(250,204,21,0.3)]">
          <h3 className="text-black text-2xl font-black italic uppercase tracking-tighter">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-7 w-7 fill-black" />
        </div>

        {/* Radar Dinâmico (Teia) */}
        <div className="bg-[#080808] rounded-[2.5rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-52 h-52 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
              ))}
              <polygon 
                points={getDataPoints(stats)} 
                fill="rgba(250, 204, 21, 0.15)" 
                stroke="#facc15" 
                strokeWidth="2" 
                strokeLinejoin="round" 
                className="transition-all duration-700 ease-out"
              />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-8 w-full border-t border-white/5 pt-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black uppercase text-zinc-600 mb-1">{s.label}</p>
                <p className="text-2xl font-black italic tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Linha Neon */}
        <div className="bg-[#080808] p-8 rounded-[2rem] border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">Tendência {periodo}</h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${periodo === t ? 'bg-yellow-400 text-black shadow-lg' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="h-32 w-full relative">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              <defs>
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                d={getCurvePath()} 
                fill="none" 
                stroke={graphData.some(d => d.ultrapassou) ? "#ff4444" : "#facc15"} 
                strokeWidth="4" 
                strokeLinecap="round"
                filter="url(#neon-glow)"
              />
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[9px] uppercase tracking-[0.4em]">[ Retornar ao Dashboard ]</button>
      </div>
    </div>
  );
}

// Auxiliares Teia
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
