"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, ShieldCheck, Target, Activity, Flame, Gauge, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    consistencia: 0,
    precisao: 0,
    previsao: 0,
    disciplina: 0,
    engajamento: 0,
    evolucao: 0
  });

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // Simulação de busca de dados para as métricas (Substitua pela sua lógica de DB)
        setMetrics({
          consistencia: 88,
          precisao: 92,
          previsao: 74,
          disciplina: 95,
          engajamento: 81,
          evolucao: 89
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchVereditoData();
  }, [router]);

  // Lógica de Status Expandida (Mais de 3 níveis)
  const getStatusDetail = (avg: number) => {
    if (avg >= 95) return { label: "IMPLACÁVEL", desc: "Execução perfeita. O sistema opera em eficiência máxima sem falhas detectadas.", color: "text-cyan-400", bg: "bg-cyan-500/10" };
    if (avg >= 85) return { label: "DOMINANTE", desc: "Controle exponencial. Sua estratégia está sobrepondo as variações do mercado.", color: "text-green-400", bg: "bg-green-500/10" };
    if (avg >= 70) return { label: "ESTÁVEL", desc: "Fluxo constante. O gerenciamento está segurando a volatilidade com segurança.", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    if (avg >= 50) return { label: "MODERADO", desc: "Atenção necessária. Existem brechas na consistência que podem gerar perdas.", color: "text-orange-400", bg: "bg-orange-500/10" };
    return { label: "CRÍTICO", desc: "Risco de colapso. O comportamento atual não sustenta o patrimônio a longo prazo.", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
  const status = getStatusDetail(avgScore);

  // Gerador de Radar SVG
  const renderRadar = () => {
    const pts = [metrics.consistencia, metrics.precisao, metrics.previsao, metrics.disciplina, metrics.engajamento, metrics.evolucao];
    const points = pts.map((val, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = (val / 100) * 80;
      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
    }).join(" ");

    return (
      <svg viewBox="0 0 200 200" className="w-full h-64 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
        {/* Teias de fundo */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
          <polygon key={p} points={Array.from({length: 6}).map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            return `${100 + p * 80 * Math.cos(a)},${100 + p * 80 * Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
        ))}
        {/* Polígono de Dados */}
        <polygon points={points} fill="rgba(250, 204, 21, 0.3)" stroke="#facc15" strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans uppercase tracking-tighter">
      <div className="max-w-xl mx-auto space-y-10 pt-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <h1 className="text-6xl font-black italic leading-none">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400 animate-pulse" size={24} />
        </header>

        {/* PARTE 2: STATUS DETALHADO */}
        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className={status.color} size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">STATUS DO SISTEMA</span>
            </div>
            <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed normal-case max-w-[90%]">
              {status.desc}
            </p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        {/* PARTE 1: RADAR E LEGENDA 3 COLUNAS */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5">
          <div className="flex items-center gap-2 mb-8 text-zinc-600">
            <Target size={14} />
            <span className="text-[9px] font-black tracking-[0.2em]">PERFIL COMPORTAMENTAL ATIVO</span>
          </div>

          <div className="flex justify-center mb-10">
            {renderRadar()}
          </div>

          {/* LEGENDA EM 3 COLUNAS / 2 LINHAS */}
          <div className="grid grid-cols-3 gap-y-8 gap-x-4 border-t border-white/5 pt-8">
            {[
              { label: "CONSISTÊNCIA", val: metrics.consistencia, icon: <Activity size={10}/> },
              { label: "PRECISÃO", val: metrics.precisao, icon: <Target size={10}/> },
              { label: "PREVISÃO", val: metrics.previsao, icon: <BrainCircuit size={10}/> },
              { label: "DISCIPLINA", val: metrics.disciplina, icon: <ShieldCheck size={10}/> },
              { label: "ENGAJAMENTO", val: metrics.engajamento, icon: <Flame size={10}/> },
              { label: "EVOLUÇÃO", val: metrics.evolucao, icon: <Gauge size={10}/> },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  {item.icon}
                  <span className="text-[8px] font-bold">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black italic">{item.val}</span>
                  <span className="text-[10px] font-bold text-yellow-500">%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
