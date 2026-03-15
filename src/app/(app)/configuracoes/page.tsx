"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Lightbulb, TrendingUp, ChevronLeft } from "lucide-react";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id).order('date', { ascending: true });
      const { data: limits } = await supabase.from("limits").select("*").eq("user_id", user.id);

      const totalLimite = limits?.reduce((acc, l) => acc + l.amount, 0) || 1;
      const limiteDiarioProporcional = totalLimite / 30;

      // LÓGICA DO GRÁFICO DE TENDÊNCIAS
      const pontosPorPeriodo = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
      const hoje = new Date();
      
      const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
        const dataAlvo = new Date();
        dataAlvo.setDate(hoje.getDate() - (pontosPorPeriodo - 1 - i));
        
        const totalNoDia = txs?.filter(t => 
          new Date(t.date).toDateString() === dataAlvo.toDateString()
        ).reduce((acc, curr) => acc + curr.amount, 0) || 0;

        return { 
          x: i, 
          y: Math.min(100, (totalNoDia / (limiteDiarioProporcional * 2)) * 100),
          ultrapassou: totalNoDia > limiteDiarioProporcional 
        };
      });

      setGraphData(dadosCalculados);

      // CÁLCULO DOS 6 ATRIBUTOS
      const totalGasto = txs?.reduce((acc, t) => acc + t.amount, 0) || 0;
      const auto = Math.max(10, Math.min(100, 100 - (totalGasto / totalLimite * 50)));

      setStats([
        { label: "Disciplina", value: txs && txs.length > 5 ? 88 : 45 },
        { label: "Produtividade", value: limits && limits.length > 2 ? 80 : 35 },
        { label: "Conhecimento", value: 75 },
        { label: "Resiliência", value: 65 },
        { label: "Autocontrole", value: Math.round(auto) },
        { label: "Visão", value: totalLimite > 1000 ? 90 : 50 },
      ]);

      setLoading(false);
    }

    fetchVereditoData();
  }, [periodo]);

  if (loading) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto px-6 pt-24">
        
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic px-1">Análise de Desempenho Financeiro</p>
        </div>

        {/* STATUS */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black flex items-center justify-between shadow-lg">
          <h3 className="text-black text-3xl font-black italic uppercase leading-none tracking-tighter">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-8 w-8 fill-black" />
        </div>

        {/* TEIA */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.15)" stroke="#facc15" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full border-t border-white/5 pt-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[7px] font-black uppercase text-zinc-600 italic mb-1">{s.label}</p>
                <p className={`text-xl font-black italic ${s.label === 'Autocontrole' ? 'text-yellow-400' : 'text-white'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TENDÊNCIAS COM LÓGICA DE COR */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2"><TrendingUp size={14} className="text-zinc-500"/><h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tendências</h4></div>
            <div className="flex bg-black p-1 rounded-xl border border-white/5">
              {(["dia", "semana", "mês"] as const).map((t) => (
                <button key={t} onClick={() => setPeriodo(t)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase italic ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="relative h-32 w-full pt-4">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {/* Renderização ponto a ponto para controlar a cor individual */}
              {graphData.map((p, i) => {
                if (i === 0) return null;
                const prev = graphData[i-1];
                const width = 300;
                const spacing = width / (graphData.length - 1 || 1);
                return (
                  <line 
                    key={i}
                    x1={(i-1) * spacing} y1={100 - prev.y}
                    x2={i * spacing} y2={100 - p.y}
                    stroke={p.ultrapassou ? "#ef4444" : "#facc15"} 
                    strokeWidth="2.5"
                  />
                );
              })}
            </svg>
            
            {/* Legendas 1-7 ou 1-30 */}
            {periodo !== "dia" && (
              <div className="flex justify-between mt-6 px-1 border-t border-white/5 pt-2">
                {graphData.filter((_, i) => periodo === "semana" ? true : i % 5 === 0).map((d) => (
                  <span key={d.x} className="text-[8px] font-black text-zinc-700 italic">{d.x + 1}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ANÁLISE E MELHORIA JUNTOS */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-yellow-400"><Lightbulb size={16} /><h4 className="text-[10px] font-black uppercase tracking-widest italic">Análise do Dia</h4></div>
          <p className="text-white text-xl font-black italic uppercase leading-tight">Gastaste 38% em alimentação. <br/><span className="text-zinc-500">Reduzir R$ 10 por dia economiza R$ 300 no mês.</span></p>
          <div className="pt-4 border-t border-white/5">
            <p className="text-yellow-400 text-[8px] font-black uppercase mb-1 italic">Ponto de Melhoria</p>
            <p className="text-zinc-400 text-[11px] font-bold italic">Evita gastos impulsivos após as 20h para manter o autocontrole alto.</p>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="py-6 text-zinc-700 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}

// Auxiliares SVG
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
