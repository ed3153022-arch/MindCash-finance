"use client";

import React, { useEffect, useState, useMemo } from "react";
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

        const [transRes, limitesRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: false }),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        const agora = new Date();

        // 1. CONSISTÊNCIA (Rigorosa: Presença diária na última semana)
        const dias7D = new Set(rawData.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7).map(t => new Date(t.created_at).toDateString())).size;
        const consistencia = (dias7D / 7) * 100;

        // 2. PRECISÃO (Qualidade dos dados - Categoria "Outros" é erro)
        const totalT = rawData.length || 1;
        const precisao = (rawData.filter(t => t.category && !["Outros", "Outra", "Nenhum"].includes(t.category)).length / totalT) * 100;

        // 3. PREVISÃO (Planejamento vs Realidade)
        const categoriasGastas = new Set(rawData.filter(t => t.type === 'withdrawal').map(t => t.category)).size;
        const previsao = categoriasGastas > 0 ? (limites.length / categoriasGastas) * 100 : 0;

        // 4. DISCIPLINA (Respeito matemático aos limites)
        let desvioTotal = 0;
        limites.forEach(lim => {
          const gasto = rawData.filter(t => t.category === lim.category && t.type === 'withdrawal').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          if (gasto > lim.limit_amount) desvioTotal += (gasto - lim.limit_amount) / lim.limit_amount;
        });
        const disciplina = Math.max(0, 100 - (desvioTotal * 50));

        // 5. EVOLUÇÃO (Aporte de capital/Investimento)
        const volInvestido = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const receita = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
        const evolucao = receita > 0 ? (volInvestido / (receita * 0.25)) * 100 : 0;

        // 6. ENGAJAMENTO (Frequência de uso)
        const dataInicio = new Date(rawData[rawData.length - 1]?.created_at || agora);
        const dias = Math.max(1, Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 3600 * 24)));
        const engajamento = (totalT / (dias * 3)) * 100; // Meta de 3 registros/dia

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

  // DICIONÁRIO DE LEGENDAS ALTERNANTES
  const getStatusDetail = (avg: number) => {
    // Usamos o dia do mês para alternar entre a legenda A e B
    const alt = new Date().getDate() % 2 === 0;

    if (avg >= 95) return {
      label: "IMPLACÁVEL",
      color: "text-cyan-400", bg: "bg-cyan-500/10",
      desc: alt ? "Sincronia total. Seu capital está blindado por uma execução matemática impecável." : "Eficiência máxima. Não existem pontos cegos no seu fluxo financeiro atual."
    };
    if (avg >= 80) return {
      label: "DOMINANTE",
      color: "text-green-400", bg: "bg-green-500/10",
      desc: alt ? "Controle superior. Você dita as regras do seu dinheiro com margem de segurança." : "Estratégia sólida. Suas decisões estão sobrepondo as variações do mercado."
    };
    if (avg >= 60) return {
      label: "ESTÁVEL",
      color: "text-yellow-400", bg: "bg-yellow-500/10",
      desc: alt ? "Zona de segurança. O sistema está equilibrado, mas permite otimizações de lucro." : "Fluxo constante. Você mantém a ordem, embora falte agressividade nos aportes."
    };
    if (avg >= 40) return {
      label: "MODERADO",
      color: "text-orange-400", bg: "bg-orange-500/10",
      desc: alt ? "Alerta de oscilação. Existem brechas na sua disciplina que drenam o patrimônio." : "Atenção necessária. O comportamento atual gera risco de estagnação a médio prazo."
    };
    return {
      label: "CRÍTICO",
      color: "text-red-500", bg: "bg-red-500/10",
      desc: alt ? "Risco de colapso. A ausência de regras está destruindo sua previsibilidade." : "Emergência financeira. O sistema opera em déficit de controle e alto risco."
    };
  };

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
  const status = getStatusDetail(avgScore);

  const renderRadar = () => {
    const labels = ["CONSISTÊNCIA", "PRECISÃO", "PREVISÃO", "DISCIPLINA", "EVOLUÇÃO", "ENGAJAMENTO"];
    const pts = [metrics.consistencia, metrics.precisao, metrics.previsao, metrics.disciplina, metrics.evolucao, metrics.engajamento];
    const cx = 100, cy = 100, radius = 70;

    const points = pts.map((val, i) => {
      const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const r = (val / 100) * radius;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(" ");

    return (
      <svg viewBox="0 0 200 200" className="w-full h-80 overflow-visible drop-shadow-[0_0_15px_rgba(250,204,21,0.2)]">
        {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
          <polygon key={p} points={Array.from({length: 6}).map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            return `${cx + p * radius * Math.cos(a)},${cy + p * radius * Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
        ))}
        <polygon points={points} fill="rgba(250, 204, 21, 0.3)" stroke="#facc15" strokeWidth="2.5" />
        {labels.map((label, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          const x = cx + (radius + 20) * Math.cos(a);
          const y = cy + (radius + 20) * Math.sin(a);
          return <text key={i} x={x} y={y} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#71717a" className="uppercase tracking-widest">{label}</text>;
        })}
      </svg>
    );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans uppercase tracking-tighter">
      <div className="max-w-xl mx-auto space-y-10 pt-8">
        
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <h1 className="text-6xl font-black italic text-white">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* STATUS COM LEGENDA DINÂMICA */}
        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className={status.color} size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">DIAGNÓSTICO ATIVO</span>
            </div>
            <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed normal-case max-w-[90%]">
              {status.desc}
            </p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5">
          <div className="flex justify-center mb-10 overflow-visible">{renderRadar()}</div>

          <div className="grid grid-cols-3 gap-y-8 gap-x-4 border-t border-white/5 pt-8">
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key}>
                <p className="text-[7px] text-zinc-500 font-black mb-1">{key.toUpperCase()}</p>
                <p className="text-xl font-black italic">{val}<span className="text-yellow-500 text-[10px]">%</span></p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
