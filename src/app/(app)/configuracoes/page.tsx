"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// Função de ruído poligonal (Agressiva/Faca) baseada no exemplo
const generatePolyNoise = (size: number, amplitude: number) => {
  const noise = [];
  const seed = Date.now() / 10000;
  for (let i = 0; i < size; i++) {
    // Ruído matemático agressivo
    const val = (Math.sin(i * 1.0 + seed) * 1.5) + (Math.sin(i * 3.1) * 0.7);
    noise.push((val / 2.2) * amplitude);
  }
  return noise;
};

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

  // Funções Radar (Mantidas estáveis)
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
    async function calculateHighPrecisionSystem() {
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

        // --- CÁLCULO DE PERFORMANCE (TEIA) REFRESH ---
        const totalLimite = goals.reduce((acc, g) => acc + Number(g.amount || g.target_value || 0), 0) || 1;
        const totalGasto = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalGanho = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        
        // Produtividade: Categorias que NÃO estouraram o limite
        const categoriasEstouradas = goals.filter(g => {
          const gastoNaCategoria = txs
            .filter(t => t.category === g.title && t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);
          return gastoNaCategoria > Number(g.amount || g.target_value);
        }).length;

        const norm = (v: number) => Math.max(5, Math.min(100, Math.round(v)));
        const percUsoTotal = (totalGasto / totalLimite) * 100;

        setStats([
          { label: "Disciplina", value: norm((txs.length / 25) * 100) },
          { label: "Produtividade", value: norm(goals.length > 0 ? ((goals.length - categoriasEstouradas) / goals.length) * 100 : 50) },
          { label: "Conhecimento", value: norm(txs.filter(t => t.category?.toLowerCase().includes("educa")).length * 30) },
          { label: "Resiliência", value: norm(100 - (percUsoTotal > 100 ? (percUsoTotal - 100) : 0)) },
          { label: "Autocontrole", value: norm(Math.max(0, 100 - percUsoTotal)) },
          { label: "Visão", value: norm((totalGanho > 0 ? (totalGanho / totalLimite) * 100 : 20)) },
        ]);

        // --- LÓGICA DE TENDÊNCIAS AGRESSIVAS (LINHA "FACA") ---
        const numPontos = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const fluxoMensal = totalGanho - totalGasto;
        
        // 1. Amplitude agressiva para ocupar todo o espaço vertical (Precisão/Volatilidade)
        // Baseada na porcentagem do limite total.
        const amplitudePicos = Math.max(20, norm((saldoReal / totalLimite) * 50)); 
        const noiseArray = generatePolyNoise(numPontos, amplitudePicos);

        let projection = [];
        for (let i = 0; i < numPontos; i++) {
          // Centralizamos e adicionamos a oscilação agressiva poligonal
          // A tendência do saldo agora empurra o gráfico mais forte para cima ou para baixo.
          const yBase = 50 - (fluxoMensal / totalLimite * 15) + noiseArray[i];
          projection.push({ x: i, y: norm(yBase) });
        }
        setTrendData(projection);

      } catch (e) {
        console.error("Erro no Veredito:", e);
      } finally {
        setLoading(false);
      }
    }
    calculateHighPrecisionSystem();
  }, [periodo, router, getDataPoints]);

  const getTrendPath = () => {
    if (!trendData || trendData.length < 2) return "";
    const width = 300;
    const step = width / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      // Caminho Linear (Agudo)
      return `${acc} L ${x},${p.y}`;
    }, "");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-yellow-400 font-black italic tracking-widest">
      <Loader2 className="animate-spin mb-4" size={40} />
      SINCRONIZANDO INTELIGÊNCIA...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-10 pt-8 relative overflow-hidden">
        
        {/* Live Indicator no Topo Right */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 border border-zinc-800 px-3 py-1 rounded-full z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.7)]"></div>
          <span className="text-[7px] text-zinc-500 font-black tracking-widest">LIVE FORECAST</span>
        </div>

        <header>
          <h1 className="text-6xl font-black italic leading-none tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-600 text-[8px] font-bold tracking-[0.4em] mt-3">Intelligence & Projections System</p>
        </header>

        {/* Banner de Status */}
        <div className="bg-yellow-400 p-5 rounded-2xl border-2 border-black flex items-center justify-between shadow-[0_0_30px_rgba(250,204,21,0.2)]">
          <h3 className="text-black text-2xl font-black italic uppercase text-shadow-sm">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-7 w-7 fill-black" />
        </div>

        {/* Gráfico de Teia (Performance Real) */}
        <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-56 h-56 mb-12">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.15" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.08)" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-6 w-full border-t border-white/5 pt-10 Text-Center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[7px] font-black uppercase text-zinc-600 mb-1tracking-widest">{s.label}</p>
                <p className="text-4xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Tendência (O Próximo... Estilo Faca) */}
        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl relative">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-[10px] font-black text-zinc-500 italic flex items-center gap-3">
              <TrendingUp size={16} className="text-yellow-400 opacity-60"/> Tendências do próximo {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10 shadow-inner z-10">
              {["dia", "semana", "mês"].map(t => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t as any)} 
                  className={`px-5 py-2 rounded-xl text-[8px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-zinc-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative px-2">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path 
                d={getTrendPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 0.5))' }} 
              />
              {/* Ponto Final pulsante */}
              {trendData.length > 0 && (
                <circle cx="300" cy={trendData[trendData.length-1].y} r="5" fill="#facc15" className="animate-pulse" />
              )}
            </svg>
          </div>
          <p className="text-[7px] text-zinc-800 font-black mt-8 tracking-[0.7em] text-center">PRECISION PREDITIVE SYSTEM v4.2</p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-6 text-zinc-800 font-black text-[10px] tracking-[0.6em] hover:text-yellow-400 transition-all border-t border-white/5">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}
