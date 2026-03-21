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

        const numDiasProjecao = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const agora = new Date();
        const volumesPorDia: number[] = [];

        // Coleta de volume real para alimentar a projeção
        for (let i = 0; i < numDiasProjecao; i++) {
          const dRef = new Date();
          dRef.setDate(agora.getDate() - i);
          const volume = rawData
            .filter(t => new Date(t.created_at).toDateString() === dRef.toDateString())
            .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          volumesPorDia.push(volume);
        }

        const pontosPorDia = 8;
        const totalPontos = numDiasProjecao * pontosPorDia;
        const tempPoints = [];

        for (let i = 0; i <= totalPontos; i++) {
          const diaIndex = Math.floor(i / pontosPorDia) % volumesPorDia.length;
          const volume = volumesPorDia[diaIndex] || 50;
          const amplitude = Math.min(Math.max(volume / 80, 10), 50); // Picos agressivos baseados em dados
          
          const wave = Math.sin(i * 1.1) * amplitude + Math.cos(i * 0.6) * (amplitude / 1.5);
          tempPoints.push({ x: i * (300 / totalPontos), y: 65 - wave });
        }

        setTrendData(tempPoints);
        setStatusFeedback({ label: "Projeção de Fluxo Atualizada.", color: "text-yellow-400" });

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

  // Renderiza as linhas tracejadas verticais para cada dia
  const renderGrid = () => {
    if (periodo === "dia") return null;
    const numLinhas = periodo === "semana" ? 7 : 30;
    const interval = periodo === "semana" ? 1 : 5;
    const lines = [];
    for (let i = 1; i <= numLinhas; i++) {
      const x = (300 / numLinhas) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="130" stroke="white" strokeWidth="0.2" strokeDasharray="2 3" opacity="0.15" />
          {(i % interval === 0) && (
            <text x={x} y="145" fontSize="5" fill="#3f3f46" fontWeight="900" textAnchor="middle">+{i}D</text>
          )}
        </g>
      );
    }
    return lines;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes drawLine { 
          from { stroke-dashoffset: 1800; } 
          to { stroke-dashoffset: 0; } 
        }
        .path-anim { 
          stroke-dasharray: 1800; 
          stroke-dashoffset: 1800; 
          animation: drawLine 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; 
        }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> REAL_TIME_WAVE
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
          
          <div className="h-64 w-full mb-12 relative px-2">
            <svg viewBox="0 0 300 130" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {renderGrid()}
              <path 
                key={periodo} // Reinicia animação ao trocar período
                d={getSmoothPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="4" 
                strokeLinecap="round" 
                className="path-anim"
              />
              <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="4" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex items-center gap-4 bg-black/60 p-5 rounded-3xl border border-white/5">
            <CheckCircle2 className="text-yellow-400" size={16}/>
            <p className={`text-[9px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>
              {statusFeedback.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
