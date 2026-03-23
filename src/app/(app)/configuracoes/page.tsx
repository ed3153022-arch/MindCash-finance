"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, Zap, CheckCircle2, AlertCircle, 
  Info, Target, ShieldCheck, ShieldAlert, AlertTriangle 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  
  // Estados de Dados e Interface
  const [saldoReal, setSaldoReal] = useState(0);
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  const [statusFeedback, setStatusFeedback] = useState({ label: "Analisando...", color: "text-zinc-500", icon: <Info size={16}/> });
  const [radarStats, setRadarStats] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchVereditoGeral() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: rawData, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id);

        if (error || !rawData) throw error;
        if (!isMounted) return;

        const agora = new Date();

        // --- 1. CÁLCULO DE SALDO E VOLUMES ---
        const entradas = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
        const saidas = rawData.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const saldoTotal = entradas - saidas;
        setSaldoReal(saldoTotal);

        const volumesHistoricos: number[] = [];
        for (let i = 0; i < 30; i++) {
          const dRef = new Date();
          dRef.setDate(agora.getDate() - i);
          const volume = rawData
            .filter(t => new Date(t.created_at).toDateString() === dRef.toDateString())
            .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          volumesHistoricos.push(volume || 50);
        }

        // --- 2. CÁLCULO AUTOMÁTICO DO RADAR (6 PONTAS) ---
        const diasAtivos = new Set(rawData
          .filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7)
          .map(t => new Date(t.created_at).toDateString())
        ).size;
        
        const totalComCategoria = rawData.filter(t => t.category && t.category !== "Outros").length;

        setRadarStats({
          consistencia: (diasAtivos / 7) * 100,
          precisao: (totalComCategoria / (rawData.length || 1)) * 100,
          previsao: rawData.length > 15 ? 85 : 40,
          disciplina: Math.max(0, 100 - (rawData.filter(t => t.type === 'withdrawal' && Math.abs(t.amount) > 800).length * 15)),
          engajamento: 85,
          evolucao: Math.min(100, Math.max(0, ((entradas - saidas) / (entradas || 1)) * 100 + 40))
        });

        // --- 3. LÓGICA DO GRÁFICO DE TENDÊNCIA (SUAVE) ---
        const numDiasProjecao = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const pontosPorDia = periodo === "mês" ? 4 : 8; 
        const totalPontos = numDiasProjecao * pontosPorDia;
        const tempPoints = [];

        for (let i = 0; i <= totalPontos; i++) {
          const diaSimulado = Math.floor(i / pontosPorDia) % volumesHistoricos.length;
          const volBase = volumesHistoricos[diaSimulado];
          const amplitude = Math.min(Math.max(volBase / 70, 15), 55);
          const wave = Math.sin(i * 0.9) * amplitude + Math.cos(i * 0.4) * (amplitude / 1.2);
          
          tempPoints.push({ 
            x: i * (300 / totalPontos), 
            y: Math.max(8, Math.min(122, 65 - wave)) 
          });
        }
        setTrendData(tempPoints);

        const ultimoPontoY = tempPoints[tempPoints.length - 1].y;
        if (ultimoPontoY < 45) {
          setStatusFeedback({ label: `PROJEÇÃO: TENDÊNCIA DE LUCRO (+${numDiasProjecao}D)`, color: "text-green-400", icon: <CheckCircle2 size={16}/> });
        } else if (ultimoPontoY > 85) {
          setStatusFeedback({ label: `PROJEÇÃO: TENDÊNCIA DE GASTOS (+${numDiasProjecao}D)`, color: "text-red-500", icon: <AlertCircle size={16}/> });
        } else {
          setStatusFeedback({ label: `PROJEÇÃO: FLUXO MODERADO (+${numDiasProjecao}D)`, color: "text-yellow-400", icon: <TrendingUp size={16}/> });
        }

      } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }
    }

    fetchVereditoGeral();
    return () => { isMounted = false; };
  }, [periodo, router]);

  // --- MEMOS DE INTERFACE ---
  const vereditoFinal = useMemo(() => {
    const score = Object.values(radarStats).reduce((a, b) => a + b, 0) / 6;
    if (saldoReal > 0 && score >= 75) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-400/5", border: "border-green-400/20", icon: <ShieldCheck size={24}/>, desc: "SISTEMA OTIMIZADO. CONTROLE EXPONENCIAL." };
    if (saldoReal > 0 && score >= 45) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-400/5", border: "border-yellow-400/20", icon: <Zap size={24}/>, desc: "FLUXO SOB CONTROLE, MAS HÁ PONTOS CEGOS." };
    if (saldoReal <= 0) return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/20", icon: <ShieldAlert size={24}/>, desc: "COLAPSO FINANCEIRO IMINENTE. REAJA." };
    return { label: "FRÁGIL", color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20", icon: <AlertTriangle size={24}/>, desc: "SALDO EXISTE, MAS FALTA DISCIPLINA." };
  }, [saldoReal, radarStats]);

  const radarPath = useMemo(() => {
    const stats = [radarStats.consistencia, radarStats.precisao, radarStats.previsao, radarStats.disciplina, radarStats.engajamento, radarStats.evolucao];
    const pts = [0, 60, 120, 180, 240, 300].map((a, i) => {
      const r = (stats[i] / 100) * 80;
      return `${100 + r * Math.cos((a - 90) * (Math.PI / 180))},${100 + r * Math.sin((a - 90) * (Math.PI / 180))}`;
    });
    return `M ${pts.join(" L ")} Z`;
  }, [radarStats]);

  const getSmoothPath = () => {
    if (trendData.length < 2) return "";
    let d = `M ${trendData[0].x},${trendData[0].y}`;
    for (let i = 0; i < trendData.length - 1; i++) {
      const curr = trendData[i];
      const next = trendData[i + 1];
      const mx = (curr.x + next.x) / 2;
      const my = (curr.y + next.y) / 2;
      d += ` Q ${curr.x},${curr.y} ${mx},${my}`;
    }
    d += ` L ${trendData[trendData.length - 1].x},${trendData[trendData.length - 1].y}`;
    return d;
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[10px] font-black tracking-[0.5em] text-yellow-400 animate-pulse">PROCESSANDO VEREDITO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase overflow-x-hidden">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
        .path-anim { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: draw 3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-4">
        
        <header className="flex justify-between items-center">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* 1. STATUS DA CONTA (O VEREDITO) */}
        <section className={`p-8 rounded-[3rem] border ${vereditoFinal.border} ${vereditoFinal.bg} backdrop-blur-sm transition-all`}>
          <div className="flex items-center gap-3 mb-4">
            {vereditoFinal.icon}
            <span className="text-[9px] font-black tracking-[0.4em] text-zinc-500">STATUS DO SISTEMA</span>
          </div>
          <h2 className={`text-6xl font-black italic tracking-tighter ${vereditoFinal.color}`}>{vereditoFinal.label}</h2>
          <p className="text-[10px] font-bold text-white/60 tracking-[0.2em] mt-2">{vereditoFinal.desc}</p>
          <div className="mt-8 flex gap-8 border-t border-white/5 pt-6">
            <div><p className="text-[7px] text-zinc-600 font-black tracking-widest">PATRIMÔNIO</p><p className="text-sm font-black italic">{saldoReal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            <div><p className="text-[7px] text-zinc-600 font-black tracking-widest">DISCIPLINA</p><p className="text-sm font-black italic">{(Object.values(radarStats).reduce((a,b)=>a+b,0)/6).toFixed(0)}%</p></div>
          </div>
        </section>

        {/* 2. TENDÊNCIA (GRÁFICO DE LINHA) */}
        <section className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> 
              TENDÊNCIAS DO PRÓXIMO {periodo.toUpperCase()}
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button key={t} onClick={() => setPeriodo(t)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-700'}`}>{t}</button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full mb-12 relative px-2">
            <svg viewBox="0 -10 300 170" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path key={periodo} d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" className="path-anim" />
              <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="4" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex items-center gap-4 bg-black/60 p-5 rounded-3xl border border-white/5">
            {statusFeedback.icon}
            <p className={`text-[9px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>{statusFeedback.label}</p>
          </div>
        </section>

        {/* 3. STATUS DO USUÁRIO (RADAR) */}
        <section className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 text-center">
          <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] mb-12 flex justify-center items-center gap-2">
            <Target size={12} className="text-yellow-500"/> STATUS DO USUÁRIO
          </h4>
          <div className="flex justify-center mb-6">
            <svg viewBox="0 0 200 200" className="w-64 h-64 overflow-visible">
              {[1, 0.75, 0.5, 0.25].map(s => (
                <polygon key={s} points={[0,60,120,180,240,300].map(a => `${100+(80*s)*Math.cos((a-90)*Math.PI/180)},${100+(80*s)*Math.sin((a-90)*Math.PI/180)}`).join(" ")} fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
              ))}
              <path d={radarPath} fill="#facc15" fillOpacity="0.2" stroke="#facc15" strokeWidth="3" strokeLinejoin="round" />
              {["CONSISTÊNCIA", "PRECISÃO", "PREVISÃO", "DISCIPLINA", "ENGAJAMENTO", "EVOLUÇÃO"].map((label, i) => {
                const a = i * 60 - 90;
                return <text key={label} x={100 + 105 * Math.cos(a * Math.PI / 180)} y={100 + 105 * Math.sin(a * Math.PI / 180)} fontSize="6" fill="white" textAnchor="middle" fontWeight="bold" opacity="0.3">{label}</text>
              })}
            </svg>
          </div>
          <p className="text-[8px] font-black text-yellow-400 tracking-[0.4em] mt-4 opacity-70">SISTEMA DE ANÁLISE COMPORTAMENTAL ATIVO</p>
        </section>

      </div>
    </div>
  );
}
