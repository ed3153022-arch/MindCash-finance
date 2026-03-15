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
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. BUSCA DADOS (Transactions para a linha, Goals para a teia)
        const { data: txs } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        const { data: goals } = await supabase.from("goals").select("*").eq("user_id", user.id);

        // 2. CÁLCULO DO LIMITE DIÁRIO (Baseado nas metas da tabela goals)
        const totalLimiteMensal = goals?.reduce((acc, curr) => acc + Number(curr.amount || curr.target_value || 0), 0) || 1000;
        const limiteDiario = totalLimiteMensal / 30;

        // 3. LÓGICA DA LINHA (Tratamento de data ISO para String pura)
        const pontosPorPeriodo = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        
        const gastosPorDia = txs?.reduce((acc: any, t: any) => {
          if (!t.date) return acc;
          // Força a data a ser apenas YYYY-MM-DD para ignorar fuso horário
          const dataChave = new Date(t.date).toISOString().split('T')[0];
          acc[dataChave] = (acc[dataChave] || 0) + Number(t.amount);
          return acc;
        }, {}) || {};

        const dadosCalculados = Array.from({ length: pontosPorPeriodo }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (pontosPorPeriodo - 1 - i));
          const chaveHoje = d.toISOString().split('T')[0];
          
          const totalNoDia = gastosPorDia[chaveHoje] || 0;

          return { 
            x: i, 
            // Aumentamos a sensibilidade (y) para a linha subir visivelmente
            y: Math.min(100, (totalNoDia / (limiteDiario || 1)) * 150), 
            ultrapassou: totalNoDia > limiteDiario 
          };
        });

        setGraphData(dadosCalculados);

        // 4. ATRIBUTOS DA TEIA
        const totalGastoMes = txs?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        setStats([
          { label: "Disciplina", value: txs?.length ? 85 : 0 },
          { label: "Produtividade", value: goals?.length ? 70 : 0 },
          { label: "Conhecimento", value: 90 },
          { label: "Resiliência", value: 65 },
          { label: "Autocontrole", value: txs?.length ? Math.max(10, Math.round(100 - (totalGastoMes / totalLimiteMensal * 50))) : 0 },
          { label: "Visão", value: totalLimiteMensal > 1 ? 75 : 0 },
        ]);

      } catch (err) {
        console.error("Erro:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVereditoData();
  }, [periodo]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto space-y-10 pt-10">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">VEREDITO</h1>

        {/* Gráfico de Teia */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.2)" stroke="#facc15" strokeWidth="2" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-6 w-full text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black uppercase text-zinc-500">{s.label}</p>
                <p className="text-2xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Tendências (Linha) */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Tendência {periodo}</h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/5">
                {["dia", "semana", "mês"].map(t => (
                  <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1 text-[8px] font-black uppercase rounded-lg ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-700'}`}>{t}</button>
                ))}
            </div>
          </div>
          <div className="h-40 w-full relative">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              {graphData.length > 1 ? graphData.map((p, i) => {
                if (i === 0) return null;
                const prev = graphData[i-1];
                const spacing = 300 / (graphData.length - 1);
                return (
                  <line 
                    key={i} 
                    x1={(i-1) * spacing} y1={100 - prev.y} 
                    x2={i * spacing} y2={100 - p.y} 
                    stroke={p.ultrapassou ? "#ef4444" : "#facc15"} 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                  />
                );
              }) : null}
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[10px] uppercase">[ RETORNAR AO DASHBOARD ]</button>
      </div>
    </div>
  );
}

// Auxiliares para Teia
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
