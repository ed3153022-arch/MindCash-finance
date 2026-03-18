"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Loader2 } from "lucide-react";
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

  useEffect(() => {
    async function calculatePredictiveVeredito() {
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

        // --- CÁLCULO DE PRECISÃO DA TEIA (VEREDITO REAL) ---
        const totalMeta = goals.reduce((acc, g) => acc + Number(g.amount || 0), 0) || 1000;
        const totalGasto = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalGanho = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const saldoReal = totalGanho - totalGasto;
        const norm = (val: number) => Math.max(5, Math.min(100, Math.round(val)));

        setStats([
          { label: "Disciplina", value: norm((txs.length / 25) * 100) },
          { label: "Produtividade", value: norm(goals.length > 0 ? (goals.filter(g => g.is_completed).length / goals.length) * 100 : 15) },
          { label: "Conhecimento", value: norm(txs.filter(t => /educa|livro|invest/i.test(t.category || "")).length * 40) },
          { label: "Resiliência", value: norm(100 - (txs.filter(t => t.amount > (totalMeta/30)).length * 20)) },
          { label: "Autocontrole", value: norm(saldoReal > 0 ? (saldoReal / totalMeta) * 100 : 10) },
          { label: "Visão", value: norm(goals.length * 30) },
        ]);

        // --- LÓGICA DE TENDÊNCIAS DO PRÓXIMO (PROJEÇÃO) ---
        const numPontos = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const diasPassados = Math.max(1, new Date().getDate());
        
        // Velocidade baseada no histórico real para projetar o futuro
        const velGasto = totalGasto / diasPassados;
        const velGanho = totalGanho / diasPassados;
        const fluxoDiario = velGanho - velGasto;

        let saldoProjetado = saldoReal;
        const projection = [];

        for (let i = 0; i < numPontos; i++) {
          const incremento = periodo === "dia" ? (fluxoDiario / 24) : fluxoDiario;
          saldoProjetado += incremento;

          // Mapeamento visual: Saldo positivo sobe, negativo desce
          const yPos = 100 - norm((saldoProjetado / totalMeta) * 60 + 40);
          projection.push({ x: i, y: yPos });
        }

        setTrendData(projection);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    calculatePredictiveVeredito();
  }, [periodo]);

  const getTrendPath = () => {
    if (trendData.length < 2) return "";
    const step = 300 / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      // Curva suave para manter o aspecto estético
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${trendData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-8 pt-8">
        <header>
          <h1 className="text-6xl font-black italic tracking-tighter leading-none">VEREDITO</h1>
          <p className="text-zinc-600 text-[7px] font-bold tracking-[0.5em] mt-2">Future Intelligence System</p>
        </header>

        {/* Veredito Real (Teia) */}
        <div className="bg-[#080808] rounded-[2.5rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-52 h-52 mb-10">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.1)" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-8 gap-x-4 w-full border-t border-white/5 pt-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black text-zinc-600 mb-1">{s.label}</p>
                <p className="text-3xl font-black italic tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tendências do Próximo (Linha Sólida) */}
        <div className="bg-[#080808] p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-[9px] font-black text-zinc-500 italic flex items-center gap-2">
              <TrendingUp size={14} className="text-yellow-400"/> Tendências do próximo {periodo}
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black shadow-lg' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-40 w-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-800" />
              </div>
            ) : (
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <path d={getTrendPath()} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.3))' }} />
                <circle cx="300" cy={trendData[trendData.length-1]?.y} r="4" fill="#facc15" className="animate-pulse" />
              </svg>
            )}
          </div>
          <p className="text-[6px] text-zinc-800 font-black mt-6 text-center tracking-[0.5em]">ALGORITMO DE PROJEÇÃO FINANCEIRA ATIVO</p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[9px] tracking-[0.5em] hover:text-white transition-all text-center">
          [ VOLTAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}

// Funções Geométricas Radar
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
