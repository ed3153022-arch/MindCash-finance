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

        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        // --- CÁLCULOS DINÂMICOS (COM TRAVA DE SEGURANÇA) ---
        const totalLimite = goals.reduce((acc, g) => acc + Number(g.amount || g.target_value || 0), 0) || 1000;
        const totalGasto = txs.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const limiteDiario = totalLimite / 30;

        // Garantir que os valores fiquem entre 5 e 100 para não quebrar a teia
        const v = (val: number) => Math.max(5, Math.min(100, Math.round(val)));

        setStats([
          { label: "Disciplina", value: v(txs.length * 7) },
          { label: "Produtividade", value: v(goals.length * 25) },
          { label: "Conhecimento", value: v(txs.filter(t => /educa|curso|livro/i.test(t.category || "")).length * 30 + 10) },
          { label: "Resiliência", value: v(txs.length > 0 ? (txs.filter(t => Number(t.amount) <= limiteDiario).length / txs.length) * 100 : 20) },
          { label: "Autocontrole", value: v(100 - (totalGasto / totalLimite * 100)) },
          { label: "Visão", value: v(goals.filter(g => Number(g.amount || g.target_value) > 500).length * 40) },
        ]);

        // --- GRÁFICO DE LINHA (NEON) ---
        const pontos = periodo === "dia" ? 12 : periodo === "semana" ? 7 : 30;
        const mapa = txs.reduce((acc: any, t: any) => {
          const d = new Date(t.date || t.created_at);
          const k = periodo === "dia" ? d.getHours() : d.toISOString().split('T')[0];
          acc[k] = (acc[k] || 0) + Number(t.amount);
          return acc;
        }, {});

        const dados = Array.from({ length: pontos }, (_, i) => {
          let valor = 0;
          if (periodo === "dia") {
            valor = (mapa[i * 2] || 0);
          } else {
            const d = new Date();
            d.setDate(d.getDate() - (pontos - 1 - i));
            valor = mapa[d.toISOString().split('T')[0]] || 0;
          }
          // Y invertido para o SVG (0 é topo, 100 é base)
          // Altura máxima da linha em 80% para não cortar o topo
          return { x: i, y: 100 - Math.min(80, (valor / (limiteDiario || 1)) * 50 + 5) };
        });

        setGraphData(dados);
      } catch (e) {
        console.error(e);
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
      <p className="text-yellow-400 font-black italic tracking-widest text-xs font-sans">SINCRONIZANDO DADOS...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-xl mx-auto space-y-8 pt-6">
        <header>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-600 text-[8px] font-bold tracking-[0.4em] uppercase mt-1">Intelligence Performance System</p>
        </header>

        <div className="bg-yellow-400 p-4 rounded-xl border-2 border-black flex items-center justify-between shadow-[0_0_20px_rgba(250,204,21,0.2)]">
          <h3 className="text-black text-xl font-black italic">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-6 w-6 fill-black" />
        </div>

        {/* Radar Fix */}
        <div className="bg-[#080808] rounded-[2rem] border border-white/5 p-8 flex flex-col items-center shadow-2xl">
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
              ))}
              <polygon 
                points={getDataPoints(stats)} 
                fill="rgba(250, 204, 21, 0.15)" 
                stroke="#facc15" 
                strokeWidth="2" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-6 w-full border-t border-white/5 pt-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black uppercase text-zinc-600 mb-1">{s.label}</p>
                <p className="text-2xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Linha Neon Fix */}
        <div className="bg-[#080808] p-6 rounded-[2rem] border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Tendência {periodo}</h4>
            <div className="flex bg-black p-1 rounded-lg border border-white/10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-3 py-1 rounded-md text-[7px] font-black uppercase transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-32 w-full">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getPath()} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px #facc15)' }} />
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[8px] uppercase tracking-[0.5em] hover:text-white transition-all text-center">
          [ RETORNAR AO DASHBOARD ]
        </button>
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
