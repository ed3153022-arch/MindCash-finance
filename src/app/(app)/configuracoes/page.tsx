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
  const [statusFeedback, setStatusFeedback] = useState({ label: "Analisando...", color: "text-zinc-500", icon: <Info size={16}/> });

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: rawData, error } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id);

        if (error || !rawData || rawData.length === 0) {
          setTrendData([{x: 0, y: 65}, {x: 300, y: 65}]);
          setLoading(false);
          return;
        }

        // 1. CALCULA O COMPORTAMENTO MÉDIO
        const totalEntradas = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const totalSaidas = rawData.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        
        // Se saldo for positivo, a linha deve subir. Se negativo, descer.
        const saldoFinal = totalEntradas - totalSaidas;
        const tendenciaBase = saldoFinal / rawData.length; // Média por transação

        // 2. GERA A PROJEÇÃO VISUAL
        const numDias = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const pontos = 60; // Pontos fixos para suavidade
        const tempPoints = [];

        for (let i = 0; i <= pontos; i++) {
          const x = (i / pontos) * 300; // Sempre preenche de 0 a 300
          
          // Ajuste de sensibilidade: Multiplicamos pelo período para a queda/subida ser visível
          const fatorEscala = periodo === "dia" ? 2 : periodo === "semana" ? 5 : 12;
          const inclinacao = (tendenciaBase / 10) * (i / 10) * fatorEscala;
          
          // Onda para dar movimento (seno e cosseno)
          const wave = Math.sin(i * 0.5) * 8;

          // Y: 65 é o centro. Invertemos a inclinação (subir saldo = diminuir Y no SVG)
          tempPoints.push({ 
            x: x, 
            y: Math.max(10, Math.min(125, 65 - inclinacao - wave)) 
          });
        }
        
        if (isMounted) {
          setTrendData(tempPoints);
          
          // Feedback baseado na tendência calculada
          if (saldoFinal > 0) {
            setStatusFeedback({ label: `PROJEÇÃO: TENDÊNCIA DE ALTA (+${numDias}D)`, color: "text-green-400", icon: <CheckCircle2 size={16}/> });
          } else {
            setStatusFeedback({ label: `PROJEÇÃO: TENDÊNCIA DE QUEDA (+${numDias}D)`, color: "text-red-500", icon: <AlertCircle size={16}/> });
          }
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
    const interval = periodo === "mês" ? 5 : 1;
    const lines = [];
    for (let i = 0; i <= numDias; i++) {
      const x = (300 / numDias) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="130" stroke="#FFFFFF" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.1" />
          {(i % interval === 0) && (
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
        .path-anim { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: draw 2s linear forwards; }
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
              TENDÊNCIA DA PRÓXIMA {periodo.toUpperCase()}
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
            {!loading && (
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
            )}
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
