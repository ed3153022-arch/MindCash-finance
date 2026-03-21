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

        // 1. PADRÃO DAS ÚLTIMAS 24H
        const vinteQuatroHorasAtras = new Date().getTime() - (24 * 60 * 60 * 1000);
        let ritmo24h = 0;
        
        rawData.filter(t => new Date(t.created_at).getTime() >= vinteQuatroHorasAtras).forEach(t => {
          const v = Math.abs(Number(t.amount));
          if (t.type.toLowerCase().trim() === 'income') ritmo24h += v;
          else ritmo24h -= v;
        });

        // 2. LEGENDA DINÂMICA
        if (ritmo24h > 0) {
          setStatusFeedback({ label: "Padrão de Acúmulo Positivo Detectado.", color: "text-yellow-400" });
        } else if (ritmo24h < 0) {
          setStatusFeedback({ label: "Atenção: Fluxo de Caixa Negativo.", color: "text-red-500" });
        } else {
          setStatusFeedback({ label: "Ritmo Estável nas últimas 24h.", color: "text-zinc-500" });
        }

        // 3. CONSTRUÇÃO DO GRÁFICO
        const pontos = 60;
        const tempTrend = [];
        const inclinacao = ritmo24h > 0 ? 35 : ritmo24h < 0 ? -35 : 0;

        for (let i = 0; i < pontos; i++) {
          const p = i / (pontos - 1);
          const y = 50 - (inclinacao * p) - (Math.sin(i * 1.5) * 2);
          tempTrend.push({ x: i, y: Math.max(10, Math.min(90, y)) });
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

  // Renderiza Grid com Números dos Dias
  const renderGrid = () => {
    if (periodo === "dia") return null;
    const numLinhas = periodo === "semana" ? 7 : 30;
    const interval = periodo === "semana" ? 1 : 5; // Mostrar de 5 em 5 no mês para não poluir
    const lines = [];
    
    for (let i = 1; i <= numLinhas; i++) {
      const x = (300 / numLinhas) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.3" strokeDasharray="3 3" opacity="0.1" />
          {(i % interval === 0 || i === 1) && (
            <text x={x} y="115" fontSize="6" fill="#3f3f46" fontWeight="900" textAnchor="middle">
              D{i}
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
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .animate-path {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawLine 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

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

        {/* Bloco do Gráfico Animado */}
        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-[10px] font-black text-zinc-500 tracking-widest flex items-center gap-2 uppercase">
              <TrendingUp size={14} className="text-yellow-500"/> Projeção Temporal
            </h4>
            <div className="flex bg-black p-1 rounded-2xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button 
                  key={t} onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full mb-16 relative">
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {renderGrid()}
              <path 
                key={`${periodo}-${trendData.length}`} // Força re-render para reiniciar animação
                d={getPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="20" 
                strokeLinecap="round" 
                className="animate-path"
              />
            </svg>
          </div>

          <div className="flex items-center gap-4 bg-black/60 p-6 rounded-[2rem] border border-white/5 mb-8">
            {statusFeedback.color.includes("yellow") ? <CheckCircle2 className="text-yellow-400" size={20}/> : <AlertCircle className="text-red-500" size={20}/>}
            <p className={`text-[10px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>
              {statusFeedback.label}
            </p>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-between items-center opacity-30">
             <p className="text-[7px] font-black tracking-[0.5em]">MIND CASH / EIXO TEMPORAL</p>
             <div className="flex gap-1">
               {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-white rounded-full"></div>)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
