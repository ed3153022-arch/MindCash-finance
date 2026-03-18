"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  
  const [stats, setStats] = useState([
    { label: "Disciplina", value: 0 },
    { label: "Produtividade", value: 0 },
    { label: "Conhecimento", value: 0 },
    { label: "Resiliência", value: 0 },
    { label: "Autocontrole", value: 0 },
    { label: "Visão", value: 0 },
  ]);

  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);

  // Geometria do Radar (Teia)
  const getPoints = (r: number) => {
    let p = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 90) * (Math.PI / 180);
      p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
    }
    return p.join(" ");
  };

  const getDataPoints = useCallback((st: any[]) => {
    let p = [];
    for (let i = 0; i < 6; i++) {
      const r = (st[i].value / 100) * 50;
      const a = (i * 60 - 90) * (Math.PI / 180);
      p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
    }
    return p.join(" ");
  }, []);

  useEffect(() => {
    async function calculatePreciseVeredito() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        // --- CÁLCULOS DE ALTA PRECISÃO (TEIA) ---
        const totalLimite = goals.reduce((acc, g) => acc + Number(g.amount || 0), 0) || 1;
        const totalGasto = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalGanho = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        
        const categoriasEstouradas = goals.filter(g => {
          const gastoNaCategoria = txs.filter(t => t.category === g.title && t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);
          return gastoNaCategoria > Number(g.amount);
        }).length;

        const norm = (v: number) => Math.max(5, Math.min(100, Math.round(v)));

        setStats([
          { label: "Disciplina", value: norm((txs.length / 20) * 100) },
          { label: "Produtividade", value: norm(goals.length > 0 ? ((goals.length - categoriasEstouradas) / goals.length) * 100 : 50) },
          { label: "Conhecimento", value: norm(txs.filter(t => /educa|livro|curso|invest/i.test(t.category || "")).length * 35) },
          { label: "Resiliência", value: norm(100 - ((totalGasto / totalLimite) * 50)) },
          { label: "Autocontrole", value: norm(Math.max(0, 100 - (totalGasto / totalLimite * 100))) },
          { label: "Visão", value: norm(totalGanho > 0 ? (totalGanho / totalLimite) * 100 : 20) },
        ]);

        // --- TENDÊNCIA DIRECIONAL COM ZOOM ---
        const numPontos = periodo === "dia" ? 10 : periodo === "semana" ? 7 : 12; // Menos pontos para clareza
        const saldoFinal = totalGanho - totalGasto;
        const direcaoFinal = (saldoFinal / totalLimite) * 50; // Inclinação baseada no lucro/prejuízo
        
        let projection = [];
        const seed = Date.now() / 10000;

        for (let i = 0; i < numPontos; i++) {
          const progresso = i / (numPontos - 1);
          // Ruído agudo controlado (Estilo Faca)
          const oscilacao = (Math.sin(i * 1.5 + seed) * 12) + (Math.cos(i * 2.2) * 5);
          
          // Cálculo Y: 50 é o centro, direcaoFinal puxa o fim da linha, oscilacao dá o visual agressivo
          const yPos = 50 - (progresso * direcaoFinal) + oscilacao;
          
          // Trava de segurança para o gráfico não sumir e manter o Zoom
          projection.push({ x: i, y: Math.max(10, Math.min(90, yPos)) });
        }
        setTrendData(projection);

      } catch (e) {
        console.error("Erro no Veredito:", e);
      } finally {
        setLoading(false);
      }
    }
    calculatePreciseVeredito();
  }, [periodo, router, getDataPoints]);

  const getTrendPath = () => {
    if (!trendData.length) return "";
    const width = 300;
    const step = width / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      // Estilo Linear Agudo
      return i === 0 ? `M ${x},${p.y}` : `${acc} L ${x},${p.y}`;
    }, "");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-yellow-400 font-black italic tracking-widest uppercase">
      <Loader2 className="animate-spin mb-4" size={40} />
      CALIBRANDO FUTURO...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-10 pt-8 relative">
        
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-700 text-[8px] font-bold tracking-[0.6em] mt-3">Intelligence Forecast System</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Performance */}
        <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-56 h-56 mb-12">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.15" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.08)" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-6 w-full border-t border-white/5 pt-10 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[7px] font-black text-zinc-600 mb-2 tracking-widest">{s.label}</p>
                <p className="text-4xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Forecast com Direção e Zoom */}
        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-[10px] font-black text-zinc-500 italic flex items-center gap-3 uppercase">
              <TrendingUp size={16} className="text-yellow-400"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10 shadow-inner">
              {["dia", "semana", "mês"].map(t => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t as any)} 
                  className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-zinc-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-44 w-full relative px-2">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Sombra de brilho para profundidade */}
              <path 
                d={getTrendPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ filter: 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.4))' }} 
              />
              {trendData.length > 0 && (
                <circle cx="300" cy={trendData[trendData.length-1].y} r="5" fill="#facc15" className="animate-pulse" />
              )}
            </svg>
          </div>
          <p className="text-[7px] text-zinc-800 font-black mt-8 text-center tracking-[0.6em]">PREDICATIVE ALGORITHM v4.4 [ZOOM ACTIVE]</p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-6 text-zinc-800 font-black text-[10px] tracking-[0.7em] hover:text-yellow-400 transition-all border-t border-white/5">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}
