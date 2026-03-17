"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, TrendingUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [updateTrigger, setUpdateTrigger] = useState(0); 
  
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
    const fetchPreciseData = async () => {
      try {
        if (updateTrigger === 0) setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Busca simultânea para garantir sincronia
        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('date', { ascending: true }),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        // --- CÁLCULO DE TEIA ---
        const totalMeta = goals.reduce((acc, g) => acc + Number(g.amount || g.target_value || 0), 0) || 1000;
        const totalGasto = txs.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const limiteDiario = totalMeta / 30;
        const norm = (val: number) => Math.max(8, Math.min(100, Math.round(val)));

        setStats([
          { label: "Disciplina", value: norm((txs.length / 30) * 100) },
          { label: "Produtividade", value: norm((goals.length * 20)) },
          { label: "Conhecimento", value: norm(txs.filter(t => /educa|livro|curso/i.test(t.category || "")).length * 40) },
          { label: "Resiliência", value: norm(txs.length > 0 ? (txs.filter(t => Number(t.amount) <= limiteDiario).length / txs.length) * 100 : 50) },
          { label: "Autocontrole", value: norm(100 - (totalGasto / totalMeta * 100)) },
          { label: "Visão", value: norm(goals.length * 25) },
        ]);

        // --- LÓGICA DE LINHA: MONITOR DE SALDO (SOBE/DESCE) ---
        let numPontos = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const dataPoints = new Array(numPontos).fill(0);
        
        // Mapa para acumular o saldo por ponto tempora
        txs.forEach(t => {
          const d = new Date(t.date || t.created_at);
          let key;
          
          if (periodo === "dia") {
            key = d.getHours();
            numPontos = 24;
          } else if (periodo === "semana") {
            key = d.getDay(); 
            numPontos = 7;
          } else {
            key = d.getDate() - 1; 
            numPontos = 31;
          }
          
          // Entradas SOMAM (+), Saídas SUBTRAEM (-)
          if (t.type === 'income') {
            dataPoints[key] += Math.abs(Number(t.amount));
          } else {
            dataPoints[key] -= Math.abs(Number(t.amount));
          }
        });

        // Converte o mapa em saldo acumulado
        const maxReferencia = Math.max(totalMeta, limiteDiario * 2); 
        let saldoAcumulado = 0;
        
        const finalGraph = dataPoints.map((valorPonto, i) => {
          saldoAcumulado += valorPonto;
          
          // Normalização: O gráfico começa em 80% (Saldo Normal).
          // Entradas sobem a linha, Saídas descem.
          // Altura máxima limitada a 95% para não cortar o topo.
          const yNormalizado = Math.min(95, Math.max(5, 80 + (saldoAcumulado / maxReferencia) * 100));
          
          return { x: i, y: 100 - yNormalizado };
        });

        setGraphData(finalGraph);
      } catch (e) {
        console.error("Erro fatal de precisão:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPreciseData();

    // SINC. REALTIME DO SUPABASE
    const channel = supabase
      .channel('live-veredito')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        setUpdateTrigger(prev => prev + 1); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [periodo, updateTrigger]);

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
      <Loader2 className="text-yellow-400 animate-spin w-8 h-8 mb-4" />
      <p className="text-yellow-400 font-black italic text-[10px] tracking-[0.3em]">RECALCULANDO PRECISÃO...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-8 pt-8 relative overflow-hidden">
        
        {/* Marcador LIVE no topo */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 border border-zinc-800 px-3 py-1 rounded-full z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.7)]"></div>
          <span className="text-[7px] text-zinc-500 font-black tracking-widest">LIVE ANALYSIS</span>
        </div>

        <header>
          <h1 className="text-6xl font-black italic leading-none tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-600 text-[8px] font-bold tracking-[0.4em] mt-2">Intelligence Performance System</p>
        </header>

        {/* Banner de Status */}
        <div className="bg-yellow-400 p-5 rounded-2xl border-2 border-black flex items-center justify-between shadow-[0_0_30px_rgba(250,204,21,0.2)]">
          <h3 className="text-black text-2xl font-black italic uppercase text-shadow-sm">EM EVOLUÇÃO</h3>
          <Zap className="text-black h-7 w-7 fill-black" />
        </div>

        {/* Radar */}
        <div className="bg-[#080808] rounded-[2.5rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-52 h-52 mb-10">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.15)" stroke="#facc15" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-y-8 gap-x-4 w-full border-t border-white/5 pt-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[7px] font-black uppercase text-zinc-600 mb-1">{s.label}</p>
                <p className="text-3xl font-black italic tracking-tighter">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico Neon (Sobe/Desce) */}
        <div className="bg-[#080808] p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-10 relative">
            <h4 className="text-[9px] font-black text-zinc-500 italic flex items-center gap-2">
              <TrendingUp size={14} className="text-yellow-400 opacity-50"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10 z-10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${periodo === t ? 'bg-yellow-400 text-black shadow-lg' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-40 w-full relative">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getPath()} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px #facc15)' }} />
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[9px] uppercase tracking-[0.4em] hover:text-white transition-all text-center flex items-center justify-center gap-2">
          [ RETORNAR AO DASHBOARD ]
        </button>
      </div>
    </div>
  );
}

// Funções Auxiliares (Não alterar)
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
