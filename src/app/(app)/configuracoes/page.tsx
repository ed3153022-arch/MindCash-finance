"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Loader2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// Função simples de ruído 1D para simular Perlin Noise (suavidade e precisão)
const generateSmoothNoise = (size: number, seed: number, amplitude: number, frequency: number) => {
  const noise = [];
  for (let i = 0; i < size; i++) {
    // Usamos múltiplos senos com frequências diferentes para quebrar a regularidade
    const val = (
      Math.sin(i * frequency * 1.0 + seed) * 1.0 +
      Math.sin(i * frequency * 2.1 + seed * 1.5) * 0.5 +
      Math.sin(i * frequency * 3.7 + seed * 2.0) * 0.25
    );
    noise.push((val / 1.75) * amplitude);
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

  // Funções Radar mantidas
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

        // --- CÁLCULO DE PERFORMANCE (TEIA) REFRESH ---
        const totalLimite = goals.reduce((acc, g) => acc + Number(g.amount || 0), 0) || 1000;
        const expenses = txs.filter(t => t.type === 'expense');
        const incomes = txs.filter(t => t.type === 'income');
        const totalGasto = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
        const totalGanho = incomes.reduce((acc, t) => acc + Number(t.amount), 0);
        const saldoReal = totalGanho - totalGasto;

        // Produtividade: Categorias que NÃO estouraram o limite
        const categoriasEstouradas = goals.filter(g => {
          const gastoNaCategoria = txs
            .filter(t => t.category === g.title && t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);
          return gastoNaCategoria > Number(g.amount);
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

        // --- LÓGICA DE TENDÊNCIAS COM RUÍDO SUAVE E PRECISÃO ---
        const numPontos = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const diasAtivos = Math.max(1, new Date().getDate());
        
        // 1. Calcular a Velocidade Financeira (Ganhos - Gastos)
        const fluxoDiarioReal = (totalGanho - totalGasto) / diasAtivos;

        // 2. Calcular a Volatilidade Real dos Gastos (Precisão)
        // Se a volatilidade for alta (gastos instáveis), a curva oscila mais.
        let desvioPadrao = 0;
        if (expenses.length > 1) {
          const mediaGasto = totalGasto / expenses.length;
          const somaQuadrados = expenses.reduce((acc, t) => acc + Math.pow(Number(t.amount) - mediaGasto, 2), 0);
          desvioPadrao = Math.sqrt(somaQuadrados / expenses.length);
        }

        // 3. Gerar Ruído Suave (Perlin Noise)
        // A amplitude é baseada no seu desvio padrão de gastos (Precisão).
        const amplitudeOscilacao = Math.max(totalLimite * 0.02, desvioPadrao * 0.5); 
        // A frequência é menor para criar ondas longas e suaves (Naturais).
        const frequênciaSuave = periodo === "dia" ? 0.05 : 0.15; 

        const noiseArray = generateSmoothNoise(
          numPontos, 
          agora.getTime(), // Seed baseada no tempo
          amplitudeOscilacao, 
          frequênciaSuave
        );

        let projection = [];
        let saldoSimulado = totalGanho - totalGasto;

        for (let i = 0; i < numPontos; i++) {
          // Aplicamos a velocidade diária + o ruído suave gerado
          saldoSimulado += (fluxoDiarioReal / (periodo === "dia" ? 24 : 1)) + noiseArray[i];

          // Normalização Y: O centro (50) é o equilíbrio
          const yPos = 100 - norm(((saldoSimulado / totalLimite) * 40) + 50);
          projection.push({ x: i, y: yPos });
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
    if (!trendData || trendData.length < 2) return "";
    const width = 300;
    const step = width / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      // Curva suave Bézier
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${trendData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-yellow-400 font-black italic">
      <Loader2 className="animate-spin mb-4" size={40} />
      CALIBRANDO TENDÊNCIAS...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-10 pt-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-700 text-[8px] font-bold tracking-[0.6em] mt-3">Intelligence Forecast System</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar (Performance Real) */}
        <div className="bg-[#0A0A0A] rounded-[3rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-56 h-56 mb-12">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.15" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.08)" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-10 gap-x-6 w-full border-t border-white/5 pt-10">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black text-zinc-600 mb-2">{s.label}</p>
                <p className="text-4xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tendências (Sobe/Desce com Suavidade Perlin) */}
        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-12">
            <h4 className="text-[10px] font-black text-zinc-500 italic flex items-center gap-3">
              <TrendingUp size={16} className="text-yellow-400"/> Tendências do próximo {periodo}
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10 shadow-inner">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-5 py-2 rounded-xl text-[9px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black shadow-lg scale-105' : 'text-zinc-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-44 w-full relative px-2">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getTrendPath()} fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 0.5))' }} />
              {trendData.length > 0 && (
                <circle cx="300" cy={trendData[trendData.length-1].y} r="5" fill="#facc15" className="animate-pulse" />
              )}
            </svg>
          </div>
          <p className="text-[7px] text-zinc-800 font-black mt-8 text-center tracking-[0.6em]">FUTURE PROJECTION ENGINE v4.0 (PERLIN)</p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-6 text-zinc-800 font-black text-[10px] tracking-[0.7em] hover:text-yellow-400 transition-all border-t border-white/5">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}
