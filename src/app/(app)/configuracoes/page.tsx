"use client";

import React, { useEffect, useState } from "react";
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

        const pontosPorDia = periodo === "mês" ? 5 : 10;
        const totalPontos = numDiasProjecao * pontosPorDia;
        const tempPoints = [];

        for (let i = 0; i <= totalPontos; i++) {
          const diaSimulado = Math.floor(i / pontosPorDia) % volumesHistoricos.length;
          const volBase = volumesHistoricos[diaSimulado] || 100;
          
          // Fator de amplitude agressivo, mas controlado para não vazar
          // O viewBox agora vai de 0 a 200, dando mais "respiro" interno
          const amplitude = Math.min(Math.max(volBase / 60, 20), 80);
          
          const wave = Math.sin(i * 0.8) * amplitude + Math.cos(i * 0.4) * (amplitude / 1.3);
          
          tempPoints.push({ 
            x: i * (300 / totalPontos),
            // Centralizamos em 100 (metade de 200) e limitamos entre 10 e 190
            y: Math.max(10, Math.min(190, 100 - wave))
          });
        }
        setTrendData(tempPoints);

        const ultimoPontoY = tempPoints[tempPoints.length - 1].y;
        if (ultimoPontoY < 80) {
          setStatusFeedback({ label: `PROJEÇÃO: ENTRADAS ELEVADAS (+${numDiasProjecao}D)`, color: "text-green-400", icon: <CheckCircle2 className="text-green-400" size={16}/> });
        } else if (ultimoPontoY > 120) {
          setStatusFeedback({ label: `PROJEÇÃO: SAÍDAS CRÍTICAS (+${numDiasProjecao}D)`, color: "text-red-500", icon: <AlertCircle className="text-red-500" size={16}/> });
        } else {
          setStatusFeedback({ label: `PROJEÇÃO: FLUXO MODERADO (+${numDiasProjecao}D)`, color: "text-yellow-400", icon: <TrendingUp className="text-yellow-400" size={16}/> });
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
    if (periodo === "dia") return null;
    const numDias = periodo === "semana" ? 7 : 30;
    const interval = periodo === "semana" ? 1 : 5;
    const lines = [];
    for (let i = 0; i <= numDias; i++) {
      const x = (300 / numDias) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="200" stroke="white" strokeWidth="0.3" strokeDasharray="2 4" opacity="0.08" />
          {(i % interval === 0) && (
            <text x={x} y="220" fontSize="7" fill="#52525b" fontWeight="900" textAnchor="middle">+{i}D</text>
          )}
        </g>
      );
    }
    return lines;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 2500; } to { stroke-dashoffset: 0; } }
        .path-anim { stroke-dasharray: 2500; stroke-dashoffset: 2500; animation: draw 3.2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start px-2">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> NEXT_MONTH_WAVE
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
          
          {/* Aumentamos o viewBox vertical de 130 para 200 para dar espaço aos picos */}
          <div className="h-80 w-full mb-12 relative px-2">
            <svg viewBox="0 0 300 230" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {renderGrid()}
              <path 
                key={periodo}
                d={getSmoothPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="5" 
                strokeLinecap="round" 
                className="path-anim"
              />
              <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="5" fill="#facc15" className="animate-pulse" />
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
