"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, ShieldCheck, Target, Activity, Flame, Gauge, BrainCircuit, Loader2 } from "lucide-react";
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
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // Busca Transações e Limites em paralelo
        const [transRes, limitesRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: false }),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        const agora = new Date();

        // --- 1. CONSISTÊNCIA (Últimos 7 dias ativos) ---
        const dias7D = new Set(
          rawData
            .filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7)
            .map(t => new Date(t.created_at).toDateString())
        ).size;
        const consistencia = (dias7D / 7) * 100;

        // --- 2. PRECISÃO (Evitar categoria 'Outros') ---
        const totalT = rawData.length || 1;
        const bemCategorizadas = rawData.filter(t => t.category && t.category !== "Outros" && t.category !== "Outra").length;
        const precisao = (bemCategorizadas / totalT) * 100;

        // --- 3. PREVISÃO (Cobertura de Limites) ---
        const categoriasComSaida = new Set(rawData.filter(t => t.type === 'withdrawal').map(t => t.category)).size;
        const previsao = categoriasComSaida > 0 ? (limites.length / categoriasComSaida) * 100 : 0;

        // --- 4. DISCIPLINA (Respeito aos limites por categoria) ---
        let penalidade = 0;
        limites.forEach(lim => {
          const gastoCat = rawData
            .filter(t => t.category === lim.category && t.type === 'withdrawal')
            .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          if (gastoCat > lim.limit_amount) {
            penalidade += ((gastoCat - lim.limit_amount) / lim.limit_amount) * 25; 
          }
        });
        const disciplina = Math.max(0, 100 - penalidade);

        // --- 5. EVOLUÇÃO (Investimentos e Aportes) ---
        const volInvestido = rawData
          .filter(t => ["Investimentos", "Aportes", "Reserva", "Investimento"].includes(t.category))
          .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const entradasTotais = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
        const evolucao = entradasTotais > 0 ? (volInvestido / (entradasTotais * 0.2)) * 100 : 0;

        // --- 6. ENGAJAMENTO (Média de 2 registros/dia) ---
        const dataInicio = new Date(rawData[rawData.length - 1]?.created_at || agora);
        const diasDeVida = Math.max(1, Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 3600 * 24)));
        const engajamento = (totalT / (diasDeVida * 2)) * 100;

        setMetrics({
          consistencia: Math.min(100, Math.round(consistencia)),
          precisao: Math.min(100, Math.round(precisao)),
          previsao: Math.min(100, Math.round(previsao)),
          disciplina: Math.min(100, Math.round(disciplina)),
          evolucao: Math.min(100, Math.round(evolucao)),
          engajamento: Math.min(100, Math.round(engajamento))
        });

      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchVereditoData();
  }, [router]);

  const getStatusDetail = (avg: number) => {
    if (avg >= 90) return { label: "IMPLACÁVEL", desc: "Execução perfeita. O sistema opera em eficiência máxima sem falhas detectadas.", color: "text-cyan-400", bg: "bg-cyan-500/10" };
    if (avg >= 75) return { label: "DOMINANTE", desc: "Controle exponencial. Sua estratégia está sobrepondo as variações do mercado.", color: "text-green-400", bg: "bg-green-500/10" };
    if (avg >= 55) return { label: "ESTÁVEL", desc: "Fluxo constante. O gerenciamento está segurando a volatilidade com segurança.", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    if (avg >= 35) return { label: "MODERADO", desc: "Atenção necessária. Existem brechas na consistência que podem gerar perdas.", color: "text-orange-400", bg: "bg-orange-500/10" };
    return { label: "CRÍTICO", desc: "Risco de colapso. O comportamento atual não sustenta o patrimônio a longo prazo.", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
  const status = getStatusDetail(avgScore);

  const renderRadar = () => {
    const pts = [metrics.consistencia, metrics.precisao, metrics.previsao, metrics.disciplina, metrics.evolucao, metrics.engajamento];
    const points = pts.map((val, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = (val / 100) * 80;
      return `${100 + r * Math.cos(angle)},${100 + r * Math.sin(angle)}`;
    }).join(" ");

    return (
      <svg viewBox="0 0 200 200" className="w-full h-64 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
        {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
          <polygon key={p} points={Array.from({length: 6}).map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            return `${100 + p * 80 * Math.cos(a)},${100 + p * 80 * Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
        ))}
        <polygon points={points} fill="rgba(250, 204, 21, 0.3)" stroke="#facc15" strokeWidth="2.5" className="transition-all duration-700" />
      </svg>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="text-yellow-400 animate-spin" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans uppercase tracking-tighter">
      <div className="max-w-xl mx-auto space-y-10 pt-8">
        
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <h1 className="text-6xl font-black italic leading-none text-white">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400 animate-pulse" size={24} />
        </header>

        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className={status.color} size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">STATUS FINANCEIRO</span>
            </div>
            <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed normal-case max-w-[90%]">{status.desc}</p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5">
          <div className="flex items-center gap-2 mb-8 text-zinc-600">
            <Target size={14} />
            <span className="text-[9px] font-black tracking-[0.2em]">MATRIZ TÉCNICA COMPORTAMENTAL</span>
          </div>

          <div className="flex justify-center mb-10">{renderRadar()}</div>

          <div className="grid grid-cols-3 gap-y-8 gap-x-4 border-t border-white/5 pt-8">
            {[
              { label: "CONSISTÊNCIA", val: metrics.consistencia, icon: <Activity size={10}/> },
              { label: "PRECISÃO", val: metrics.precisao, icon: <Target size={10}/> },
              { label: "PREVISÃO", val: metrics.previsao, icon: <BrainCircuit size={10}/> },
              { label: "DISCIPLINA", val: metrics.disciplina, icon: <ShieldCheck size={10}/> },
              { label: "EVOLUÇÃO", val: metrics.evolucao, icon: <Gauge size={10}/> },
              { label: "ENGAJAMENTO", val: metrics.engajamento, icon: <Flame size={10}/> },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-500 text-[7px] font-black tracking-widest uppercase">
                  {item.icon} {item.label}
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
