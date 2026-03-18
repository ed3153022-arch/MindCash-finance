"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// Função de ruído orgânico para oscilação
const generateSmoothNoise = (size: number, seed: number, amplitude: number, frequency: number) => {
  const noise = [];
  for (let i = 0; i < size; i++) {
    const val = (
      Math.sin(i * frequency * 1.0 + seed) * 1.0 +
      Math.sin(i * frequency * 2.1 + seed * 1.5) * 0.5 +
      Math.sin(i * frequency * 3.7 + seed * 2.0) * 0.25
    );
    noise.push((val / 1.75) * amplitude);
  }
  return noise;
};

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [projectedBalance, setProjectedBalance] = useState(0);
  
  const [stats, setStats] = useState([
    { label: "Disciplina", value: 0 }, { label: "Produtividade", value: 0 },
    { label: "Conhecimento", value: 0 }, { label: "Resiliência", value: 0 },
    { label: "Autocontrole", value: 0 }, { label: "Visão", value: 0 },
  ]);

  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);

  const getPoints = (r: number) => {
    let p = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 90) * (Math.PI / 180);
      p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
    }
    return p.join(" ");
  };

  const getDataPoints = useCallback((st: any[]) => {
    let p = [];
    for (let i = 0; i < 6; i++) {
      const r = (st[i].value / 100) * 50;
      const a = (i * 60 - 90) * (Math.PI / 180);
      p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
    }
    return p.join(" ");
  }, []);

  useEffect(() => {
    // FUNÇÃO CORRIGIDA PARA EVITAR O CLIENT-SIDE EXCEPTION
    async function calculateProjectedSystem() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        const totalLimite = goals.reduce((acc, g) => acc + Number(g.amount || 0), 0) || 1000;
        const totalGasto = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalGanho = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const saldoReal = totalGanho - totalGasto;

        const norm = (v: number) => Math.max(5, Math.min(100, Math.round(v)));
        setStats([
          { label: "Disciplina", value: norm((txs.length / 20) * 100) },
          { label: "Produtividade", value: 85 }, 
          { label: "Conhecimento", value: 15 },
          { label: "Resiliência", value: norm(100 - ((totalGasto/totalLimite)*100)) },
          { label: "Autocontrole", value: 90 },
          { label: "Visão", value: norm((totalGanho/totalLimite)*100) },
        ]);

        // LOGICA DE OSCILAÇÃO E PROJEÇÃO
        const numPontos = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const diasProjetados = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        
        // Ajuste de valor projetado dinâmico
        const projecaoFinal = saldoReal + ((totalGanho - totalGasto) / 30 * diasProjetados);
        setProjectedBalance(projecaoFinal);

        const noise = generateSmoothNoise(numPontos, Date.now(), 20, 0.15);
        let projection = [];
        for (let i = 0; i < numPontos; i++) {
          const yPos = 70 - (norm((saldoReal / totalLimite) * 50)) + noise[i];
          projection.push({ x: i, y: yPos });
        }
        setTrendData(projection);

      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    calculateProjectedSystem(); 
  }, [periodo, router, getDataPoints]);

  const getTrendPath = () => {
    if (!trendData.length) return "";
    const step = 300 / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${trendData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black italic uppercase text-xs">Carregando Veredito...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-10 pt-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-700 text-[8px] font-bold tracking-[0.6em] mt-3">Intelligence Forecast System</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 p-10 flex flex-col items-center">
          <div className="relative w-56 h-56 mb-12">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => ( <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.15" /> ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.08)" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-6 w-full text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[7px] font-black text-zinc-600 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-[10px] font-black text-zinc-500 italic flex items-center gap-3">
              <TrendingUp size={16} className="text-yellow-400"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-44 w-full relative mb-4">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getTrendPath()} fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.length > 0 && <circle cx="300" cy={trendData[trendData.length-1].y} r="5" fill="#facc15" className="animate-pulse" />}
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-6 mt-4">
            <div className="text-left">
               <p className="text-[7px] text-zinc-800 font-black tracking-[0.5em] mb-1">Projeção {periodo}</p>
               <p className="text-[10px] font-black text-yellow-400">SISTEMA ATIVO</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-600 mb-1">SALDO PROJETADO</p>
              <p className="text-3xl font-black italic text-yellow-400">
                {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
