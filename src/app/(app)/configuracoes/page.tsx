"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, Zap, CheckCircle2, AlertCircle, 
  ShieldCheck, ShieldAlert, Info
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  
  const [resumo, setResumo] = useState({ saldo: 0, maiorGasto: "Analisando...", razao: 0 });
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  const [statusFeedback, setStatusFeedback] = useState({ label: "Analisando Projeção...", color: "text-zinc-500", icon: <Info size={16}/> });
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

        const { data: rawData, error } = await supabase.from("transactions").select("*").eq("user_id", user.id);
        if (error || !rawData) throw error;
        if (!isMounted) return;

        const agora = new Date();
        const entradas = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
        const saidas = rawData.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        
        const gastosMap: any = {};
        rawData.filter(t => t.type === 'withdrawal').forEach(t => {
            const cat = t.category || "Sem Categoria";
            gastosMap[cat] = (gastosMap[cat] || 0) + Math.abs(t.amount);
        });
        const categoriaTop = Object.keys(gastosMap).sort((a, b) => gastosMap[b] - gastosMap[a])[0] || "Nenhum Gasto";
        setResumo({ saldo: entradas - saidas, maiorGasto: categoriaTop, razao: saidas / (entradas || 1) });

        // Radar Stats
        const diasAtivos = new Set(rawData.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7).map(t => new Date(t.created_at).toDateString())).size;
        setRadarStats({
          consistencia: (diasAtivos / 7) * 100,
          precisao: (rawData.filter(t => t.category && t.category !== "Outros").length / (rawData.length || 1)) * 100,
          previsao: rawData.length > 20 ? 90 : 50,
          disciplina: Math.max(0, 100 - (rawData.filter(t => t.type === 'withdrawal' && Math.abs(t.amount) > 700).length * 12)),
          engajamento: 88,
          evolucao: Math.min(100, Math.max(0, ((entradas - saidas) / (entradas || 1)) * 100 + 35))
        });

        // --- LÓGICA DO GRÁFICO UNIFICADA ---
        const numDiasProjecao = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const pontosPorDia = periodo === "mês" ? 4 : 8; 
        const totalPontos = numDiasProjecao * pontosPorDia;
        const tempPoints = [];

        // Valor máximo para normalizar a escala visual
        const maxVal = Math.max(...rawData.map(t => Math.abs(Number(t.amount))), 100);

        for (let i = 0; i <= totalPontos; i++) {
          const dRef = new Date();
          // Mapeia o ponto para o histórico (retroativo de 7 dias para simular a curva)
          dRef.setDate(agora.getDate() - (i % 7)); 
          
          const tDoDia = rawData.filter(t => new Date(t.created_at).toDateString() === dRef.toDateString());
          const vEntrada = tDoDia.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
          const vSaida = tDoDia.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

          let yPos;
          if (periodo === "semana") {
            // SEMANA: Diferencia Entrada (sobe) e Saída (desce) proporcionalmente
            const ganhoEscalado = (vEntrada / maxVal) * 45;
            const gastoEscalado = (vSaida / maxVal) * 45;
            const wave = Math.sin(i * 0.8) * 5; // Pequeno ruído para fluidez
            
            // 65 é o centro. Subtrair sobe (ganho), somar desce (gasto)
            yPos = 65 - ganhoEscalado + gastoEscalado + wave;
          } else {
            // DIA e MÊS: Mantém sua oscilação original perfeita
            const volTotal = vEntrada + vSaida || 100;
            const amplitude = Math.min(Math.max(volTotal / 70, 15), 55);
            const wave = Math.sin(i * 0.9) * amplitude + Math.cos(i * 0.4) * (amplitude / 1.2);
            yPos = Math.max(8, Math.min(122, 65 - wave)); 
          }
          
          tempPoints.push({ x: i * (300 / totalPontos), y: Math.max(10, Math.min(120, yPos)) });
        }
        setTrendData(tempPoints);

        const ultimoPontoY = tempPoints[tempPoints.length - 1].y;
        if (ultimoPontoY < 55) {
          setStatusFeedback({ label: `PROJEÇÃO: ENTRADAS ELEVADAS (+${numDiasProjecao}D)`, color: "text-green-400", icon: <CheckCircle2 size={16}/> });
        } else if (ultimoPontoY > 75) {
          setStatusFeedback({ label: `PROJEÇÃO: SAÍDAS CRÍTICAS (+${numDiasProjecao}D)`, color: "text-red-500", icon: <AlertCircle size={16}/> });
        } else {
          setStatusFeedback({ label: `PROJEÇÃO: FLUXO MODERADO (+${numDiasProjecao}D)`, color: "text-yellow-400", icon: <TrendingUp size={16}/> });
        }

      } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }
    }
    fetchVereditoGeral();
    return () => { isMounted = false; };
  }, [periodo, router]);

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

  const renderGrid = () => {
    const numDias = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
    const intervalLabel = periodo === "mês" ? 5 : 1;
    const lines = [];
    for (let i = 0; i <= numDias; i++) {
      const x = (300 / numDias) * i;
      lines.push(
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="130" stroke="#FFFFFF" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.1" />
          {(i % intervalLabel === 0) && (
            <text x={x} y="150" fontSize="6" fill="#FFFFFF" fontWeight="900" textAnchor="middle" opacity="0.4">+{i}D</text>
          )}
        </g>
      );
    }
    return lines;
  };

  const vereditoFinal = useMemo(() => {
    const score = [radarStats.consistencia, radarStats.precisao, radarStats.previsao, radarStats.disciplina, radarStats.engajamento, radarStats.evolucao].reduce((a, b) => a + b, 0) / 6;
    if (resumo.saldo > 0 && score >= 75) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-400/5", border: "border-green-400/20", icon: <ShieldCheck size={24}/>, desc: "SISTEMA OTIMIZADO. CONTROLE EXPONENCIAL." };
    if (resumo.saldo > 0 && score >= 45) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-400/5", border: "border-yellow-400/20", icon: <Zap size={24}/>, desc: "FLUXO SOB CONTROLE, MAS HÁ PONTOS CEGOS." };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/20", icon: <ShieldAlert size={24}/>, desc: "COLAPSO FINANCEIRO IMINENTE. REAJA." };
  }, [resumo.saldo, radarStats]);

  const radarPath = useMemo(() => {
    const order = [radarStats.consistencia, radarStats.precisao, radarStats.previsao, radarStats.disciplina, radarStats.engajamento, radarStats.evolucao];
    const pts = [0, 60, 120, 180, 240, 300].map((a, i) => {
      const r = (order[i] / 100) * 80;
      return `${100 + r * Math.cos((a - 90) * (Math.PI / 180))},${100 + r * Math.sin((a - 90) * (Math.PI / 180))}`;
    });
    return `M ${pts.join(" L ")} Z`;
  }, [radarStats]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[10px] font-black tracking-[0.5em] text-yellow-400">SINCRONIZANDO VEREDITO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <style>{`
        @keyframes draw { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
        .path-anim { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: draw 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      `}</style>

      <div className="max-w-xl mx-auto space-y-12 pt-4">
        <header className="flex justify-between items-center">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* STATUS */}
        <section className={`p-8 rounded-[3rem] border ${vereditoFinal.border} ${vereditoFinal.bg} backdrop-blur-sm`}>
          <div className="flex items-center gap-3 mb-4">{vereditoFinal.icon}<span className="text-[9px] font-black tracking-[0.4em] text-zinc-500">STATUS DO SISTEMA</span></div>
          <h2 className={`text-6xl font-black italic tracking-tighter ${vereditoFinal.color}`}>{vereditoFinal.label}</h2>
          <p className="text-[10px] font-bold text-white/60 tracking-[0.2em] mt-2 mb-6">{vereditoFinal.desc}</p>
          <div className="border-t border-white/5 pt-6">
            <p className="text-[8px] font-black text-zinc-600 tracking-[0.2em]">ANÁLISE DE FLUXO:</p>
            <p className="text-[9px] text-zinc-400 normal-case mt-2 leading-relaxed tracking-wider">
              MAIOR FOCO DE SAÍDA: <span className="text-white font-bold">{resumo.maiorGasto}</span>. 
              GASTOS CONSOMEM <span className="text-white font-bold">{(resumo.razao * 100).toFixed(0)}%</span> DA RECEITA REGISTRADA.
            </p>
          </div>
        </section>

        {/* GRÁFICO PERSONALIZADO */}
        <div className="bg-[#050505] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] flex items-center gap-2">
              <TrendingUp size={12} className="text-yellow-500"/> 
              PROJEÇÃO {periodo.toUpperCase()}
            </h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button key={t} onClick={() => setPeriodo(t)} 
                  className={`px-5 py-1.5 rounded-lg text-[8px] font-black transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-800'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full mb-12 relative px-2">
            <svg viewBox="0 -10 300 170" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {renderGrid()}
              {periodo === "semana" && <line x1="0" y1="65" x2="300" y2="65" stroke="white" strokeWidth="0.5" opacity="0.05" />}
              
              <path 
                key={periodo}
                d={getSmoothPath()} 
                fill="none" 
                stroke="#facc15" 
                strokeWidth="4" 
                strokeLinecap="round" 
                className="path-anim"
              />
              <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="4" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex items-center gap-4 bg-black/60 p-5 rounded-3xl border border-white/5">
            {statusFeedback.icon}
            <p className={`text-[9px] font-black italic tracking-widest uppercase ${statusFeedback.color}`}>
              {statusFeedback.label}
            </p>
          </div>
        </div>

        {/* RADAR */}
        <section className="bg-[#050505] p-10 rounded-[4rem] border border-white/5">
          <h4 className="text-[9px] font-black text-zinc-600 tracking-[0.3em] mb-12 text-center">PERFIL COMPORTAMENTAL</h4>
          <div className="flex justify-center mb-12">
            <svg viewBox="0 0 200 200" className="w-64 h-64 overflow-visible">
              {[1, 0.75, 0.5, 0.25].map(s => (
                <polygon key={s} points={[0,60,120,180,240,300].map(a => `${100+(80*s)*Math.cos((a-90)*Math.PI/180)},${100+(80*s)*Math.sin((a-90)*Math.PI/180)}`).join(" ")} fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
              ))}
              <path d={radarPath} fill="#facc15" fillOpacity="0.2" stroke="#facc15" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
          
          <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-8">
            {[
              { l: "CONSISTÊNCIA", v: radarStats.consistencia },
              { l: "PRECISÃO", v: radarStats.precisao },
              { l: "PREVISÃO", v: radarStats.previsao },
              { l: "DISCIPLINA", v: radarStats.disciplina },
              { l: "ENGAJAMENTO", v: radarStats.engajamento },
              { l: "EVOLUÇÃO", v: radarStats.evolucao },
            ].map((item) => (
              <div key={item.l} className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                <span className="text-[7px] font-black text-zinc-500 tracking-tighter">{item.l}</span>
                <span className="text-[10px] font-black text-yellow-400 italic">{item.v.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
