"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, Flame, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging, CheckCircle2, CalendarDays
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState(1); // 0: Passado, 1: Atual, 2: Futuro
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [financialHealth, setFinancialHealth] = useState(0); 
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  // --- DADOS ESTRUTURADOS DOS CICLOS (RAIO-X) ---
  const cyclesData = [
    { 
      label: "CICLO ANTERIOR", 
      status: "PASSADO", 
      valor: "R$ 1.240,50", 
      statusFinal: "DOMINANTE",
      poderTotal: "R$ 2.100",
      radarMedia: 78,
      dica: "Você encerrou o ciclo com 12% de 'Ponto Cego'. No próximo mês, detalhe mais suas despesas de lazer para liberar margem estratégica para o Poder.",
      cor: "bg-zinc-800" 
    },
    { 
      label: "CICLO ATUAL", 
      status: "ATUAL", 
      valor: "R$ 850,20", 
      statusFinal: "ESTÁVEL",
      poderTotal: "R$ 1.200",
      radarMedia: 62,
      dica: "Sua disciplina operacional está em declínio. Reduza saídas variáveis nos próximos 7 dias para garantir que o aporte planejado não seja comprometido.",
      cor: "bg-yellow-500" 
    },
    { 
      label: "PRÓXIMO CICLO", 
      status: "FUTURO", 
      valor: "R$ 3.200,00", 
      statusFinal: "ALVO: IMPLACÁVEL",
      poderTotal: "R$ 2.500",
      radarMedia: 90,
      dica: "Seu custo fixo projetado subiu. Ajuste suas metas de Manutenção agora para evitar que a inflação do estilo de vida bloqueie sua evolução de status.",
      cor: "bg-zinc-900 border border-dashed border-zinc-700" 
    }
  ];

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const [transRes, limitesRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        
        const saídas = rawData.filter(t => t.type?.toLowerCase().includes('saida') || t.type?.toLowerCase().includes('withdrawal'));
        const entradas = rawData.filter(t => t.type?.toLowerCase().includes('entrada') || t.type?.toLowerCase().includes('deposit'));
        
        const totalSaidasHistorico = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const totalEntradasHistorico = entradas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const saldoAtual = totalEntradasHistorico - totalSaidasHistorico;

        const catPoder = ["investimentos", "reserva", "aportes", "poupança", "investimento"];
        const catPrazer = ["lazer", "restaurante", "shopping", "viagem", "ifood", "prazer"];
        
        const volPoder = rawData.filter(t => catPoder.includes(t.category?.toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const volPrazer = saídas.filter(t => catPrazer.includes(t.category?.toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const volManutencao = Math.max(0, totalSaidasHistorico - volPoder - volPrazer);

        setPowerAllocation({
          manutencao: Math.round((volManutencao / (totalSaidasHistorico || 1)) * 100),
          prazer: Math.round((volPrazer / (totalSaidasHistorico || 1)) * 100),
          poder: Math.round((volPoder / (totalSaidasHistorico || 1)) * 100)
        });

        const gastoMensal = saídas.slice(-30).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const diasRestantes = gastoMensal > 0 ? Math.floor(saldoAtual / (gastoMensal / 30)) : (saldoAtual > 0 ? 999 : 0);
        setBurnData({ dias: Math.max(0, diasRestantes), percentual: Math.min(100, (diasRestantes / 180) * 100) });

        setMetrics({
          consistencia: 85, precisao: 90, previsao: 70, disciplina: 65, engajamento: 95, evolucao: 80
        });

        setFinancialHealth(75);

      } catch (e) { console.error("Erro:", e); } finally { setLoading(false); }
    }
    fetchVereditoData();
  }, [router]);

  const avgScore = useMemo(() => {
    const hygieneScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
    return (financialHealth * 0.7) + (hygieneScore * 0.3);
  }, [financialHealth, metrics]);

  const status = useMemo(() => {
    if (avgScore >= 85) return { label: "IMPLACÁVEL", color: "text-cyan-400", bg: "bg-cyan-500/10", desc: "Capital blindado. Sua estrutura de retenção é impenetrável." };
    if (avgScore >= 65) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10", desc: "Controle absoluto sobre o fluxo. Patrimônio em expansão." };
    if (avgScore >= 45) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Zona de segurança. O equilíbrio entre gastos e ganhos está mantido." };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", desc: "Vazamento de capital detectado. O sistema requer intervenção imediata." };
  }, [avgScore]);

  const vulnerability = useMemo(() => {
    const tip = { label: "FLUXO IRREGULAR", msg: "Padrão de registro descontínuo. Você precisa registrar suas movimentações com maior frequência para que o sistema consiga estabilizar sua visão estratégica.", isSafe: false };
    return tip;
  }, [metrics]);

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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="text-yellow-400 animate-spin" size={40} /></div>;

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter">
      <div className="max-w-md mx-auto space-y-10 bg-black pb-20">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6 p-4">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* CONQUISTAS */}
        <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5 mx-4">
          <div className="flex items-center gap-2 mb-5 px-1">
            <Trophy className="text-zinc-600" size={12} />
            <span className="text-[9px] font-black text-zinc-600 tracking-[0.2em]">CONQUISTAS DE PERFORMANCE</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'mur', name: "MURALHA", icon: <Shield size={18}/>, active: metrics.disciplina > 80, color: "text-blue-500" },
              { id: 'sen', name: "SENTINELA", icon: <ShieldCheck size={18}/>, active: true, color: "text-cyan-500" },
              { id: 'sob', name: "SOBERANO", icon: <Crown size={18}/>, active: true, color: "text-orange-500" },
              { id: 'imp', name: "IMPULSO", icon: <Flame size={18}/>, active: true, color: "text-red-500" }
            ].map(s => (
              <div key={s.id} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500 ${s.active ? 'border-white/10 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-transparent opacity-10'}`}>
                <div className={s.active ? s.color : 'text-zinc-800'}>{s.icon}</div>
                <span className="text-[8px] font-black mt-2 tracking-wider">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* STATUS */}
        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden mx-4`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className={status.color} size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">DIAGNÓSTICO ATIVO</span>
            </div>
            <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium normal-case leading-relaxed">{status.desc}</p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        {/* DISTRIBUIÇÃO */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden mx-4">
          <div className="flex items-center gap-2 mb-6">
            <BatteryCharging className="text-zinc-500" size={14} />
            <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-32 gap-3 mb-6">
            {[
              { label: "MANUTENÇÃO", val: powerAllocation.manutencao, color: "bg-zinc-800", desc: "CONTAS E ESSENCIAIS" },
              { label: "PRAZER", val: powerAllocation.prazer, color: "bg-orange-500/40", desc: "ESTILO DE VIDA" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500", desc: "DINHEIRO TRABALHANDO" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100px' }}>
                  <div className={`w-full ${b.color} transition-all duration-1000`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[10px] font-black italic">{b.val}%</p>
                <div className="text-center">
                   <p className="text-[7px] text-white font-bold uppercase tracking-tighter">{b.label}</p>
                   <p className="text-[5px] text-zinc-500 font-black uppercase mt-1 leading-tight border-t border-white/10 pt-1">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AUTONOMIA */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden mx-4">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hourglass className="text-yellow-500" size={14} />
                <span className="text-[9px] font-black text-zinc-500 tracking-widest">AUTONOMIA</span>
              </div>
              <h3 className="text-3xl font-black italic">
                {burnData.dias > 365 ? "+365" : burnData.dias} <span className="text-zinc-500 text-sm">DIAS</span>
              </h3>
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${burnData.dias > 60 ? 'bg-cyan-500' : 'bg-red-500'}`} style={{ width: `${burnData.percentual}%` }} />
          </div>
        </section>

        {/* RADAR */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 mx-4">
          <div className="flex justify-center mb-10">{renderRadar()}</div>
          <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key}>
                <p className="text-[7px] text-zinc-500 font-black mb-1">{key.toUpperCase()}</p>
                <p className="text-xl font-black italic">{val}<span className="text-yellow-500 text-[10px]">%</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* ALERTA / VULNERABILIDADE */}
        <section className={`border p-6 rounded-[2.5rem] flex items-center gap-5 mx-4 transition-all duration-500 ${vulnerability.isSafe ? 'bg-cyan-950/20 border-cyan-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
           <div className={`p-4 rounded-2xl ${vulnerability.isSafe ? 'bg-cyan-500/20' : 'bg-red-500/20'}`}>
              {vulnerability.isSafe ? <CheckCircle2 className="text-cyan-400" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
           </div>
           <div>
              <p className={`text-[10px] font-black tracking-[0.2em] mb-1 ${vulnerability.isSafe ? 'text-cyan-400' : 'text-red-500'}`}>
                {vulnerability.label}
              </p>
              <p className="text-[11px] text-zinc-400 normal-case leading-tight">{vulnerability.msg}</p>
           </div>
        </section>

        {/* CARD: CICLOS OPERACIONAIS (RAIO-X MINDCASH) */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 mx-4 mb-10">
          <div className="flex items-center gap-2 mb-8 px-1">
            <CalendarDays className="text-zinc-600" size={14} />
            <span className="text-[9px] font-black text-zinc-600 tracking-[0.2em] uppercase">Cronograma de Ciclos</span>
          </div>

          {/* Seletor de Barras */}
          <div className="flex justify-between items-end h-20 mb-10 px-6">
            {cyclesData.map((cycle, idx) => (
              <button key={idx} onClick={() => setSelectedCycle(idx)} className="flex flex-col items-center gap-3 outline-none">
                <div className={`w-12 rounded-lg transition-all duration-500 ${selectedCycle === idx ? 'h-16 bg-yellow-500 opacity-100 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'h-8 bg-zinc-800 opacity-30'}`} />
                <span className={`text-[7px] font-black ${selectedCycle === idx ? 'text-white' : 'text-zinc-700'}`}>{cycle.status}</span>
              </button>
            ))}
          </div>

          {/* Display do Ciclo (Raio-X) */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1 uppercase">Saldo do Período</p>
                <h4 className="text-4xl font-black italic tracking-tighter text-white">{cyclesData[selectedCycle].valor}</h4>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1 uppercase">Veredito</p>
                <span className="text-xs font-black text-yellow-500 italic uppercase">{cyclesData[selectedCycle].statusFinal}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2 uppercase tracking-tighter">Poder Total Alocado</p>
                <p className="text-lg font-black italic text-white">{cyclesData[selectedCycle].poderTotal}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2 uppercase tracking-tighter">Média do Radar</p>
                <p className="text-lg font-black italic text-white">{cyclesData[selectedCycle].radarMedia}%</p>
              </div>
            </div>

            <div className={`p-5 rounded-[2rem] border ${selectedCycle === 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={12} className={selectedCycle === 0 ? 'text-blue-400' : 'text-yellow-500'} />
                <span className={`text-[8px] font-black tracking-widest ${selectedCycle === 0 ? 'text-blue-400' : 'text-yellow-500'}`}>DIAGNÓSTICO DE MELHORIA</span>
              </div>
              <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium">
                {cyclesData[selectedCycle].dica}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
