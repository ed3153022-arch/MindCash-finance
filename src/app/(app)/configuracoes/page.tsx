"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  const [statusFeedback, setStatusFeedback] = useState({ label: "Analisando...", color: "text-zinc-500" });

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

        // 1. ANÁLISE DO PADRÃO (ÚLTIMAS 24H)
        const umDiaMs = 24 * 60 * 60 * 1000;
        const vinteQuatroHorasAtras = new Date().getTime() - umDiaMs;
        
        const transacoes24h = rawData.filter(t => new Date(t.created_at).getTime() >= vinteQuatroHorasAtras);
        
        let lucro24h = 0;
        let volumeTotal24h = 0; // Intensidade para os picos

        transacoes24h.forEach(t => {
          const v = Math.abs(Number(t.amount));
          volumeTotal24h += v;
          if (t.type.toLowerCase().trim() === 'income') lucro24h += v;
          else lucro24h -= v;
        });

        // 2. CONFIGURAÇÃO DA PROJEÇÃO
        const numDias = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const pontosPorDia = 6; // Mais pontos = picos mais definidos
        const totalPontos = numDias * pontosPorDia;
        const tempTrend = [];

        // Definimos a agressividade dos picos com base no volume financeiro real
        const agressividade = Math.min(Math.max(volumeTotal24h / 500, 5), 25); 
        const direcaoTendencia = lucro24h > 0 ? 30 : lucro24h < 0 ? -30 : 0;

        for (let i = 0; i <= totalPontos; i++) {
          const p = i / totalPontos;
          
          // O gráfico projeta o futuro: Tendência (direção) + Oscilação (padrão de gasto)
          // Usamos senos compostos para simular picos de "compras e ganhos" projetados
          const oscilacaoProjetada = Math.sin(i * 1.2) * agressividade + Math.cos(i * 0.5) * (agressividade / 2);
          
          const yBase = 60 - (direcaoTendencia * p) - oscilacaoProjetada;
          
          tempTrend.push({ 
            x: i * (300 / totalPontos), 
            y: Math.max(10, Math.min(110, yBase)) 
          });
        }
        setTrendData(tempTrend);

        // Feedback visual
        if (lucro24h > 0) setStatusFeedback({ label: "Projeção de Alta. Mantenha o Ritmo.", color: "text-yellow-400" });
        else if (lucro24h < 0) setStatusFeedback({ label: "Projeção Crítica. Reduza Gastos.", color: "text-red-500" });
        else setStatusFeedback({ label: "Tendência de Estabilidade.", color: "text-zinc-500" });

      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
  }, [periodo, router]);

  const getSmoothPath = () => {
    if (trendData.length < 2) return "";
    let d = `M ${trendData[0].x},${trendData[0].y}`;
    for (let i = 0; i < trendData.length - 1; i++) {
      const curr = trendData[i];
      const next = trendData[i + 1];
      const mx = (curr.x + next.x) / 2;
      const my = (curr.y + next.y) / 2;
      d += ` Q ${curr.x},${curr.y} ${mx},${my}`;
    }
    d += ` L ${trendData[trendData.length - 1].x},${trendData[trendData.length - 1].y}`;
    return d;
  };

  const renderGrid = () => {
    if (periodo === "dia") return null;
    const numDias = periodo === "semana" ? 7 : 30;
    const interval = periodo === "semana" ? 1 : 5;
    const lines = [];
    for (let i = 1; i <= numDias; i++) {
      const x = (300 / numDias) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.2" strokeDasharray="2 4" opacity="0.1" />
          {(i % interval === 0) && (
            <text x={x} y="118" fontSize="5" fill="#52525b" fontWeight="900" textAnchor="middle">+{i}D</text>
          )}
        </g>
      );
    }
    return lines;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 1500; } to { stroke-dashoffset: 0; } }
        .path-anim { stroke-dasharray: 1500; stroke-dashoffset: 1500; animation: draw 3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* Gráfico de Tendência Projetada */}
        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> WAVE_PROJECTION
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button key={t} onClick={() => setPeriodo(t)} 
                  className={`px-5 py-1.5 rounded-lg text-[8px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full mb-16 relative">
            <svg viewBox="0 0 300 130" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {renderGrid()}
              <path 
                key={periodo}
                d={getSmoothPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="3" 
                strokeLinecap="round" 
                className="path-anim"
              />
              <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="3" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-5 rounded-3xl border border-white/5">
            {statusFeedback.color.includes("yellow") ? <CheckCircle2 className="text-yellow-400" size={16}/> : <AlertCircle className="text-red-500" size={16}/>}
            <p className={`text-[9px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>
              {statusFeedback.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
