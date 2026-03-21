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
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error || !rawData) throw error;
        if (!isMounted) return;

        // 1. ANÁLISE DE VOLUMES REAIS POR DIA
        const numDiasProjecao = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const volumesPorDia: number[] = [];
        const agora = new Date();

        // Pegamos o volume de transações dos últimos dias para "ensinar" a projeção
        for (let i = 0; i < numDiasProjecao; i++) {
          const dRef = new Date();
          dRef.setDate(agora.getDate() - i);
          
          const volumeDia = rawData
            .filter(t => new Date(t.created_at).toDateString() === dRef.toDateString())
            .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          
          volumesPorDia.push(volumeDia);
        }

        // 2. GERAÇÃO DA PROJEÇÃO DINÂMICA
        const pontosPorDia = 6;
        const totalPontos = numDiasProjecao * pontosPorDia;
        const tempPoints = [];
        
        // Fator de sensibilidade: transforma o valor real em altura de pico no SVG
        // Sem "zoom", apenas mapeamento direto de escala
        const getSensibilidade = (val: number) => Math.min(Math.max(val / 100, 5), 45);

        for (let i = 0; i <= totalPontos; i++) {
          const p = i / totalPontos;
          const diaIndex = Math.floor(i / pontosPorDia) % volumesPorDia.length;
          const volumeBase = volumesPorDia[diaIndex] || 100; // Fallback se o dia for vazio
          
          const amplitude = getSensibilidade(volumeBase);
          
          // Ondas baseadas no comportamento real do usuário
          const wave = Math.sin(i * 1.2) * amplitude + Math.cos(i * 0.7) * (amplitude / 2);
          
          // Y centralizado em 60 para evitar espaços vazios excessivos
          const y = 60 - wave;
          
          tempPoints.push({ x: i * (300 / totalPontos), y: Math.max(5, Math.min(115, y)) });
        }

        setTrendData(tempPoints);

        // Feedback baseado no lucro total do período analisado
        const lucroTotal = rawData.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
        setStatusFeedback(lucroTotal >= 0 
          ? { label: "Padrão de Retenção Saudável.", color: "text-yellow-400" }
          : { label: "Alerta: Volume de Saídas Elevado.", color: "text-red-500" }
        );

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

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes drawLine { from { stroke-dashoffset: 1500; } to { stroke-dashoffset: 0; } }
        .path-active { stroke-dasharray: 1500; stroke-dashoffset: 1500; animation: drawLine 2.5s ease-out forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* Container do Gráfico */}
        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] uppercase flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> REAL_TIME_PROJECTION
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
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path 
                key={periodo}
                d={getSmoothPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                className="path-active"
              />
              <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="3.5" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex items-center gap-4 bg-black/60 p-5 rounded-3xl border border-white/5">
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
