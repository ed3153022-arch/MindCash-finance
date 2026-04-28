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
  const [selectedCycle, setSelectedCycle] = useState(2); // Começa no ATUAL (Meio)
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [financialHealth, setFinancialHealth] = useState(0); 
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  // --- LÓGICA DE CORES DO STATUS ---
  const getStatusColor = (label: string) => {
    if (label.includes("IMPLACÁVEL")) return "text-cyan-400";
    if (label.includes("DOMINANTE")) return "text-green-400";
    if (label.includes("ESTÁVEL")) return "text-yellow-400";
    if (label.includes("CRÍTICO")) return "text-red-500";
    return "text-zinc-500";
  };

  // --- GERAÇÃO DOS 5 MESES (Timeline) ---
  const cyclesData = useMemo(() => {
    const getMonthName = (offset: number) => {
      const d = new Date();
      d.setMonth(d.getMonth() + offset);
      return d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    };

    return [
      { 
        label: getMonthName(-2), status: "PASSADO", valor: "R$ 1.100", rawValor: 1100, 
        statusFinal: "DOMINANTE", poderTotal: "R$ 2.400", radarMedia: 85,
        dica: "Neste ciclo sua retenção foi exemplar. O segredo foi o baixo gasto em 'Prazer'. Continue replicando esse padrão.",
        corBarra: "bg-yellow-500", corDica: "text-yellow-500"
      },
      { 
        label: getMonthName(-1), status: "PASSADO", valor: "R$ 450", rawValor: 450, 
        statusFinal: "ESTÁVEL", poderTotal: "R$ 900", radarMedia: 62,
        dica: "Houve um vazamento de capital em categorias não identificadas. Detalhe mais seus gastos para não perder Poder.",
        corBarra: "bg-yellow-500", corDica: "text-yellow-500"
      },
      { 
        label: getMonthName(0), status: "ATUAL", valor: "R$ 2.840", rawValor: 2840, 
        statusFinal: "DOMINANTE", poderTotal: "R$ 1.500", radarMedia: 78,
        dica: "Sua operação está saudável. Mantenha a vigilância nos próximos 10 dias para fechar o ciclo como Implacável.",
        corBarra: "bg-yellow-500", corDica: "text-yellow-500"
      },
      { 
        label: getMonthName(1), status: "FUTURO", valor: "R$ 3.200", rawValor: 3200, 
        statusFinal: "PROJEÇÃO", poderTotal: "R$ 1.800", radarMedia: 0,
        dica: "Baseado em seus limites, este mês tem potencial de aporte recorde. Evite gastos extras na primeira quinzena.",
        corBarra: "bg-zinc-800", corDica: "text-zinc-500"
      },
      { 
        label: getMonthName(2), status: "FUTURO", valor: "R$ 1.200", rawValor: 1200, 
        statusFinal: "ALVO", poderTotal: "R$ 2.100", radarMedia: 0,
        dica: "Mês de manutenção preventiva. Prepare o caixa para compromissos fixos recorrentes que surgirão.",
        corBarra: "bg-zinc-800", corDica: "text-zinc-500"
      }
    ];
  }, []);

  // --- CÁLCULO DE ALTURA DAS BARRAS ---
  const maxValor = Math.max(...cyclesData.map(c => c.rawValor));

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        // Aqui viria a lógica de fetch (mantida a do seu código anterior para métricas)
        setMetrics({ consistencia: 80, precisao: 85, previsao: 70, disciplina: 60, engajamento: 90, evolucao: 75 });
        setFinancialHealth(70);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchVereditoData();
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-black"><Loader2 className="text-yellow-400 animate-spin" size={40} /></div>;

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter min-h-screen">
      <div className="max-w-md mx-auto space-y-10 pb-24">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6 p-6">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* STATUS GERAL (RESUMO) */}
        <section className="bg-green-500/10 p-8 rounded-[2.5rem] border border-white/5 mx-4 relative overflow-hidden">
           <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-green-400" size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">DIAGNÓSTICO ATIVO</span>
            </div>
            <h2 className="text-6xl font-black italic mb-4 text-green-400 text-shadow-md">DOMINANTE</h2>
            <p className="text-[11px] text-zinc-400 font-medium normal-case leading-relaxed">Controle absoluto sobre o fluxo. Patrimônio em expansão.</p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        {/* --- CARD DE CICLOS OPERACIONAIS (O AJUSTADO) --- */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 mx-4">
          <div className="flex items-center gap-2 mb-8 px-1">
            <CalendarDays className="text-zinc-600" size={14} />
            <span className="text-[9px] font-black text-zinc-600 tracking-[0.2em] uppercase">Cronograma de Ciclos</span>
          </div>

          {/* Timeline de 5 Barras com Altura Dinâmica */}
          <div className="flex justify-between items-end h-28 mb-10 px-2 border-b border-white/5 pb-4">
            {cyclesData.map((cycle, idx) => {
              // Altura proporcional ao saldo (mínimo 15% para não sumir se for R$ 1)
              const heightPercentage = Math.max(15, (cycle.rawValor / maxValor) * 100);
              
              return (
                <button key={idx} onClick={() => setSelectedCycle(idx)} className="flex flex-col items-center gap-3 outline-none group">
                  <div 
                    className={`w-10 rounded-t-lg transition-all duration-500 ${cycle.corBarra} ${selectedCycle === idx ? 'opacity-100 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'opacity-20 group-hover:opacity-40'}`} 
                    style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                  />
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${selectedCycle === idx ? 'text-white' : 'text-zinc-700'}`}>
                    {cycle.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dados do Ciclo Selecionado */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1 uppercase">Saldo do Período</p>
                <h4 className="text-4xl font-black italic tracking-tighter text-white">{cyclesData[selectedCycle].valor}</h4>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1 uppercase">Veredito</p>
                <span className={`text-sm font-black italic uppercase ${getStatusColor(cyclesData[selectedCycle].statusFinal)}`}>
                  {cyclesData[selectedCycle].statusFinal}
                </span>
              </div>
            </div>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2 uppercase tracking-tighter">Poder Total Alocado</p>
                <p className="text-lg font-black italic text-white">{cyclesData[selectedCycle].poderTotal}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2 uppercase tracking-tighter">Performance Radar</p>
                <p className="text-lg font-black italic text-white">{cyclesData[selectedCycle].radarMedia}%</p>
              </div>
            </div>

            {/* Diagnóstico de Melhoria Dinâmico */}
            <div className={`p-5 rounded-[2rem] border transition-all duration-500 ${selectedCycle >= 3 ? 'bg-zinc-900/30 border-white/5' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={12} className={cyclesData[selectedCycle].corDica} />
                <span className={`text-[8px] font-black tracking-widest ${cyclesData[selectedCycle].corDica}`}>DIAGNÓSTICO DE MELHORIA</span>
              </div>
              <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium">
                {cyclesData[selectedCycle].dica}
              </p>
            </div>
          </div>
        </section>

        {/* RADAR E OUTRAS MÉTRICAS (Simplificado para o exemplo) */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 mx-4">
           <div className="flex items-center gap-2 mb-6">
            <BatteryCharging className="text-zinc-500" size={14} />
            <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-24 gap-3">
             <div className="flex-1 bg-white/5 h-full rounded-xl relative overflow-hidden flex flex-col justify-end">
                <div className="bg-yellow-500 h-[40%] w-full" />
             </div>
             <div className="flex-1 bg-white/5 h-full rounded-xl relative overflow-hidden flex flex-col justify-end">
                <div className="bg-orange-500/40 h-[30%] w-full" />
             </div>
             <div className="flex-1 bg-white/5 h-full rounded-xl relative overflow-hidden flex flex-col justify-end">
                <div className="bg-zinc-800 h-[60%] w-full" />
             </div>
          </div>
        </section>

      </div>
    </div>
  );
}
