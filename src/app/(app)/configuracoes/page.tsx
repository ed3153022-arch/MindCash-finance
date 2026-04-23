"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
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

        const saídas = rawData.filter(t => t.type === 'withdrawal');
        const saldoAtual = rawData.reduce((acc, t) => t.type === 'deposit' ? acc + Number(t.amount) : acc - Math.abs(Number(t.amount)), 0);
        
        const totalSaidas = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 1;
        const volPoder = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volPrazer = saídas.filter(t => ["Lazer", "Restaurante", "Shopping", "Viagem", "iFood"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volManutencao = Math.max(0, totalSaidas - volPoder - volPrazer);

        setPowerAllocation({
          manutencao: Math.round((volManutencao / totalSaidas) * 100),
          prazer: Math.round((volPrazer / totalSaidas) * 100),
          poder: Math.round((volPoder / totalSaidas) * 100)
        });

        const ultimos30Dias = saídas.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 30);
        const gastoDiarioMedio = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) / 30;
        const diasRestantes = gastoDiarioMedio > 0 ? Math.floor(saldoAtual / gastoDiarioMedio) : 0;
        const percentualMes = Math.min(100, (diasRestantes / 30) * 100);

        setBurnData({ dias: Math.max(0, diasRestantes), percentual: Math.max(0, percentualMes) });

        const dias7D = new Set(rawData.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7).map(t => new Date(t.created_at).toDateString())).size;
        const consistencia = (dias7D / 7) * 100;
        const precisao = (rawData.filter(t => t.category && !["Outros", "Outra", "Nenhum"].includes(t.category)).length / (rawData.length || 1)) * 100;
        const categoriasGastas = new Set(saídas.map(t => t.category)).size;
        const previsao = categoriasGastas > 0 ? (limites.length / categoriasGastas) * 100 : 0;

        let desvioTotal = 0;
        limites.forEach(lim => {
          const gasto = saídas.filter(t => t.category === lim.category).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
          if (gasto > lim.limit_amount) desvioTotal += (gasto - lim.limit_amount) / lim.limit_amount;
        });
        const disciplina = Math.max(0, 100 - (desvioTotal * 50));

        const volInvestido = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const receita = rawData.filter(t => t.type !== 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0);
        const evolucao = receita > 0 ? (volInvestido / (receita * 0.25)) * 100 : 0;

        const dataInicio = new Date(rawData[rawData.length - 1]?.created_at || agora);
        const diasUso = Math.max(1, Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 3600 * 24)));
        const engajamento = (rawData.length / (diasUso * 3)) * 100;

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

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
  const status = useMemo(() => {
    const alt = new Date().getDate() % 2 === 0;
    if (avgScore >= 95) return { label: "IMPLACÁVEL", color: "text-cyan-400", bg: "bg-cyan-500/10", desc: alt ? "Sincronia total. Seu capital está blindado por execução impecável." : "Eficiência máxima. Não existem pontos cegos no seu fluxo." };
    if (avgScore >= 80) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10", desc: alt ? "Controle superior. Você dita as regras do seu dinheiro." : "Estratégia sólida sobrepondo as variações." };
    if (avgScore >= 60) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Zona de segurança. O sistema está equilibrado." };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", desc: "Risco detectado. A ausência de regras está destruindo sua previsibilidade." };
  }, [avgScore]);

  const vulnerability = useMemo(() => {
    const lowest = Object.entries(metrics).reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    const tips: Record<string, { label: string, msg: string }> = {
      consistencia: { label: "FLUXO IRREGULAR", msg: "Frequência de registro caiu. O sistema perde precisão sem dados diários." },
      precisao: { label: "DADOS CEGOS", msg: "Muitos gastos sem categoria. Você está perdendo o rastro real do seu dinheiro." },
      previsao: { label: "FALTA DE ALVO", msg: "Você está gastando em áreas não planejadas. Defina limites." },
      disciplina: { label: "LIMITE VIOLADO", msg: "Teto de gastos ultrapassado. Recue despesas para evitar o déficit." },
      evolucao: { label: "ESTAGNAÇÃO", msg: "Aportes abaixo da meta. Seu patrimônio está parado." },
      engajamento: { label: "BAIXA VIGILÂNCIA", msg: "Interação insuficiente. O sistema precisa de atenção para te guiar." }
    };
    return tips[lowest[0]] || { label: "ANÁLISE", msg: "Processando métricas..." };
  }, [metrics]);

  const renderRadar = () => {
    const labels = ["CONS", "PREC", "PREV", "DISC", "EVOL", "ENGA"];
    const pts = [metrics.consistencia, metrics.precisao, metrics.previsao, metrics.disciplina, metrics.evolucao, metrics.engajamento];
    const cx = 100, cy = 100, radius = 70;
    const points = pts.map((val, i) => {
      const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      return `${cx + (val / 100) * radius * Math.cos(a)},${cy + (val / 100) * radius * Math.sin(a)}`;
    }).join(" ");

    return (
      <svg viewBox="0 0 200 200" className="w-full h-64 overflow-visible">
        {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
          <polygon key={p} points={Array.from({length: 6}).map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            return `${cx + p * radius * Math.cos(a)},${cy + p * radius * Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
        ))}
        <polygon points={points} fill="rgba(250, 204, 21, 0.2)" stroke="#facc15" strokeWidth="2" />
        {labels.map((label, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return <text key={i} x={cx + (radius + 15) * Math.cos(a)} y={cy + (radius + 15) * Math.sin(a)} textAnchor="middle" fontSize="8" fontWeight="black" fill="#52525b" className="tracking-tighter">{label}</text>;
        })}
      </svg>
    );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" size={32} /></div>;

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter">
      <div className="space-y-6">
        
        {/* HEADER COMPACTO */}
        <header className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <h1 className="text-5xl font-black italic leading-none">VEREDITO</h1>
            <p className="text-[9px] text-zinc-500 font-bold tracking-[0.3em] mt-1">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* 1. SELOS - MAIS COMPACTO */}
        <section className="bg-zinc-950 p-4 rounded-3xl border border-white/5">
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'mur', name: "MURALHA", icon: <Shield size={16}/>, active: metrics.disciplina > 85, color: "text-blue-500" },
              { id: 'sen', name: "SENTINELA", icon: <ShieldCheck size={16}/>, active: metrics.consistencia > 90, color: "text-cyan-500" },
              { id: 'sob', name: "SOBERANO", icon: <Crown size={16}/>, active: avgScore > 90, color: "text-orange-500" },
              { id: 'imp', name: "IMPULSO", icon: <Flame size={16}/>, active: metrics.engajamento > 80, color: "text-red-500" }
            ].map(s => (
              <div key={s.id} className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${s.active ? 'border-white/10 bg-white/5' : 'border-transparent opacity-20'}`}>
                <div className={s.active ? s.color : 'text-zinc-800'}>{s.icon}</div>
                <span className="text-[7px] font-black mt-1 tracking-widest">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. STATUS PRINCIPAL */}
        <section className={`p-6 rounded-3xl border border-white/5 ${status.bg} relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className={`text-5xl font-black italic mb-2 ${status.color}`}>{status.label}</h2>
            <p className="text-[10px] text-zinc-400 font-medium normal-case leading-tight">{status.desc}</p>
          </div>
          <BrainCircuit className="absolute -right-6 -bottom-6 text-white/5" size={100} />
        </section>

        {/* 3. ALOCAÇÃO DE PODER */}
        <section className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BatteryCharging className="text-zinc-500" size={12} />
            <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-24 gap-3">
            {[
              { label: "FIXO", val: powerAllocation.manutencao, color: "bg-zinc-800" },
              { label: "LAZER", val: powerAllocation.prazer, color: "bg-orange-500/40" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-lg overflow-hidden flex flex-col justify-end" style={{ height: '70px' }}>
                  <div className={`w-full ${b.color} transition-all duration-1000`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[9px] font-black italic leading-none">{b.val}%</p>
                <p className="text-[6px] text-zinc-500 font-bold uppercase">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. AUTONOMIA */}
        <section className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-[8px] font-black text-zinc-500 tracking-widest">AUTONOMIA</span>
              <h3 className="text-3xl font-black italic leading-none mt-1">
                {burnData.dias} <span className="text-zinc-500 text-xs tracking-tighter">DIAS</span>
              </h3>
            </div>
            <Hourglass className="text-yellow-500 opacity-30" size={20} />
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${burnData.dias > 15 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${burnData.percentual}%` }} />
          </div>
        </section>

        {/* 5. RADAR */}
        <section className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
           <div className="flex justify-center">{renderRadar()}</div>
           <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-2">
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key}>
                <p className="text-[6px] text-zinc-500 font-black mb-0.5">{key.toUpperCase()}</p>
                <p className="text-lg font-black italic leading-none">{val}<span className="text-yellow-500 text-[8px]">%</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. VULNERABILIDADE */}
        <section className="bg-red-950/10 border border-red-500/20 p-5 rounded-3xl flex items-center gap-4">
           <AlertTriangle className="text-red-500 shrink-0" size={20} />
           <div>
              <p className="text-[9px] font-black text-red-500 tracking-widest mb-0.5">{vulnerability.label}</p>
              <p className="text-[10px] text-zinc-400 normal-case leading-tight">{vulnerability.msg}</p>
           </div>
        </section>

      </div>
    </div>
  );
}
