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

        // 1. RITMO 24H (BASE DA INCLINAÇÃO)
        const vinteQuatroHorasAtras = new Date().getTime() - (24 * 60 * 60 * 1000);
        let ritmo24h = 0;
        rawData.filter(t => new Date(t.created_at).getTime() >= vinteQuatroHorasAtras).forEach(t => {
          const v = Math.abs(Number(t.amount));
          if (t.type.toLowerCase().trim() === 'income') ritmo24h += v;
          else ritmo24h -= v;
        });

        // 2. FEEDBACK
        if (ritmo24h > 0) setStatusFeedback({ label: "Padrão de Crescimento Ativo.", color: "text-yellow-400" });
        else if (ritmo24h < 0) setStatusFeedback({ label: "Alerta de Fluxo Negativo.", color: "text-red-500" });
        else setStatusFeedback({ label: "Ritmo de Manutenção.", color: "text-zinc-500" });

        // 3. GERAÇÃO DE PICOS AGRESSIVOS (CURVA POR DIA)
        const numDias = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const pontosPorDia = 4; // Aumenta a resolução para criar picos
        const totalPontos = numDias * pontosPorDia;
        const tempTrend = [];
        
        const inclinacaoBase = ritmo24h > 0 ? 30 : ritmo24h < 0 ? -30 : 0;

        for (let i = 0; i <= totalPontos; i++) {
          const p = i / totalPontos;
          // Picos agressivos: combinando senos de frequências diferentes
          const picoAgressivo = Math.sin(i * 1.5) * 15 + Math.cos(i * 0.8) * 5;
          const yBase = 55 - (inclinacaoBase * p) - picoAgressivo;
          
          tempTrend.push({ x: i * (300 / totalPontos), y: Math.max(10, Math.min(95, yBase)) });
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

  // Função para criar Path com Curvas Beziér (Suavidade + Picos)
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
    
    const last = trendData[trendData.length - 1];
    d += ` L ${last.x},${last.y}`;
    return d;
  };

  const renderGrid = () => {
    if (periodo === "dia") return null;
    const numLinhas = periodo === "semana" ? 7 : 30;
    const interval = periodo === "semana" ? 1 : 5;
    const lines = [];
    
    for (let i = 1; i <= numLinhas; i++) {
      const x = (300 / numLinhas) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.2" strokeDasharray="2 4" opacity="0.1" />
          {(i % interval === 0) && (
            <text x={x} y="118" fontSize="5" fill="#52525b" fontWeight="900" textAnchor="middle">
              {i}D
            </text>
          )}
        </g>
      );
    }
    return lines;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes drawPath { from { stroke-dashoffset: 1200; } to { stroke-dashoffset: 0; } }
        .path-anim { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: drawPath 2.5s ease-out forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* Radar de Atributos */}
        <div className="bg-[#050505] rounded-[3rem] border border-white/5 p-12">
          <div className="grid grid-cols-3 gap-y-10 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[7px] font-black text-zinc-800 mb-1 tracking-widest">{s.label}</p>
                <p className="text-3xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Alta Definição */}
        <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-white/5 relative shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> WAVE_ANALYSIS
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button 
                  key={t} onClick={() => setPeriodo(t)} 
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
                key={`${periodo}-${trendData.length}`}
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

          {/* Feedback Label */}
          <div className="flex items-center gap-4 bg-black/40 p-5 rounded-3xl border border-white/5">
            {statusFeedback.color.includes("yellow") ? <CheckCircle2 className="text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]" size={16}/> : <AlertCircle className="text-red-500" size={16}/>}
            <p className={`text-[9px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>
              {statusFeedback.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
