"use client";

import React, { useEffect, useState, useMemo } from "react";
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
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error || !rawData) throw error;
        if (!isMounted) return;

        // 1. SALDO ATUAL (SOMA DE TUDO NO BANCO)
        let saldoAtualTotal = 0;
        rawData.forEach(t => {
          const v = Math.abs(Number(t.amount));
          if (t.type.toLowerCase().trim() === 'income') saldoAtualTotal += v;
          else saldoAtualTotal -= v;
        });

        // 2. PADRÃO DAS ÚLTIMAS 24H (JANELA DESLIZANTE TEMPORAL)
        const agoraMs = new Date().getTime();
        const vinteQuatroHorasAtras = agoraMs - (24 * 60 * 60 * 1000);

        let ritmo24h = 0;
        rawData.filter(t => new Date(t.created_at).getTime() >= vinteQuatroHorasAtras).forEach(t => {
          const v = Math.abs(Number(t.amount));
          if (t.type.toLowerCase().trim() === 'income') ritmo24h += v;
          else ritmo24h -= v;
        });

        // 3. PROJEÇÃO LINEAR DIRETA (PADRÃO * CICLO)
        const multiplicador = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const ganhoTotalProjetado = ritmo24h * multiplicador;
        const resultadoFinal = saldoAtualTotal + ganhoTotalProjetado;
        
        setProjectedBalance(resultadoFinal);

        // 4. GRÁFICO DE TENDÊNCIA (INCLINAÇÃO REAL)
        const pontos = 50;
        const tempTrend = [];
        
        // Normalização para o gráfico ocupar o espaço do SVG (Y: 15 topo, 85 base)
        const minVal = Math.min(saldoAtualTotal, resultadoFinal);
        const maxVal = Math.max(saldoAtualTotal, resultadoFinal);
        const range = (maxVal - minVal) || 1;

        for (let i = 0; i < pontos; i++) {
          const p = i / (pontos - 1);
          const valorNoPonto = saldoAtualTotal + (ganhoTotalProjetado * p);
          
          // Inversão de Y: Valor maior = Y menor (sobe no gráfico)
          let yBase = 80 - ((valorNoPonto - minVal) / range) * 60;
          const noise = Math.sin(i * 1.2) * 2; 
          
          tempTrend.push({ x: i, y: yBase + noise });
        }
        setTrendData(tempTrend);

      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
  }, [periodo, router]);

  const getPath = () => {
    if (trendData.length < 2) return "";
    const step = 300 / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      return i === 0 ? `M ${x},${p.y}` : `${acc} L ${x},${p.y}`;
    }, "");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Status Grid */}
        <div className="bg-[#050505] rounded-[3.5rem] border border-white/5 p-12">
          <div className="grid grid-cols-3 gap-y-10 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black text-zinc-700 mb-1 tracking-widest">{s.label}</p>
                <p className="text-3xl font-black italic text-white leading-none">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard de Projeção Linear */}
        <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-white/5 relative shadow-2xl">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-500 tracking-widest flex items-center gap-2 uppercase">
              <TrendingUp size={14} className="text-yellow-500"/> Fluxo 24H
            </h4>
            <div className="flex bg-black p-1 rounded-2xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button 
                  key={t} onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black scale-105 shadow-xl' : 'text-zinc-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-44 w-full mb-10">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path 
                d={getPath()} 
                fill="none" 
                stroke={projectedBalance >= projectedBalance - (projectedBalance - projectedBalance) ? "#facc15" : "#ef4444"} 
                strokeWidth="16" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <circle cx="300" cy={trendData[trendData.length-1]?.y} r="10" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-10">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-widest uppercase mb-1">Ritmo Atual</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase">Linear 24H</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-widest uppercase">Veredito p/ {periodo}</p>
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
