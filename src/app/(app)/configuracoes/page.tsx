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

        // --- MOTOR DE PROJEÇÃO TEMPORAL ---
        const agora = new Date().getTime();
        const umDiaMs = 24 * 60 * 60 * 1000;
        
        // Definimos os dias para a projeção futura
        const diasFuturos = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        
        let saldoAtualReal = 0;
        let ganhoDiarioMedio = 0;
        let gastoDiarioMedio = 0;

        // Calculamos o saldo total e o ritmo dos últimos 30 dias para ter uma média estável
        const limiteMediaMs = agora - (30 * umDiaMs);

        rawData.forEach(t => {
          const valor = Math.abs(Number(t.amount));
          const isEntrada = t.type.toLowerCase().trim() === 'income';
          const dataMs = new Date(t.created_at).getTime();

          // Saldo hoje
          if (isEntrada) saldoAtualReal += valor;
          else saldoAtualReal -= valor;

          // Ritmo diário (baseado nos últimos 30 dias para precisão)
          if (dataMs >= limiteMediaMs) {
            if (isEntrada) ganhoDiarioMedio += (valor / 30);
            else gastoDiarioMedio += (valor / 30);
          }
        });

        // CÁLCULO FINAL: Saldo Atual + (Ritmo Líquido Diário * Dias que faltam)
        const ritmoLiquidoDiario = ganhoDiarioMedio - gastoDiarioMedio;
        const estimativaFinal = saldoAtualReal + (ritmoLiquidoDiario * diasFuturos);

        setProjectedBalance(estimativaFinal);

        // --- GRÁFICO TÉCNICO DE ALTA PRECISÃO ---
        const pontos = 40; // Mais pontos = linha mais detalhada
        const tempTrend = [];
        
        // A inclinação reflete se você está acumulando ou perdendo dinheiro no tempo
        const inclinacao = (ritmoLiquidoDiario * diasFuturos / (Math.abs(saldoAtualReal) || 1000)) * 60;

        for (let i = 0; i < pontos; i++) {
          const p = i / (pontos - 1);
          // Complexidade visual: soma de ondas para parecer um gráfico de trading real
          const noise = Math.sin(i * 0.9) * 5 + Math.cos(i * 0.4) * 3 + (Math.random() * 2);
          const yPos = 60 - (inclinacao * p) - noise;
          
          tempTrend.push({ x: i, y: Math.max(15, Math.min(85, yPos)) });
        }
        setTrendData(tempTrend);

      } catch (e) {
        console.error("Erro na Projeção:", e);
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
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 uppercase">Continuity Forecast v4.31</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Dashboard de Projeção Temporal */}
        <div className="bg-[#050505] p-12 rounded-[3.5rem] border border-white/5 relative shadow-2xl">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest uppercase">
              <TrendingUp size={14} className="text-yellow-500"/> Projeção para {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10">
              {(["dia", "semana", "mês"] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black scale-105 shadow-xl' : 'text-zinc-700 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative mb-6">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.length > 0 && <circle cx="300" cy={trendData[trendData.length-1].y} r="6" fill="#facc15" className="animate-pulse" />}
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-8 mt-6">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-[0.6em] mb-2 uppercase leading-none">Veredito Final</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase leading-none">Análise de Ritmo</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-[0.2em] uppercase tracking-widest">Saldo Final Estimado</p>
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
