"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  const [statusFeedback, setStatusFeedback] = useState({ label: "Analisando Projeção...", color: "text-zinc-500", icon: <Info size={16}/> });

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
        const volumesHistoricos: number[] = [];

        for (let i = 0; i < 30; i++) {
          const dRef = new Date();
          dRef.setDate(agora.getDate() - i);
          const volume = rawData
            .filter(t => new Date(t.created_at).toDateString() === dRef.toDateString())
            .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          volumesHistoricos.push(volume);
        }

        // AJUSTE: Normalização dos pontos para o gráfico sempre ir até o final (300px)
        const pontosPorDia = 8; 
        const totalPontos = numDiasProjecao * pontosPorDia;
        const tempPoints = [];

        for (let i = 0; i <= totalPontos; i++) {
          // Garante que o índice do dia circule corretamente pelos dados históricos
          const diaSimulado = Math.floor(i / pontosPorDia) % volumesHistoricos.length;
          const volBase = volumesHistoricos[diaSimulado] || 100;
          
          const amplitude = Math.min(Math.max(volBase / 70, 15), 55);
          const wave = Math.sin(i * 0.9) * amplitude + Math.cos(i * 0.4) * (amplitude / 1.2);
          
          tempPoints.push({ 
            x: (i / totalPontos) * 300, // Ajuste para ocupar sempre os 300px de largura
            y: Math.max(8, Math.min(122, 65 - wave)) 
          });
        }
        setTrendData(tempPoints);

        const ultimoPontoY = tempPoints[tempPoints.length - 1].y;
        
        // Texto dinâmico para a projeção do mês
        const labelTempo = periodo === "dia" ? "PRÓXIMO DIA" : periodo === "semana" ? "PRÓXIMA SEMANA" : "PRÓXIMO MÊS";

        if (ultimoPontoY < 45) {
          setStatusFeedback({ label: `PROJEÇÃO: ENTRADAS ELEVADAS NO ${labelTempo}`, color: "text-green-400", icon: <CheckCircle2 className="text-green-400" size={16}/> });
        } else if (ultimoPontoY > 85) {
          setStatusFeedback({ label: `PROJEÇÃO: SAÍDAS CRÍTICAS NO ${labelTempo}`, color: "text-red-500", icon: <AlertCircle className="text-red-500" size={16}/> });
        } else {
          setStatusFeedback({ label: `PROJEÇÃO: FLUXO MODERADO NO ${labelTempo}`, color: "text-yellow-400", icon: <TrendingUp className="text-yellow-400" size={16}/> });
        }

      } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }
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
    const numDias = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
    const intervalLabel = periodo === "mês" ? 5 : 1;
    const lines = [];

    for (let i = 0; i <= numDias; i++) {
      const x = (300 / numDias) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="130" stroke="#FFFFFF" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.1" />
          {(i % intervalLabel === 0) && (
            <text x={x} y="150" fontSize="6" fill="#FFFFFF" fontWeight="900" textAnchor="middle" opacity="0.4">+{i}D</text>
          )}
        </g>
      );
    }
    return lines;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
        .path-anim { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: draw 3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> 
              TENDÊNCIA DO PRÓXIMO {periodo === "dia" ? "DIA" : periodo === "semana" ? "SEMANA" : "MÊS"}
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
            <svg viewBox="0 -10 300 170" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {renderGrid()}
              <path 
                key={periodo}
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
            {statusFeedback.icon}
            <p className={`text-[9px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>
              {statusFeedback.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
