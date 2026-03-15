"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Lightbulb, TrendingUp, ChevronLeft, Loader2 } from "lucide-react";
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

  const [graphData, setGraphData] = useState<{ x: number; y: number; ultrapassou: boolean }[]>([]);

  useEffect(() => {
    async function fetchVereditoData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. BUSCAR DADOS REAIS
      const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id).order('date', { ascending: true });
      const { data: limits } = await supabase.from("limits").select("*").eq("user_id", user.id);

      // 2. CONFIGURAÇÃO DE LIMITES
      const totalLimiteMensal = limits?.reduce((acc, l) => acc + Number(l.amount), 0) || 1000;
      const limiteDiario = totalLimiteMensal / 30;

      // 3. LÓGICA DO GRÁFICO DE TENDÊNCIAS (COMPARAÇÃO DE DATAS CORRIGIDA)
      const pontosPorPeriodo = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
      
      // Mapear gastos por dia (YYYY-MM-DD)
      const gastosPorDia = txs?.reduce((acc: any, t: any) => {
        const d = new Date(t.date).toISOString().split('T')[0];
        acc[d] = (acc[d] || 0) + Number(t.amount);
        return acc;
      }, {});

      const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (pontosPorPeriodo - 1 - i));
        const chaveData = d.toISOString().split('T')[0];
        
        const totalNoDia = gastosPorDia[chaveData] || 0;

        return { 
          x: i, 
          // O "y" define a altura da linha (escala baseada no dobro do limite diário para dar respiro)
          y: Math.min(100, (totalNoDia / (limiteDiario * 2)) * 100), 
          ultrapassou: totalNoDia > limiteDiario 
        };
      });

      setGraphData(dadosCalculados);

      // 4. CÁLCULO DOS 6 ATRIBUTOS (TEIA)
      const totalGastoMes = txs?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
      
      setStats([
        { label: "Disciplina", value: txs && txs.length > 5 ? 92 : 40 },
        { label: "Produtividade", value: limits && limits.length > 2 ? 85 : 30 },
        { label: "Conhecimento", value: 70 }, // Estático ou baseado em acessos
        { label: "Resiliência", value: 65 },
        { label: "Autocontrole", value: Math.max(10, Math.min(100, Math.round(100 - (totalGastoMes / totalLimiteMensal * 50)))) },
        { label: "Visão", value: totalLimiteMensal > 500 ? 80 : 40 },
      ]);

      setLoading(false);
    }

    fetchVereditoData();
  }, [periodo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-yellow-400 animate-spin" size={40} />
        <p className="text-yellow-400 font-black italic uppercase tracking-widest text-xs">Calculando Veredito...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto px-6 pt-24">
        
        {/* PARTE 1: NOME E DESCRIÇÃO */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase leading-[0.8] tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic px-1">
            Análise comportamental e desempenho.
          </p>
        </div>

        {/* PARTE 2: STATUS ATUAL */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black flex items-center justify-between shadow-lg">
          <div>
            <p className="text-black font-black uppercase text-[9px] tracking-widest opacity-70">Status Atual</p>
            <h3 className="text-black text-3xl font-black italic uppercase leading-none">Em Evolução</h3>
          </div>
          <Zap className="text-black h-8 w-8 fill-black" />
        </div>

        {/* PARTE 3: GRÁFICO DE TEIA E SCORES */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r / 2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon
                points={getDataPoints(stats)}
                fill="rgba(250, 204, 21, 0.15)"
                stroke="#facc15"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full border-t border-white/5 pt-8 text-center">
            {stats.map((item) => (
              <div key={item.label}>
                <p className="text-[7px] font-black uppercase text-zinc-600 tracking-tighter italic mb-1">{item.label}</p>
                <p className={`text-xl font-black italic ${item.label === 'Autocontrole' ? 'text-yellow-400' : 'text-white'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PARTE 4: TENDÊNCIAS (GRAFICO PADRÃO/ANGULAR) */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-zinc-500 h-4 w-4" />
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tendências</h4>
            </div>
            <div className="flex bg-black p-1 rounded-xl border border-white/5">
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
          
          <div className="relative h-32 w-full pt-4">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {graphData.map((p, i) => {
                if (i === 0) return null;
                const prev = graphData[i-1];
                const spacing = 300 / (graphData.length - 1 || 1);
                return (
                  <line 
                    key={i}
                    x1={(i-1) * spacing} y1={100 - prev.y}
                    x2={i * spacing} y2={100 - p.y}
                    stroke={p.ultrapassou ? "#ef4444" : "#facc15"} 
                    strokeWidth="2.5"
                    strokeLinecap="square"
                  />
                );
              })}
            </svg>
            
            {/* Legenda Numérica 1-7 ou 1-30 */}
            {periodo !== "dia" && (
              <div className="flex justify-between mt-6 px-1 border-t border-white/5 pt-2">
                {graphData.filter((_, i) => periodo === "semana" ? true : i % 5 === 0).map((d) => (
                  <span key={d.x} className="text-[8px] font-black text-zinc-700 italic">{d.x + 1}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PARTE 5: CONSELHO E MELHORIA JUNTOS */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Lightbulb size={16} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Análise do Dia</h4>
            </div>
            <p className="text-white text-lg font-black italic uppercase leading-tight tracking-tight">
              Análise baseada nos teus últimos gastos. <br/>
              <span className="text-zinc-500">Mantenha o foco nos limites diários.</span>
            </p>
          </div>
          
          <div className="pt-6 border-t border-white/10">
            <p className="text-yellow-400 text-[8px] font-black uppercase mb-1 italic">Ponto de Melhoria</p>
            <p className="text-zinc-400 text-[11px] font-bold italic leading-relaxed">
              O teu autocontrole varia conforme o dia da semana. Evite compras impulsivas no período noturno.
            </p>
          </div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")} 
          className="py-6 text-zinc-700 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={12} /> RETORNAR AO DASHBOARD
        </button>
      </div>
    </div>
  );
}

// FUNÇÕES AUXILIARES DA TEIA
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
