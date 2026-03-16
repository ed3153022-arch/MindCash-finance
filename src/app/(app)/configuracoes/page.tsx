"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, TrendingUp, Loader2 } from "lucide-react";
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

  const [graphData, setGraphData] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Busca transações e metas simultaneamente para precisão de cálculo
        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: true }),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        // --- CÁLCULO DE PRECISÃO DA TEIA ---
        const totalMeta = goals.reduce((acc, g) => acc + Number(g.amount || g.target_value || 0), 0) || 1000;
        const totalGasto = txs.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const limiteDiario = totalMeta / 30;

        const v = (val: number) => Math.max(5, Math.min(100, Math.round(val)));

        setStats([
          { label: "Disciplina", value: v((txs.length / 30) * 100) }, // Baseado em 1 registro por dia
          { label: "Produtividade", value: v((goals.filter(g => g.is_completed).length / (goals.length || 1)) * 100) },
          { label: "Conhecimento", value: v(txs.filter(t => /educa|curso|livro/i.test(t.category || "")).length * 20) },
          { label: "Resiliência", value: v((txs.filter(t => Number(t.amount) <= limiteDiario).length / (txs.length || 1)) * 100) },
          { label: "Autocontrole", value: v(totalGasto > totalMeta ? 10 : 100 - (totalGasto / totalMeta * 100)) },
          { label: "Visão", value: v((goals.length / 5) * 100) }, // Visão sobe conforme você cria metas
        ]);

        // --- LÓGICA DE GRÁFICO POR TEMPO REAL ---
        let pontos = 12;
        const agora = new Date();
        const mapaGastos = new Map();

        txs.forEach(t => {
          const d = new Date(t.date || t.created_at);
          let chave;
          
          if (periodo === "dia") {
            // Agrupa por blocos de 2 horas para o gráfico não ficar serrilhado
            chave = Math.floor(d.getHours() / 2); 
            pontos = 12;
          } else if (periodo === "semana") {
            chave = d.getDay(); 
            pontos = 7;
          } else {
            chave = d.getDate(); 
            pontos = 31;
          }
          mapaGastos.set(chave, (mapaGastos.get(chave) || 0) + Number(t.amount));
        });

        const dadosCalculados = Array.from({ length: pontos }, (_, i) => {
          const valor = mapaGastos.get(i) || 0;
          // Normalização: 100% do gráfico é o seu limite diário para ficar visível
          const alturaBase = (valor / (limiteDiario || 100)) * 60;
          return { x: i, y: 100 - Math.min(90, alturaBase + 5) };
        });

        setGraphData(dadosCalculados);
      } catch (e) {
        console.error("Erro de sincronização:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchVereditoData();
  }, [periodo]);

  const getPath = () => {
    if (graphData.length < 2) return "";
    const w = 300;
    const step = w / (graphData.length - 1);
    return graphData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${graphData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="text-yellow-400 animate-spin w-10 h-10 mb-4" />
      <p className="text-yellow-400 font-black italic tracking-widest text-[10px]">RECALCULANDO PRECISÃO...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans">
      <div className="max-w-xl mx-auto space-y-8 pt-8">
        <header>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-600 text-[8px] font-bold tracking-[0.4em] uppercase">Intelligence Performance System</p>
        </header>

        <div className="bg-yellow-400 p-4 rounded-2xl border-2 border-black flex items-center justify-between">
          <h3 className="text-black text-2xl font-black italic uppercase">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-8 w-8 fill-black" />
        </div>

        {/* Radar Dinâmico Preciso */}
        <div className="bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-52 h-52 mb-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.1)" stroke="#facc15" strokeWidth="2" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-8 w-full border-t border-white/5 pt-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black uppercase text-zinc-600 mb-1">{s.label}</p>
                <p className="text-3xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Linha Neon Sensível */}
        <div className="bg-[#0a0a0a] p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-yellow-400 opacity-50" />
              <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Tendência {periodo}</h4>
            </div>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-32 w-full">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getPath()} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px #facc15)' }} />
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[9px] uppercase tracking-[0.4em]">[ RETORNAR AO DASHBOARD ]</button>
      </div>
    </div>
  );
}

function getPoints(r: number) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return p.join(" ");
}

function getDataPoints(st: any[]) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const r = (st[i].value / 100) * 50;
    const a = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return p.join(" ");
}
