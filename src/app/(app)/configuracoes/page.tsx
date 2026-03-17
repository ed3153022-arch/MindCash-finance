"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, TrendingUp, Loader2, Target } from "lucide-react";
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

  const [graphData, setGraphData] = useState<{ x: number; y: number; isFuture: boolean }[]>([]);

  useEffect(() => {
    async function fetchVereditoSystem() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: true }),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        // --- CÁLCULO DE PERFORMANCE REAL (TEIA) ---
        const totalMeta = goals.reduce((acc, g) => acc + Number(g.amount || g.target_value || 0), 0) || 1000;
        const totalGasto = txs.reduce((acc, t) => acc + (t.type === 'expense' ? Number(t.amount) : 0), 0);
        const totalGanho = txs.reduce((acc, t) => acc + (t.type === 'income' ? Number(t.amount) : 0), 0);
        const limiteDiario = totalMeta / 30;

        const norm = (val: number) => Math.max(5, Math.min(100, Math.round(val)));

        setStats([
          { label: "Disciplina", value: norm((txs.length / 30) * 100) },
          { label: "Produtividade", value: norm((goals.filter(g => g.is_completed).length / (goals.length || 1)) * 100 + 20) },
          { label: "Conhecimento", value: norm(txs.filter(t => /educa|livro|curso/i.test(t.category || "")).length * 50) },
          { label: "Resiliência", value: norm(txs.length > 0 ? (txs.filter(t => Number(t.amount) <= limiteDiario).length / txs.length) * 100 : 50) },
          { label: "Autocontrole", value: norm(100 - (totalGasto / totalMeta * 100)) },
          { label: "Visão", value: norm(goals.length * 30) },
        ]);

        // --- CÁLCULO DE TENDÊNCIA FUTURA (LINHA) ---
        const pontosTotais = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const agora = new Date();
        let momentoIndice = periodo === "dia" ? agora.getHours() : periodo === "semana" ? agora.getDay() : agora.getDate();

        const projection = [];
        const mediaGastoReal = totalGasto / Math.max(1, agora.getDate());
        const saldoAtual = totalGanho - totalGasto;

        for (let i = 0; i < pontosTotais; i++) {
          const isFuture = i > momentoIndice;
          let saldoPonto;

          if (!isFuture) {
            // Histórico: Saldo que foi se construindo
            saldoPonto = (totalGanho / pontosTotais * i) - (totalGasto / pontosTotais * i);
          } else {
            // Tendência: Projeta o saldo baseado na média de gastos
            const diasAFrente = i - momentoIndice;
            saldoPonto = saldoAtual - (mediaGastoReal * diasAFrente);
          }

          // Invertemos para o SVG: 100% de saldo é Y=10 (topo), 0% de saldo é Y=90 (base)
          const yPos = 100 - Math.min(95, Math.max(5, (saldoPonto / totalMeta) * 80 + 50));
          projection.push({ x: i, y: yPos, isFuture });
        }

        setGraphData(projection);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchVereditoSystem();
  }, [periodo]);

  const getPath = (isFuturePath: boolean) => {
    const points = graphData.filter(p => p.isFuture === isFuturePath || (isFuturePath && p.x === Math.max(...graphData.filter(d => !d.isFuture).map(d => d.x))));
    if (points.length < 2) return "";
    const step = 300 / (graphData.length - 1);
    
    return points.reduce((acc, p, i) => {
      const x = p.x * step;
      if (i === 0) return `M ${x},${p.y}`;
      return `${acc} L ${x},${p.y}`;
    }, "");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-black">CALIBRANDO TENDÊNCIAS...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-8 pt-8">
        <header>
          <h1 className="text-6xl font-black italic tracking-tighter leading-none">VEREDITO</h1>
          <p className="text-zinc-600 text-[7px] font-bold tracking-[0.5em] mt-2">Intelligence & Forecasting</p>
        </header>

        {/* Radar (Performance Real) */}
        <div className="bg-[#080808] rounded-[2.5rem] border border-white/5 p-10 flex flex-col items-center">
          <div className="relative w-52 h-52 mb-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.1)" stroke="#facc15" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-8 w-full border-t border-white/5 pt-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black text-zinc-600 mb-1">{s.label}</p>
                <p className="text-3xl font-black italic">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Linha (Tendência Futura) */}
        <div className="bg-[#080808] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-[9px] font-black text-zinc-500 italic flex items-center gap-2">
              <TrendingUp size={14} className="text-yellow-400"/> Forecast {periodo}
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10 z-10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-40 w-full relative">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Linha do Passado: Sólida e Forte */}
              <path d={getPath(false)} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
              
              {/* Linha do Futuro: Tracejada (Tendência) */}
              <path d={getPath(true)} fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
              
              {/* Indicador de "Ponto Atual" */}
              {graphData.length > 0 && (
                <circle 
                  cx={(graphData.filter(p => !p.isFuture).length - 1) * (300 / (graphData.length - 1))} 
                  cy={graphData.find(p => p.isFuture)?.y || 50} 
                  r="5" fill="#facc15" className="animate-pulse"
                />
              )}
            </svg>
          </div>
          <div className="mt-4 flex justify-between text-[6px] font-black text-zinc-700 tracking-[0.3em]">
            <span>HISTÓRICO REAL</span>
            <span>TENDÊNCIA PRÓX. {periodo.toUpperCase()}</span>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[9px] tracking-[0.5em] hover:text-white transition-all text-center">
          [ RETORNAR ]
        </button>
      </div>
    </div>
  );
}

// Funções Auxiliares Radar
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
