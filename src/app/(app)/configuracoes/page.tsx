"use client";

import React, { useState, useMemo } from "react";
import { 
  Zap, BrainCircuit, CalendarDays, Info
} from "lucide-react";

export default function VereditoPage() {
  const [selectedCycle, setSelectedCycle] = useState(2); // Começa em ABR (Atual)

  // --- DADOS DINÂMICOS DOS CICLOS ---
  const cyclesData = useMemo(() => {
    return [
      { 
        label: "FEV", status: "PASSADO", valor: "R$ 1.100", rawValor: 1100, 
        statusFinal: "DOMINANTE", poderTotal: "R$ 2.400", radarMedia: 85,
        dica: "Sua retenção em Fevereiro foi exemplar. O segredo foi o baixo gasto em 'Prazer'. Continue replicando esse padrão.",
        corBarra: "bg-yellow-500", corDica: "text-yellow-500"
      },
      { 
        label: "MAR", status: "PASSADO", valor: "R$ 4.250", rawValor: 4250, 
        statusFinal: "ESTÁVEL", poderTotal: "R$ 900", radarMedia: 62,
        dica: "Houve um vazamento de capital em categorias não identificadas. Detalhe mais seus gastos para não perder Poder.",
        corBarra: "bg-yellow-500", corDica: "text-yellow-500"
      },
      { 
        label: "ABR", status: "ATUAL", valor: "R$ 2.840", rawValor: 2840, 
        statusFinal: "DOMINANTE", poderTotal: "R$ 1.500", radarMedia: 78,
        dica: "Sua operação está saudável. Mantenha a vigilância nos próximos 10 dias para fechar o ciclo como Implacável.",
        corBarra: "bg-yellow-500", corDica: "text-yellow-500"
      },
      { 
        label: "MAI", status: "FUTURO", valor: "R$ 3.200", rawValor: 3200, 
        statusFinal: "PROJEÇÃO", poderTotal: "R$ 1.800", radarMedia: 70,
        dica: "Baseado em seus limites, este mês tem potencial de aporte recorde. Evite gastos extras na primeira quinzena.",
        corBarra: "bg-zinc-800", corDica: "text-zinc-500"
      },
      { 
        label: "JUN", status: "FUTURO", valor: "R$ 1.200", rawValor: 1200, 
        statusFinal: "ALVO", poderTotal: "R$ 2.100", radarMedia: 65,
        dica: "Mês de manutenção preventiva. Prepare o caixa para compromissos fixos recorrentes que surgirão.",
        corBarra: "bg-zinc-800", corDica: "text-zinc-500"
      }
    ];
  }, []);

  // AJUSTE 1: Cálculo de altura proporcional ao saldo total
  const maxValor = Math.max(...cyclesData.map(c => c.rawValor));

  const getStatusColor = (label: string) => {
    if (label.includes("IMPLACÁVEL")) return "text-cyan-400";
    if (label.includes("DOMINANTE")) return "text-green-400";
    if (label.includes("ESTÁVEL")) return "text-yellow-400";
    if (label.includes("PROJEÇÃO") || label.includes("ALVO")) return "text-zinc-500";
    return "text-red-500";
  };

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* CARD: CRONOGRAMA DE CICLOS */}
        <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-2 mb-8 text-zinc-600">
            <CalendarDays size={14} />
            <span className="text-[9px] font-black tracking-[0.2em] uppercase">Cronograma de Ciclos</span>
          </div>

          {/* AJUSTE 1: BARRAS DINÂMICAS POR SALDO */}
          <div className="flex justify-between items-end h-24 mb-10 px-2 border-b border-white/5 pb-4">
            {cyclesData.map((cycle, idx) => {
              const heightPercentage = (cycle.rawValor / maxValor) * 100;
              return (
                <button key={idx} onClick={() => setSelectedCycle(idx)} className="flex flex-col items-center gap-3 outline-none group">
                  <div 
                    className={`w-10 rounded-t-sm transition-all duration-500 ${cycle.corBarra} ${selectedCycle === idx ? 'opacity-100 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'opacity-20'}`} 
                    style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                  />
                  <span className={`text-[8px] font-black ${selectedCycle === idx ? 'text-white' : 'text-zinc-700'}`}>
                    {cycle.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* DADOS DO CICLO SELECIONADO */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1">SALDO DO PERÍODO</p>
                <h4 className="text-4xl font-black italic tracking-tighter text-white">{cyclesData[selectedCycle].valor}</h4>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1">VEREDITO</p>
                <span className={`text-[10px] font-black italic uppercase ${getStatusColor(cyclesData[selectedCycle].statusFinal)}`}>
                  {cyclesData[selectedCycle].statusFinal}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* AJUSTE 2: DETALHE DO PODER TOTAL ALOCADO */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
                <p className="text-[7px] font-black text-zinc-500 mb-2 tracking-tighter uppercase flex items-center gap-1">
                  Poder Total Alocado <Info size={8} />
                </p>
                <p className="text-lg font-black italic text-white">{cyclesData[selectedCycle].poderTotal}</p>
                <p className="text-[5.5px] text-zinc-600 font-bold leading-tight mt-1 group-hover:text-zinc-400 transition-colors uppercase">
                  Capital blindado convertido em patrimônio real.
                </p>
              </div>

              {/* AJUSTE 3: PERFORMANCE RADAR COM AVISO DE PRECISÃO */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2 tracking-tighter uppercase">Performance Radar</p>
                <p className="text-lg font-black italic text-white">
                  {cyclesData[selectedCycle].radarMedia}%
                </p>
                {cyclesData[selectedCycle].status === "FUTURO" && (
                  <p className="text-[5.5px] text-orange-500/70 font-bold leading-tight mt-1 uppercase italic">
                    *Estimativa volátil. Sujeita a variações de mercado e disciplina.
                  </p>
                )}
                {cyclesData[selectedCycle].status !== "FUTURO" && (
                  <p className="text-[5.5px] text-zinc-600 font-bold leading-tight mt-1 uppercase">
                    Eficiência técnica baseada em dados reais.
                  </p>
                )}
              </div>
            </div>

            {/* DIAGNÓSTICO DE MELHORIA */}
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

      </div>
    </div>
  );
}
