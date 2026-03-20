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
          .eq("user_id", user.id);

        if (error || !rawData) throw error;
        if (!isMounted) return;

        // --- CÁLCULO DE SALDO E PERFORMANCE ---
        let saldoAtualNoBanco = 0;
        let totalEntradasPeriodo = 0;
        let totalSaidasPeriodo = 0;

        const agora = new Date().getTime();
        const umDiaMs = 24 * 60 * 60 * 1000;
        const limiteMs = agora - (periodo === "dia" ? umDiaMs : periodo === "semana" ? umDiaMs * 7 : umDiaMs * 30);

        rawData.forEach(t => {
          const valor = Math.abs(Number(t.amount));
          const isEntrada = t.type.toLowerCase().trim() === 'income';
          const dataMs = new Date(t.created_at).getTime();

          // 1. Saldo Real (Sincronizado com o Dashboard)
          if (isEntrada) saldoAtualNoBanco += valor;
          else saldoAtualNoBanco -= valor;

          // 2. Performance Líquida (Apenas o que aconteceu no período)
          if (dataMs >= limiteMs) {
            if (isEntrada) totalEntradasPeriodo += valor;
            else totalSaidasPeriodo += valor;
          }
        });

        // O VEREDITO: Saldo Atual + O Lucro/Prejuízo que você teve no período
        // Isso mostra como você termina o próximo ciclo mantendo o mesmo ritmo.
        const performanceLiquida = totalEntradasPeriodo - totalSaidasPeriodo;
        setProjectedBalance(saldoAtualNoBanco + performanceLiquida);

        // --- GRÁFICO DINÂMICO DE ALTA DEFINIÇÃO ---
        const pontos = 50;
        const tempTrend = [];
        // Se a performance for positiva, a linha SOBE drasticamente
        const ratio = (performanceLiquida / (Math.abs(saldoAtualNoBanco) || 1000)) * 80;

        for (let i = 0; i < pontos; i++) {
          const p = i / (pontos - 1);
          // Adicionando um desenho muito mais detalhado e técnico
          const jitter = Math.sin(i * 1.2) * 6 + Math.cos(i * 0.5) * 4;
          const yBase = 65 - (ratio * p) - jitter;
          tempTrend.push({ x: i, y: Math.max(10, Math.min(90, yBase)) });
        }
        setTrendData(tempTrend);

      } catch (e) {
        console.error("Erro Fatal:", e);
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
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 uppercase">Final Precision v4.32</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Chart Visual */}
        <div className="bg-[#050505] rounded-[3.5rem] border border-white/5 p-12 flex flex-col items-center shadow-2xl">
           <div className="relative w-64 h-64 mb-14">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
              {[20, 40, 60, 80, 100].map(r => ( 
                <polygon key={r} points={stats.map((s, i) => {
                  const a = (i * 60 - 90) * (Math.PI / 180);
                  return `${50 + (r/100*45) * Math.cos(a)},${50 + (r/100*45) * Math.sin(a)}`;
                }).join(" ")} fill="none" stroke="white" strokeWidth="0.1" opacity="0.2" /> 
              ))}
              <polygon points={stats.map((s, i) => {
                const a = (i * 60 - 90) * (Math.PI / 180);
                const r = (s.value / 100) * 45;
                return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
              }).join(" ")} fill="rgba(250, 204, 21, 0.1)" stroke="#facc15" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-8 w-full text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black text-zinc-700 mb-1 tracking-widest">{s.label}</p>
                <p className="text-3xl font-black italic text-white tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard de Projeção */}
        <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest">
              <TrendingUp size={14} className="text-yellow-500"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1 rounded-2xl border border-white/10">
              {(["dia", "semana", "mês"] as const).map(t => (
                <button 
                  key={t} onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-40 w-full relative mb-10">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="300" cy={trendData[trendData.length-1]?.y || 50} r="8" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-10">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-widest mb-1 uppercase">Veredito Final</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase">Análise de Fluxo</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-widest uppercase">Saldo Final Estimado</p>
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
