"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, TrendingUp, ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  
  const [stats, setStats] = useState([
    { label: "Disciplina", value: 85 },
    { label: "Produtividade", value: 70 },
    { label: "Conhecimento", value: 90 },
    { label: "Resiliência", value: 65 },
    { label: "Autocontrole", value: 82 },
    { label: "Visão", value: 75 },
  ]);

  const [graphData, setGraphData] = useState<{ x: number; y: number; ultrapassou: boolean }[]>([]);

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. BUSCA DADOS
        const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id).order('date', { ascending: true });
        const { data: goals } = await supabase.from("goals").select("*").eq("user_id", user.id);

        // 2. CONFIGURAÇÃO DE LIMITES
        const totalLimiteMensal = goals?.reduce((acc, curr) => acc + Number(curr.amount || curr.target_value || 0), 0) || 1000;
        
        // CORREÇÃO FILTRO DIA: Define o limite baseado no período selecionado
        let limiteReferencia = totalLimiteMensal / 30; // Padrão Diário
        if (periodo === "semana") limiteReferencia = (totalLimiteMensal / 30) * 7;
        if (periodo === "mês") limiteReferencia = totalLimiteMensal;

        // 3. LÓGICA DO GRÁFICO (YYYY-MM-DD)
        const pontosPorPeriodo = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const gastosPorDia = txs?.reduce((acc: any, t: any) => {
          if (!t.date) return acc;
          const dataLimpa = t.date.split('T')[0]; 
          acc[dataLimpa] = (acc[dataLimpa] || 0) + Number(t.amount);
          return acc;
        }, {}) || {};

        const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (pontosPorPeriodo - 1 - i));
          const chaveData = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const totalNoDia = gastosPorDia[chaveData] || 0;

          // y proporcional ao limite do período selecionado
          return { 
            x: i, 
            y: Math.min(100, (totalNoDia / (limiteReferencia || 1)) * 100), 
            ultrapassou: totalNoDia > limiteReferencia 
          };
        });

        // Se for filtro "DIA", precisamos de pelo menos 2 pontos para desenhar uma curva
        if (periodo === "dia" && dadosCalculados.length === 1) {
            setGraphData([{x: -1, y: 0, ultrapassou: false}, dadosCalculados[0]]);
        } else {
            setGraphData(dadosCalculados);
        }

      } catch (err) {
        console.error("Erro crítico no Veredito:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVereditoData();
  }, [periodo]);

  // FUNÇÃO CRUCIAL: GERA CURVAS SUAVES (CUBIC BEZIER)
  const generateSmoothPath = (data: typeof graphData) => {
    if (data.length < 2) return "";
    const width = 300;
    const height = 100;
    const spacing = width / (data.length - 1);
    
    let path = `M 0,${height - data[0].y}`;
    
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = i * spacing;
      const y1 = height - data[i].y;
      const x2 = (i + 1) * spacing;
      const y2 = height - data[i+1].y;
      
      // Control points para suavizar a curva
      const cp1x = x1 + (x2 - x1) / 2;
      const cp2x = x1 + (x2 - x1) / 2;
      
      path += ` C ${cp1x},${y1} ${cp2x},${y2} ${x2},${y2}`;
    }
    return path;
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20 p-6">
      <div className="max-w-2xl mx-auto space-y-10 pt-20">
        
        {/* HEADER */}
        <header className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase leading-none tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic px-1">Análise Comportamental MindCash.</p>
        </header>

        {/* STATUS */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black flex items-center justify-between shadow-lg">
          <h3 className="text-black text-3xl font-black italic uppercase leading-none tracking-tighter">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-8 w-8 fill-black" />
        </div>

        {/* TEIA (RADAR) */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center shadow-2xl">
          <div className="relative w-56 h-56 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-80 overflow-visible">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.15)" stroke="#facc15" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-6 w-full border-t border-white/5 pt-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[7px] font-black uppercase text-zinc-600 italic mb-1">{s.label}</p>
                <p className="text-2xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PARTE 4: GRÁFICO DE TENDÊNCIAS (ESTILO NEON/CURVO) */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-zinc-500"/>
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tendências {periodo}</h4>
            </div>
            <div className="flex bg-black p-1 rounded-xl border border-white/5 z-10">
              {(["dia", "semana", "mês"] as const).map((t) => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t)} 
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase italic transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative h-40 w-full pt-4">
            {/* Definição dos Filtros de Brilho (Neon) */}
            <svg width="0" height="0">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="red-glow">
                  <feGaussianBlur stdDeviation="4.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
            </svg>

            {/* Desenho do Gráfico Curvo */}
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {/* Linha de Base (Sombra Projetada) */}
              <path 
                d={generateSmoothPath(graphData)} 
                fill="none" 
                stroke="rgba(0,0,0,0.5)" 
                strokeWidth="6" 
                strokeLinecap="round"
                transform="translate(0, 4)"
              />
              {/* Linha Neon Principal (Curva Suave) */}
              <path 
                d={generateSmoothPath(graphData)} 
                fill="none" 
                // Define a cor baseada no status geral (Amarelo ou Vermelho Neon)
                stroke={graphData.some(p => p.ultrapassou) ? "#ff4444" : "#facc15"} 
                strokeWidth="3" 
                strokeLinecap="round"
                // Aplica o filtro de brilho neon
                filter={graphData.some(p => p.ultrapassou) ? "url(#red-glow)" : "url(#glow)"}
                className="transition-all duration-500"
              />
            </svg>
            
            {/* Legenda Numérica */}
            {periodo !== "dia" && (
              <div className="flex justify-between mt-8 px-1 border-t border-white/5 pt-2">
                {graphData.filter((_, i) => periodo === "semana" ? true : i % 5 === 0).map((d) => (
                  <span key={d.x} className="text-[8px] font-black text-zinc-700 italic">{d.x + 1}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")} 
          className="w-full py-6 text-zinc-800 font-black text-[9px] uppercase tracking-[0.5em] flex items-center justify-center gap-2 hover:text-white transition-all underline underline-offset-8 decoration-zinc-900"
        >
          <ChevronLeft size={12} /> RETORNAR AO DASHBOARD
        </button>
      </div>
    </div>
  );
}

// Auxiliares Radar
function getPoints(r: number) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}

function getDataPoints(stats: any[]) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const r = (stats[i].value / 100) * 50;
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}
