"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, TrendingUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [updateTrigger, setUpdateTrigger] = useState(0); // Gatilho para forçar atualização
  
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
    const fetchRealtimeData = async () => {
      try {
        if (updateTrigger === 0) setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscando dados com timestamp para garantir que pegamos o que acabou de ser inserido
        const [txsRes, goalsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: true }),
          supabase.from("goals").select("*").eq("user_id", user.id)
        ]);

        const txs = txsRes.data || [];
        const goals = goalsRes.data || [];

        // --- CÁLCULO DE TEIA ---
        const totalMeta = goals.reduce((acc, g) => acc + Number(g.amount || g.target_value || 0), 0) || 1;
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

        // --- LÓGICA DE GRÁFICO TEMPO REAL ---
        const agora = new Date();
        let numPontos = periodo === "dia" ? 24 : periodo === "semana" ? 7 : 30;
        const dataPoints = new Array(numPontos).fill(0);

        txs.forEach(t => {
          const dt = new Date(t.created_at); // Usar created_at para precisão de inserção
          let index = -1;

          if (periodo === "dia") {
            // Se for das últimas 24h
            const diffHoras = Math.floor((agora.getTime() - dt.getTime()) / (1000 * 3600));
            if (diffHoras < 24) index = 23 - diffHoras;
          } else if (periodo === "semana") {
            const diffDias = Math.floor((agora.getTime() - dt.getTime()) / (1000 * 3600 * 24));
            if (diffDias < 7) index = 6 - diffDias;
          } else {
            if (dt.getMonth() === agora.getMonth()) index = dt.getDate() - 1;
          }

          if (index >= 0 && index < numPontos) {
            dataPoints[index] += Math.abs(Number(t.amount));
          }
        });

        const maxGasto = Math.max(...dataPoints, limiteDiario);
        const finalGraph = dataPoints.map((val, i) => ({
          x: i,
          y: 100 - Math.min(90, (val / maxGasto) * 80 + (val > 0 ? 10 : 5))
        }));

        setGraphData(finalGraph);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRealtimeData();

    // ESCUTADOR EM TEMPO REAL DO SUPABASE [NOVIDADE]
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        setUpdateTrigger(prev => prev + 1); // Força o useEffect a rodar de novo
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
      <p className="text-yellow-400 font-black italic text-[10px] tracking-[0.3em]">SINC. REALTIME...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-8 pt-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black italic leading-none tracking-tighter">VEREDITO</h1>
            <p className="text-zinc-600 text-[7px] font-bold tracking-[0.5em] mt-2">Live Analysis System</p>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-red-500 animate-ping"></div>
            <span className="text-[6px] text-zinc-500 font-black">LIVE</span>
          </div>
        </header>

        {/* Radar */}
        <div className="bg-[#080808] rounded-[2.5rem] border border-white/5 p-10 flex flex-col items-center shadow-2xl">
          <div className="relative w-52 h-52 mb-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map(r => (
                <polygon key={r} points={getPoints(r/2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.1" />
              ))}
              <polygon points={getDataPoints(stats)} fill="rgba(250, 204, 21, 0.1)" stroke="#facc15" strokeWidth="2" strokeLinejoin="round" />
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

        {/* Gráfico Tendência com Neon */}
        <div className="bg-[#080808] p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-[9px] font-black text-zinc-500 italic flex items-center gap-2">
              <TrendingUp size={14} className="text-yellow-400"/> Tendência {periodo}
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map(t => (
                <button key={t} onClick={() => setPeriodo(t as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="h-40 w-full">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getPath()} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px #facc15)' }} />
            </svg>
          </div>
        </div>

        <button onClick={() => router.push("/dashboard")} className="w-full py-4 text-zinc-800 font-black text-[9px] tracking-[0.5em] hover:text-white transition-all text-center">
          [ VOLTAR ]
        </button>
      </div>
    </div>
  );
}

// Funções Auxiliares Radar (Precisão Geométrica)
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
