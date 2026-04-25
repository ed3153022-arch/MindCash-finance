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
  const [financialHealth, setFinancialHealth] = useState(0); 
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
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        const agora = new Date();

        // --- 1. FILTRAGEM MULTILÍNGUE ---
        const saídas = rawData.filter(t => 
          t.type?.toLowerCase() === 'withdrawal' || t.type?.toLowerCase() === 'saida' || t.type?.toLowerCase() === 'saída'
        );
        const entradas = rawData.filter(t => 
          t.type?.toLowerCase() === 'deposit' || t.type?.toLowerCase() === 'entrada'
        );
        
        const totalSaidasHistorico = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const totalEntradasHistorico = entradas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const saldoAtual = totalEntradasHistorico - totalSaidasHistorico;

        // --- 2. ALOCAÇÃO DE PODER ---
        const catPoder = ["investimentos", "reserva", "aportes", "poupança", "investimento"];
        const catPrazer = ["lazer", "restaurante", "shopping", "viagem", "ifood", "prazer"];
        
        const volPoder = rawData.filter(t => catPoder.includes(t.category?.toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const volPrazer = saídas.filter(t => catPrazer.includes(t.category?.toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        
        const divisorSaidas = totalSaidasHistorico || 1;
        const volManutencao = Math.max(0, totalSaidasHistorico - volPoder - volPrazer);

        setPowerAllocation({
          manutencao: Math.round((volManutencao / divisorSaidas) * 100),
          prazer: Math.round((volPrazer / divisorSaidas) * 100),
          poder: Math.round((volPoder / divisorSaidas) * 100)
        });

        // --- 3. AUTONOMIA ---
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(agora.getDate() - 30);
        const ultimos30Dias = saídas.filter(t => new Date(t.created_at) >= trintaDiasAtras);
        const gastoMensal = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const gastoDiario = gastoMensal / 30;

        const diasRestantes = gastoDiario > 0 ? Math.floor(saldoAtual / gastoDiario) : (saldoAtual > 0 ? 999 : 0);
        setBurnData({ dias: Math.max(0, diasRestantes), percentual: Math.min(100, (diasRestantes / 180) * 100) });

        // --- 4. SAÚDE FINANCEIRA ---
        const taxaRetencao = totalEntradasHistorico > 0 
          ? Math.max(0, ((totalEntradasHistorico - totalSaidasHistorico) / totalEntradasHistorico) * 100)
          : (saldoAtual > 0 ? 100 : 0);
        const scoreAutonomia = Math.min(100, (diasRestantes / 120) * 100);
        setFinancialHealth((taxaRetencao * 0.6) + (scoreAutonomia * 0.4));

        // --- 5. MÉTRICAS RADAR DINÂMICAS ---
        const registrosUnicos = new Set(rawData.map(t => new Date(t.created_at).toDateString())).size;
        
        // CÁLCULO DINÂMICO DA PREVISÃO:
        // Se o usuário tem limites e não os ultrapassou, nota 100. Se não tem limites, usa a taxa de retenção como base.
        let previsaoScore = 0;
        if (limites.length > 0) {
          const categoriasComExcesso = limites.filter(lim => {
            const gastoCat = saídas.filter(t => t.category === lim.category).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
            return gastoCat > lim.limit_amount;
          }).length;
          previsaoScore = Math.max(0, 100 - (categoriasComExcesso * 20));
        } else {
          previsaoScore = Math.min(100, Math.round(taxaRetencao * 0.8)); // Penaliza levemente por não ter metas definidas
        }

        setMetrics({
          consistencia: Math.min(100, Math.round((registrosUnicos / 15) * 100)),
          precisao: Math.min(100, Math.round((rawData.filter(t => t.category && t.category !== "Outros").length / (rawData.length || 1)) * 100)),
          previsao: previsaoScore, 
          disciplina: Math.min(100, Math.max(0, Math.round(taxaRetencao))),
          evolucao: Math.min(100, Math.max(0, Math.round(taxaRetencao))),
          engajamento: Math.min(100, Math.round((rawData.length / 10) * 100))
        });

      } catch (e) { console.error("Erro no processamento:", e); } finally { setLoading(false); }
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
    const lowest = Object.entries(metrics).reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    const tips: Record<string, { label: string, msg: string }> = {
      consistencia: { label: "FLUXO IRREGULAR", msg: "Registre dados com mais frequência para estabilizar o diagnóstico." },
      precisao: { label: "PONTO CEGO", msg: "Categorize suas transações para o sistema entender seus hábitos." },
      previsao: { label: "FALTA DE ALVO", msg: "Defina limites de gastos para aumentar sua previsibilidade." },
      disciplina: { label: "CONSUMO ELEVADO", msg: "Sua retenção caiu. Tente reduzir gastos variáveis esta semana." },
      evolucao: { label: "ESTAGNAÇÃO", msg: "Aumente seu aporte em categorias de PODER para evoluir o status." },
      engajamento: { label: "BAIXA VIGILÂNCIA", msg: "O sistema precisa de mais interações para refinar os cálculos." }
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
      <div className="max-w-md mx-auto space-y-10 bg-black pb-20">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6 p-4">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* STATUS DA CONTA */}
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

        {/* DISTRIBUIÇÃO DE PODER COM LEGENDAS AJUSTADAS */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden mx-4">
          <div className="flex items-center gap-2 mb-6">
            <BatteryCharging className="text-zinc-500" size={14} />
            <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-32 gap-3 mb-6">
            {[
              { label: "MANUTENÇÃO", val: powerAllocation.manutencao, color: "bg-zinc-800", desc: "Custo de Vida" },
              { label: "PRAZER", val: powerAllocation.prazer, color: "bg-orange-500/40", desc: "Dopamina/Lazer" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500", desc: "Investimentos" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100px' }}>
                  <div className={`w-full ${b.color} transition-all duration-1000`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[10px] font-black italic">{b.val}%</p>
                <div className="text-center">
                   <p className="text-[7px] text-white font-bold uppercase">{b.label}</p>
                   <p className="text-[5px] text-zinc-500 font-medium uppercase tracking-widest mt-0.5">{b.desc}</p>
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

        {/* RADAR COM MÉTRICAS DINÂMICAS */}
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

        {/* VULNERABILIDADE */}
        <section className="bg-red-950/20 border border-red-500/20 p-6 rounded-[2.5rem] flex items-center gap-5 mx-4">
           <div className="bg-red-500/20 p-4 rounded-2xl"><AlertTriangle className="text-red-500" size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-red-500 tracking-[0.2em] mb-1">ALERTA: {vulnerability.label}</p>
              <p className="text-[11px] text-zinc-400 normal-case">{vulnerability.msg}</p>
           </div>
        </section>
      </div>
    </div>
  );
}
