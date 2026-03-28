"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, ShieldCheck, Target, Activity, Flame, Gauge, BrainCircuit, Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
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

        // --- CÁLCULO DE PROJEÇÃO DE SOBREVIVÊNCIA (BURN RATE) ---
        const saidas = rawData.filter(t => t.type === 'withdrawal');
        const saldoAtual = rawData.reduce((acc, t) => t.type === 'deposit' ? acc + Number(t.amount) : acc - Math.abs(Number(t.amount)), 0);
        
        // Média de gastos diários baseada nos últimos 30 dias
        const ultimos30Dias = saidas.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 30);
        const gastoDiarioMedio = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) / 30;
        
        const diasRestantes = gastoDiarioMedio > 0 ? Math.floor(saldoAtual / gastoDiarioMedio) : 0;
        const percentualAutonomia = Math.min(100, (diasRestantes / 30) * 100); // Normalizado para uma barra de 30 dias

        setBurnData({
          dias: Math.max(0, diasRestantes),
          percentual: Math.max(0, percentualAutonomia)
        });

        // --- CÁLCULO DAS MÉTRICAS ---
        const dias7D = new Set(rawData.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7).map(t => new Date(t.created_at).toDateString())).size;
        const consistencia = (dias7D / 7) * 100;

        const totalT = rawData.length || 1;
        const precisao = (rawData.filter(t => t.category && !["Outros", "Outra", "Nenhum"].includes(t.category)).length / totalT) * 100;

        const categoriasGastas = new Set(saidas.map(t => t.category)).size;
        const previsao = categoriasGastas > 0 ? (limites.length / categoriasGastas) * 100 : 0;

        let desvioTotal = 0;
        limites.forEach(lim => {
          const gasto = saidas.filter(t => t.category === lim.category).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          if (gasto > lim.limit_amount) desvioTotal += (gasto - lim.limit_amount) / lim.limit_amount;
        });
        const disciplina = Math.max(0, 100 - (desvioTotal * 50));

        const volInvestido = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const receita = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
        const evolucao = receita > 0 ? (volInvestido / (receita * 0.25)) * 100 : 0;

        const dataInicio = new Date(rawData[rawData.length - 1]?.created_at || agora);
        const diasUso = Math.max(1, Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 3600 * 24)));
        const engajamento = (totalT / (diasUso * 3)) * 100;

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

  const vulnerability = useMemo(() => {
    const lowest = Object.entries(metrics).reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    const alt = new Date().getDate() % 2 === 0;
    const tips: Record<string, { label: string, msgA: string, msgB: string }> = {
      consistencia: { label: "FLUXO IRREGULAR", msgA: "Sua frequência de registro caiu.", msgB: "Lacunas detectadas no controle." },
      precisao: { label: "DADOS CEGOS", msgA: "Muitos gastos sem categoria.", msgB: "Categorização ineficiente detectada." },
      previsao: { label: "FALTA DE ALVO", msgA: "Você está gastando sem planejamento.", msgB: "Orçamento desprotegido." },
      disciplina: { label: "LIMITE VIOLADO", msgA: "Teto de gastos ultrapassado.", msgB: "Fuga de capital detectada." },
      evolucao: { label: "ESTAGNAÇÃO", msgA: "Aportes abaixo da meta.", msgB: "Baixa capitalização patrimonial." },
      engajamento: { label: "BAIXA VIGILÂNCIA", msgA: "O MindCash precisa de mais atenção.", msgB: "Controle passivo detectado." }
    };
    const target = tips[lowest[0]];
    return { name: target.label, desc: alt ? target.msgA : target.msgB };
  }, [metrics]);

  const getStatusDetail = (avg: number) => {
    const alt = new Date().getDate() % 2 === 0;
    if (avg >= 95) return { label: "IMPLACÁVEL", color: "text-cyan-400", bg: "bg-cyan-500/10", desc: alt ? "Sincronia total. Execução matemática impecável." : "Eficiência máxima. Sem pontos cegos." };
    if (avg >= 80) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10", desc: "Controle superior sobre o seu capital." };
    if (avg >= 60) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Zona de segurança e equilíbrio." };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", desc: "Emergência financeira e alto risco." };
  };

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
  const status = getStatusDetail(avgScore);

  const renderRadar = () => {
    const labels = ["CONSISTÊNCIA", "PRECISÃO", "PREVISÃO", "DISCIPLINA", "EVOLUÇÃO", "ENGAJAMENTO"];
    const pts = [metrics.consistencia, metrics.precisao, metrics.previsao, metrics.disciplina, metrics.evolucao, metrics.engajamento];
    const cx = 100, cy = 100, radius = 70;
    const points = pts.map((val, i) => {
      const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      return `${cx + (val / 100) * radius * Math.cos(a)},${cy + (val / 100) * radius * Math.sin(a)}`;
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
          return <text key={i} x={cx + (radius + 20) * Math.cos(a)} y={cy + (radius + 20) * Math.sin(a)} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#71717a" className="uppercase tracking-widest">{label}</text>;
        })}
      </svg>
    );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans uppercase tracking-tighter">
      <div className="max-w-xl mx-auto space-y-8 pt-8">
        
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2 text-yellow-500/80">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* 1. CARD DE CONQUISTAS */}
        <section className="bg-[#050505] p-5 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Trophy className="text-zinc-600" size={14} />
            <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">Conquistas de Performance</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'mur', name: "MURALHA", icon: <Shield size={18}/>, active: metrics.disciplina > 85, color: "text-blue-500" },
              { id: 'sen', name: "SENTINELA", icon: <ShieldCheck size={18}/>, active: metrics.consistencia > 90, color: "text-cyan-500" },
              { id: 'sob', name: "SOBERANO", icon: <Crown size={18}/>, active: avgScore > 90, color: "text-orange-500" },
              { id: 'imp', name: "IMPULSO", icon: <Flame size={18}/>, active: metrics.engajamento > 80, color: "text-red-500" }
            ].map(s => (
              <div key={s.id} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${s.active ? 'border-white/10 bg-white/5' : 'border-transparent opacity-20'}`}>
                <div className={s.active ? s.color : 'text-zinc-700'}>{s.icon}</div>
                <span className="text-[7px] font-black mt-2 text-center tracking-[0.1em] whitespace-nowrap">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. STATUS FINANCEIRO */}
        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className={status.color} size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">DIAGNÓSTICO ATIVO</span>
            </div>
            <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium normal-case max-w-[90%]">{status.desc}</p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        {/* 3. PROJEÇÃO DE SOBREVIVÊNCIA (NOVO CARD) */}
        <section className="bg-[#050505] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hourglass className="text-yellow-500" size={14} />
                <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase italic">Autonomia Estimada</span>
              </div>
              <h3 className="text-4xl font-black italic text-white">
                {burnData.dias} <span className="text-zinc-500 text-xs tracking-widest">DIAS</span>
              </h3>
            </div>
            <div className="text-right max-w-[150px]">
              <p className="text-[10px] text-zinc-400 normal-case leading-tight">
                Com base no seu ritmo <span className={status.color + " font-bold italic"}>{status.label}</span>, seu capital sustenta seu estilo por este período.
              </p>
            </div>
          </div>
          
          <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ease-out rounded-full ${burnData.dias > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${burnData.percentual}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 opacity-40">
            <span className="text-[6px] font-black text-zinc-600 tracking-widest uppercase">Exaustão de Capital</span>
            <span className="text-[6px] font-black text-zinc-600 tracking-widest uppercase">Reserva Atual</span>
          </div>
        </section>

        {/* 4. RADAR E MÉTRICAS */}
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

        {/* 5. CARD DE VULNERABILIDADE */}
        <section className="bg-red-950/20 border border-red-500/20 p-6 rounded-[2.5rem] flex items-center gap-5">
           <div className="bg-red-500/20 p-4 rounded-2xl"><AlertTriangle className="text-red-500" size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-red-500 tracking-[0.2em] mb-1">VULNERABILIDADE: {vulnerability.name}</p>
              <p className="text-[11px] text-zinc-400 normal-case leading-snug">{vulnerability.desc}</p>
           </div>
        </section>

      </div>
    </div>
  );
}
