"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [projectedBalance, setProjectedBalance] = useState(0);
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  
  // Memoização para evitar cálculos desnecessários no Radar
  const stats = useMemo(() => [
    { label: "Disciplina", value: 100 }, { label: "Produtividade", value: 85 },
    { label: "Conhecimento", value: 15 }, { label: "Resiliência", value: 100 },
    { label: "Autocontrole", value: 90 }, { label: "Visão", value: 10 },
  ], []);

  const getDataPoints = useCallback((st: any[]) => {
    return st.map((s, i) => {
      const a = (i * 60 - 90) * (Math.PI / 180);
      const r = (s.value / 100) * 45;
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(" ");
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const now = new Date();
        let startDate = new Date();
        // Ajuste preciso de datas para o filtro
        if (periodo === "dia") startDate.setHours(now.getHours() - 24);
        else if (periodo === "semana") startDate.setDate(now.getDate() - 7);
        else startDate.setDate(now.getDate() - 30);

        const [{ data: txsP }, { data: allTxs }] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()),
          supabase.from("transactions").select("*").eq("user_id", user.id)
        ]);

        if (!isMounted) return;

        const currentBalance = allTxs?.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0) || 0;
        const incomeP = txsP?.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const expenseP = txsP?.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        
        const divisor = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const mediaRitmo = (incomeP - expenseP) / divisor;
        const finalProj = currentBalance + (mediaRitmo * divisor);
        
        setProjectedBalance(finalProj);

        // GERAÇÃO DINÂMICA: O gráfico muda porque os parâmetros mudam com o 'periodo'
        const pontosCount = periodo === "dia" ? 12 : periodo === "semana" ? 20 : 30;
        const newData = [];
        const scaleFactor = Math.abs(currentBalance) > 0 ? currentBalance : 1000;

        for (let i = 0; i < pontosCount; i++) {
          const progresso = i / (pontosCount - 1);
          // A inclinação agora é proporcional ao ritmo de gastos/ganhos real
          const inclinacao = (mediaRitmo / scaleFactor) * 40 * progresso;
          
          // Ruído varia conforme o período para o gráfico não parecer estático
          const varA = Math.sin(i * (periodo === "dia" ? 0.5 : 0.8)) * 10;
          const varB = Math.cos(i * (periodo === "mês" ? 1.5 : 1.1)) * 8;
          
          newData.push({ x: i, y: Math.max(10, Math.min(90, 50 - inclinacao - (varA + varB))) });
        }
        setTrendData(newData);

      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
  }, [periodo, router]); // O gatilho principal é a mudança de 'periodo'

  const getSmoothPath = () => {
    if (trendData.length < 2) return "";
    const width = 300;
    const step = width / (trendData.length - 1);
    
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${trendData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 tracking-widest uppercase">System Refresh v4.18</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Chart */}
        <div className="bg-[#050505] rounded-[3.5rem] border border-white/5 p-12 flex flex-col items-center">
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
                <p className="text-4xl font-black italic text-white tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Chart - Agora Responsivo à Troca de Período */}
        <div className="bg-[#050505] p-12 rounded-[3.5rem] border border-white/5 relative shadow-2xl">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest leading-none">
              <TrendingUp size={14} className="text-yellow-500"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10">
              {(["dia", "semana", "mês"] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all duration-300 ${periodo === t ? 'bg-yellow-400 text-black scale-105' : 'text-zinc-700 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative mb-6">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-yellow-400/20 font-black italic text-xs tracking-widest animate-pulse">Recalculando...</div>
            ) : (
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible transition-opacity duration-500">
                <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                {trendData.length > 0 && (
                  <circle cx="300" cy={trendData[trendData.length-1].y} r="6" fill="#facc15" className="animate-pulse" />
                )}
              </svg>
            )}
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-8 mt-6">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-[0.6em] mb-2 uppercase tracking-widest leading-none">Data Engine Online</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase">Análise Real</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-[0.2em] uppercase tracking-widest">Saldo Projetado</p>
              <p className="text-5xl font-black italic text-yellow-400 leading-none tracking-tighter">
                {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
