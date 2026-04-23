"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, Flame, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [financialHealth, setFinancialHealth] = useState(0); // Score de Saúde (70%)
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

        // 1. DADOS FINANCEIROS BRUTOS
        const saídas = rawData.filter(t => t.type === 'withdrawal');
        const entradas = rawData.filter(t => t.type === 'deposit');
        const saldoAtual = rawData.reduce((acc, t) => t.type === 'deposit' ? acc + Number(t.amount) : acc - Math.abs(Number(t.amount)), 0);
        
        const totalSaidas = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 0;
        const totalEntradas = entradas.reduce((acc, t) => acc + Number(t.amount), 0) || 0;

        // 2. ALOCAÇÃO DE PODER
        const volPoder = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volPrazer = saídas.filter(t => ["Lazer", "Restaurante", "Shopping", "Viagem", "iFood"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const divisorSaidas = totalSaidas || 1;
        const volManutencao = Math.max(0, totalSaidas - volPoder - volPrazer);

        setPowerAllocation({
          manutencao: Math.round((volManutencao / divisorSaidas) * 100),
          prazer: Math.round((volPrazer / divisorSaidas) * 100),
          poder: Math.round((volPoder / divisorSaidas) * 100)
        });

        // 3. AUTONOMIA (BURN RATE)
        const ultimos30Dias = saídas.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 30);
        const gastoDiarioMedio = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) / 30;
        // Se gasto é 0, autonomia é alta (999 dias para lógica de cálculo)
        const diasRestantes = gastoDiarioMedio > 0 ? Math.floor(saldoAtual / gastoDiarioMedio) : (saldoAtual > 0 ? 999 : 0);
        const percentualAutonomia = Math.min(100, (diasRestantes / 180) * 100); 
        setBurnData({ dias: diasRestantes, percentual: percentualAutonomia });

        // 4. CÁLCULO DE SAÚDE FINANCEIRA (PESO 70%)
        // Baseado em: Retenção (Saving Rate) e Autonomia
        const taxaRetencao = totalEntradas > 0 ? Math.max(0, (totalEntradas - totalSaidas) / totalEntradas) * 100 : (saldoAtual > 0 ? 100 : 0);
        const scoreAutonomia = Math.min(100, (diasRestantes / 120) * 100); // 120 dias para nota máxima de autonomia
        setFinancialHealth((taxaRetencao * 0.6) + (scoreAutonomia * 0.4));

        // 5. MÉTRICAS DE USO (PESO 30%)
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
        const evolucao = taxaRetencao; // Evolução agora é atrelada à retenção real

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

  // CÁLCULO FINAL 70/30
  const avgScore = useMemo(() => {
    const hygieneScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
    return (financialHealth * 0.7) + (hygieneScore * 0.3);
  }, [financialHealth, metrics]);

  const status = useMemo(() => {
    const alt = new Date().getDate() % 2 === 0;
    if (avgScore >= 90) return { label: "IMPLACÁVEL", color: "text-cyan-400", bg: "bg-cyan-500/10", desc: alt ? "Sincronia total. Seu capital está blindado por execução impecável." : "Eficiência máxima. Não existem pontos cegos no seu fluxo." };
    if (avgScore >= 70) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10", desc: alt ? "Controle superior. Você dita as regras do seu dinheiro." : "Estratégia sólida sobrepondo as variações." };
    if (avgScore >= 45) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Zona de segurança. O sistema está equilibrado." };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", desc: "Risco detectado. A ausência de regras está destruindo sua previsibilidade." };
  }, [avgScore]);

  const vulnerability = useMemo(() => {
    const lowest = Object.entries(metrics).reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    const tips: Record<string, { label: string, msg: string }> = {
      consistencia: { label: "FLUXO IRREGULAR", msg: "Frequência de registro caiu. O sistema perde precisão sem dados diários." },
      precisao: { label: "DADOS CEGOS", msg: "Muitos gastos sem categoria. Você está perdendo o rastro real do seu dinheiro." },
      previsao: { label: "FALTA DE ALVO", msg: "Você está gastando em áreas não planejadas. Defina limites." },
      disciplina: { label: "LIMITE VIOLADO", msg: "Teto de gastos ultrapassado. Recue despesas para evitar o déficit." },
      evolucao: { label: "ESTAGNAÇÃO", msg: "A retenção de capital está abaixo do potencial. Aumente sua margem." },
      engajamento: { label: "BAIXA VIGILÂNCIA", msg: "Interação insuficiente. O sistema precisa de atenção para te guiar." }
    };
    return tips[lowest[0]] || tips.consistencia;
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
      <div className="space-y-10 bg-black">
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-2 mb-5 px-1">
            <Trophy className="text-zinc-600" size={12} />
            <span className="text-[9px] font-black text-zinc-600 tracking-[0.2em]">CONQUISTAS DE PERFORMANCE</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'mur', name: "MURALHA", icon: <Shield size={18}/>, active: metrics.disciplina > 85, color: "text-blue-500" },
              { id: 'sen', name: "SENTINELA", icon: <ShieldCheck size={18}/>, active: metrics.consistencia > 90, color: "text-cyan-500" },
              { id: 'sob', name: "SOBERANO", icon: <Crown size={18}/>, active: avgScore > 90, color: "text-orange-500" },
              { id: 'imp', name: "IMPULSO", icon: <Flame size={18}/>, active: metrics.engajamento > 80, color: "text-red-500" }
            ].map(s => (
              <div key={s.id} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500 ${s.active ? 'border-white/10 bg-white/5 opacity-100' : 'border-transparent opacity-10'}`}>
                <div className={s.active ? s.color : 'text-zinc-800'}>{s.icon}</div>
                <span className="text-[8px] font-black mt-2 tracking-wider">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
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

        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <BatteryCharging className="text-zinc-500" size={14} />
            <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-32 gap-3 mb-4">
            {[
              { label: "MANUTENÇÃO", val: powerAllocation.manutencao, color: "bg-zinc-800" },
              { label: "PRAZER", val: powerAllocation.prazer, color: "bg-orange-500/40" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full bg-white/5 rounded-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100px' }}>
                  <div className={`w-full ${b.color} transition-all duration-1000`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[10px] font-black italic leading-none">{b.val}%</p>
                <p className="text-[6px] text-zinc-500 font-bold uppercase tracking-tighter">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Hourglass className="text-yellow-500" size={14} />
                <span className="text-[9px] font-black text-zinc-500 tracking-widest">AUTONOMIA ESTIMADA</span>
              </div>
              <h3 className="text-3xl font-black italic">
                {burnData.dias > 365 ? "+365" : burnData.dias} <span className="text-zinc-500 text-sm">DIAS</span>
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-zinc-400 normal-case leading-tight max-w-[180px]">
                No ritmo <span className={status.color + " font-bold"}>{status.label}</span>, seu capital sustenta seu estilo de vida.
              </p>
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className={`h-full transition-all duration-1000 ease-out rounded-full ${burnData.dias > 30 ? 'bg-cyan-500' : 'bg-red-500'}`} style={{ width: `${burnData.percentual}%` }} />
          </div>
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

        <section className="bg-red-950/20 border border-red-500/20 p-6 rounded-[2.5rem] flex items-center gap-5">
           <div className="bg-red-500/20 p-4 rounded-2xl"><AlertTriangle className="text-red-500" size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-red-500 tracking-[0.2em] mb-1">VULNERABILIDADE: {vulnerability.label}</p>
              <p className="text-[11px] text-zinc-400 normal-case leading-snug">{vulnerability.msg}</p>
           </div>
        </section>
      </div>
    </div>
  );
}
