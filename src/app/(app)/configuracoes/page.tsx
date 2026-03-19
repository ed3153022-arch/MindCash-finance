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
        // RESET TOTAL: Garante que o número anterior suma da tela imediatamente
        setProjectedBalance(0); 

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // Busca todas as transações sem filtros de data no banco para evitar erro de timezone
        const { data: rawData, error } = await supabase
          .from("transactions")
          .select("amount, type, created_at")
          .eq("user_id", user.id);

        if (error || !rawData) throw error;
        if (!isMounted) return;

        // --- LÓGICA MATEMÁTICA PURA ---
        const agora = new Date().getTime();
        const ranges = { dia: 24 * 60 * 60 * 1000, semana: 7 * 24 * 60 * 60 * 1000, mês: 30 * 24 * 60 * 60 * 1000 };
        const limite = agora - ranges[periodo];

        let saldoTotalGeral = 0;
        let lucroNoPeriodo = 0;

        rawData.forEach(t => {
          const valor = Number(parseFloat(t.amount as any).toFixed(2));
          const isEntrada = t.type === 'income';
          const dataMs = new Date(t.created_at).getTime();

          // Calcula Saldo Atual (Tudo)
          if (isEntrada) saldoTotalGeral += valor;
          else saldoTotalGeral -= valor;

          // Calcula Performance (Apenas o range do botão)
          if (dataMs >= limite) {
            if (isEntrada) lucroNoPeriodo += valor;
            else lucroNoPeriodo -= valor;
          }
        });

        // O VEREDITO: Saldo que você tem + Tendência do que aconteceu no período
        const calculoFinal = saldoTotalGeral + lucroNoPeriodo;
        setProjectedBalance(calculoFinal);

        // --- RESTAURAÇÃO DO GRÁFICO ---
        const pontos = periodo === "dia" ? 15 : 30;
        const novoGrafico = [];
        const baseLine = 50;
        const variacaoTendencia = (lucroNoPeriodo / (Math.abs(saldoTotalGeral) || 1)) * 30;

        for (let i = 0; i < pontos; i++) {
          const prog = i / (pontos - 1);
          const oscilacao = Math.sin(i * 1.2) * 8;
          novoGrafico.push({ 
            x: i, 
            y: baseLine - (variacaoTendencia * prog) - oscilacao 
          });
        }
        setTrendData(novoGrafico);

      } catch (e) {
        console.error("Erro MindCash:", e);
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
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 uppercase">Dynamic Sync v4.27</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Chart (Visual Fixo) */}
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

        {/* Dashboard de Tendência */}
        <div className="bg-[#050505] p-12 rounded-[3.5rem] border border-white/5 relative shadow-2xl">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest uppercase">
              <TrendingUp size={14} className="text-yellow-500"/> Tendência {periodo}
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
              <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {trendData.length > 0 && <circle cx="300" cy={trendData[trendData.length-1].y} r="6" fill="#facc15" className="animate-pulse" />}
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-8 mt-6">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-[0.6em] mb-2 uppercase">Status Online</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase leading-none">Sistema Ativo</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-[0.2em] uppercase">Saldo Projetado ({periodo})</p>
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
