"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  
  const [stats, setStats] = useState([
    { label: "Disciplina", value: 100 }, { label: "Produtividade", value: 85 },
    { label: "Conhecimento", value: 15 }, { label: "Resiliência", value: 100 },
    { label: "Autocontrole", value: 90 }, { label: "Visão", value: 10 },
  ]);

  const getDataPoints = useCallback((st: any[]) => {
    let p = [];
    for (let i = 0; i < 6; i++) {
      const r = (st[i].value / 100) * 45;
      const a = (i * 60 - 90) * (Math.PI / 180);
      p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
    }
    return p.join(" ");
  }, []);

  useEffect(() => {
    async function fetchSystemData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const now = new Date();
        let startDate = new Date();
        if (periodo === "dia") startDate.setHours(now.getHours() - 24);
        else if (periodo === "semana") startDate.setDate(now.getDate() - 7);
        else startDate.setDate(now.getDate() - 30);

        const { data: txsPeriodo } = await supabase.from("transactions")
          .select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString());

        const { data: allTxs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        
        const currentBalance = allTxs?.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0) || 0;
        const incomeP = txsPeriodo?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const expenseP = txsPeriodo?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        
        const divisor = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const mediaRitmo = (incomeP - expenseP) / divisor;
        const finalProj = currentBalance + (mediaRitmo * divisor);
        
        setProjectedBalance(finalProj);

        // LÓGICA DO GRÁFICO SINCRONIZADA COM O SALDO
        const pontos = 15;
        const data = [];
        const baseLine = 50; // Centro do gráfico

        for (let i = 0; i < pontos; i++) {
          // A tendência (inclinação) é baseada na média real de ganhos/gastos
          const progressoPeriodo = i / (pontos - 1);
          const tendenciaReal = (mediaRitmo / (Math.abs(currentBalance) || 100)) * 20 * progressoPeriodo;
          
          // Adiciona o ruído visual agressivo mantendo a direção real
          const noise = Math.sin(i * 0.9) * 15 + Math.cos(i * 1.4) * 10;
          
          const yValue = baseLine - tendenciaReal - noise;
          data.push({ x: i, y: Math.max(15, Math.min(85, yValue)) });
        }
        setTrendData(data);

      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchSystemData();
  }, [periodo, router]);

  const getSmoothPath = () => {
    if (trendData.length < 2) return "";
    const step = 300 / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${trendData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black italic uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Tendência...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 tracking-widest uppercase">Real-Time Sync v4.16</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Gráfico Radar */}
        <div className="bg-[#050505] rounded-[3.5rem] border border-white/5 p-12 flex flex-col items-center shadow-2xl">
          <div className="relative w-64 h-64 mb-14">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map(r => ( <polygon key={r} points={getDataPoints(stats.map(s => ({...s, value: r})))} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" /> ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.05)" stroke="#facc15" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-12 gap-x-8 w-full text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black text-zinc-700 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Chart Sincronizado */}
        <div className="bg-[#050505] p-12 rounded-[3.5rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest">
              <TrendingUp size={14} className="text-yellow-500"/> Fluxo de {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10 shadow-inner">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black scale-105 shadow-lg' : 'text-zinc-700 hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative mb-6">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.length > 0 && (
                <g>
                  <circle cx="300" cy={trendData[trendData.length-1].y} r="6" fill="#facc15" className="animate-pulse" />
                  <circle cx="300" cy={trendData[trendData.length-1].y} r="12" fill="#facc15" opacity="0.2" className="animate-ping" />
                </g>
              )}
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-8 mt-6">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-[0.6em] mb-2 uppercase">Analysis Complete</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase">Sistema Ativo</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-[0.2em] uppercase">Saldo Projetado</p>
              <p className="text-5xl font-black italic text-yellow-400 leading-none">
                {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
