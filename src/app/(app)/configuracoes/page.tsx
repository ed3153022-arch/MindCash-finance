"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [projectedBalance, setProjectedBalance] = useState<number>(0);
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  
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

        const { data: rawData, error } = await supabase
          .from("transactions")
          .select("amount, type, created_at")
          .eq("user_id", user.id);

        if (error || !rawData) throw error;
        if (!isMounted) return;

        // --- CORREÇÃO DE POLARIDADE (ENTRADA VS SAÍDA) ---
        const agora = new Date().getTime();
        const umDia = 24 * 60 * 60 * 1000;
        const limites = { dia: agora - umDia, semana: agora - (umDia * 7), mês: agora - (umDia * 30) };

        let saldoRealHoje = 0;
        let lucroNoPeriodo = 0;

        rawData.forEach(t => {
          const valor = Math.abs(Number(t.amount)); // Garante valor positivo para somar/subtrair
          const isEntrada = String(t.type).trim().toLowerCase() === 'income'; // Checagem rigorosa
          const dataMs = new Date(t.created_at).getTime();
          
          // 1. Cálculo do Saldo Total
          if (isEntrada) saldoRealHoje += valor;
          else saldoRealHoje -= valor;

          // 2. Cálculo da Performance do Botão
          if (dataMs >= limites[periodo]) {
            if (isEntrada) lucroNoPeriodo += valor;
            else lucroNoPeriodo -= valor;
          }
        });

        // Veredito: Onde você vai estar se esse lucro/prejuízo se repetir no próximo período
        const vereditoFinal = saldoRealHoje + lucroNoPeriodo;
        setProjectedBalance(vereditoFinal);

        // --- CORREÇÃO DO GRÁFICO (PARA CIMA = LUCRO) ---
        const pontos = 25;
        const tempTrend = [];
        // Se lucroNoPeriodo for POSITIVO, a linha deve SUBIR (diminuir o Y no SVG)
        const intensidade = (lucroNoPeriodo / (Math.abs(saldoRealHoje) || 1000)) * 40;

        for (let i = 0; i < pontos; i++) {
          const p = i / (pontos - 1);
          const noise = Math.sin(i * 1.8) * 5;
          // No SVG, Y=10 é o topo e Y=90 é a base. Subtrair 'intensidade' faz a linha subir.
          const yCalculado = 60 - (intensidade * p) + noise;
          tempTrend.push({ x: i, y: Math.max(15, Math.min(85, yCalculado)) });
        }
        setTrendData(tempTrend);

      } catch (e) {
        console.error("Erro Crítico:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
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

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 uppercase">Polarity Fixed v4.29</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Chart */}
        <div className="bg-[#050505] rounded-[3.5rem] border border-white/5 p-12 flex flex-col items-center">
          <div className="relative w-64 h-64 mb-14">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map(r => ( 
                <polygon key={r} points={getDataPoints(stats.map(s => ({...s, value: r})))} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" /> 
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.05)" stroke="#facc15" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-12 gap-x-8 w-full text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black text-zinc-700 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-black italic text-white tracking-tighter leading-none">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard de Projeção Corrigido */}
        <div className="bg-[#050505] p-12 rounded-[3.5rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest uppercase">
              <TrendingUp size={14} className="text-yellow-500"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10">
              {(["dia", "semana", "mês"] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black scale-105' : 'text-zinc-700 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative mb-6">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.length > 0 && <circle cx="300" cy={trendData[trendData.length-1].y} r="6" fill="#facc15" className="animate-pulse" />}
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-8 mt-6">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-[0.6em] mb-2 uppercase tracking-widest leading-none">Análise de Fluxo</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase leading-none">Calculado</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-[0.2em] uppercase tracking-widest">Saldo Projetado</p>
              <p className={`text-5xl font-black italic leading-none tracking-tighter ${projectedBalance >= 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
