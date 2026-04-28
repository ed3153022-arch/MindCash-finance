"use client";

import React, { useState, useMemo } from "react";
import { BrainCircuit, CalendarDays, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Adicione framer-motion

export default function CardCiclosOperacionais() {
  const [selectedCycle, setSelectedCycle] = useState(2);

  // 1. MOTOR DE INTELIGÊNCIA DE MENSAGENS (A Real do Veredito)
  const getDinamicaMensagem = (saldo: number, poder: number, tipo: string) => {
    const taxaPoder = (poder / saldo) * 100;

    if (tipo === "FUTURO") {
      return {
        dica: "Projeção baseada nos teus limites. O futuro é cinza porque ainda não foi conquistado. Mantenha a disciplina para converter esses números em realidade.",
        cor: "text-zinc-500"
      };
    }

    if (taxaPoder <= 10) return {
      dica: "VEREDITO CRÍTICO: Você está trabalhando para pagar boletos. Apenas " + taxaPoder.toFixed(0) + "% do seu esforço virou patrimônio. Ajuste a rota ou o tempo vai passar e você continuará no mesmo lugar.",
      cor: "text-red-500"
    };

    if (taxaPoder > 10 && taxaPoder <= 25) return {
      dica: "ESTÁVEL, MAS LENTO: Sua zona de conforto está drenando seu potencial. Você tem oxigênio, mas não tem tração. Onde está o vazamento desse mês?",
      cor: "text-yellow-500"
    };

    if (taxaPoder > 25) return {
      dica: "DOMINANTE: O capital está curvado à sua vontade. Com " + taxaPoder.toFixed(0) + "% de retenção, você não apenas sobreviveu, você avançou. Replique o método.",
      cor: "text-green-400"
    };

    return { dica: "Dados insuficientes para julgamento. Alimente o sistema.", cor: "text-zinc-500" };
  };

  const cyclesData = useMemo(() => [
    { label: "FEV", tipo: "PASSADO", saldo: 1100, status: "ESTÁVEL", poder: 150 },
    { label: "MAR", tipo: "PASSADO", saldo: 4250, status: "DOMINANTE", poder: 1850 },
    { label: "ABR", tipo: "ATUAL", saldo: 2840, status: "DOMINANTE", poder: 950 },
    { label: "MAI", tipo: "FUTURO", saldo: 3200, status: "PROJEÇÃO", poder: 1800 },
    { label: "JUN", tipo: "FUTURO", saldo: 1200, status: "ALVO", poder: 2100 }
  ], []);

  const maxSaldo = useMemo(() => Math.max(...cyclesData.map(c => c.saldo), 1), [cyclesData]);
  const activeCycle = cyclesData[selectedCycle];
  const vereditoInteligente = getDinamicaMensagem(activeCycle.saldo, activeCycle.poder, activeCycle.tipo);

  return (
    <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5 mx-4 my-10 overflow-hidden text-white uppercase tracking-tighter">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-8 text-zinc-600">
        <CalendarDays size={14} />
        <span className="text-[9px] font-black tracking-[0.2em]">Cronograma de Ciclos</span>
      </div>

      {/* BARRAS DINÂMICAS */}
      <div className="flex justify-between items-end h-32 mb-10 px-2 border-b border-white/5 pb-4">
        {cyclesData.map((cycle, idx) => {
          const barHeight = Math.max(15, (cycle.saldo / maxSaldo) * 100);
          return (
            <button key={idx} onClick={() => setSelectedCycle(idx)} className="flex flex-col items-center gap-3 outline-none flex-1 group">
              <div className="relative w-full flex justify-center items-end h-24">
                <motion.div 
                  initial={false}
                  animate={{ height: `${barHeight}%` }}
                  className={`w-8 rounded-t-sm transition-all duration-300
                    ${cycle.tipo === "FUTURO" ? "bg-zinc-800" : "bg-yellow-500"}
                    ${selectedCycle === idx ? "opacity-100 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-x-110" : "opacity-20"}
                  `}
                />
              </div>
              <span className={`text-[8px] font-black ${selectedCycle === idx ? "text-white" : "text-zinc-700"}`}>{cycle.label}</span>
            </button>
          );
        })}
      </div>

      {/* ÁREA COM TRANSIÇÃO SLIDE DOWN + FADE IN */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCycle} // Força o re-render da animação ao trocar de ciclo
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* SALDO E STATUS */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1">Saldo do Período</p>
              <h4 className="text-4xl font-black italic tracking-tighter leading-none">
                R$ {activeCycle.saldo.toLocaleString('pt-BR')}
              </h4>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1">Veredito</p>
              <span className={`text-[10px] font-black italic uppercase leading-none ${vereditoInteligente.cor}`}>
                {activeCycle.status}
              </span>
            </div>
          </div>

          {/* MÉTRICAS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[7px] font-black text-zinc-500 mb-2 flex items-center gap-1">Poder Total <Info size={8} /></p>
              <p className="text-lg font-black italic leading-none">R$ {activeCycle.poder.toLocaleString('pt-BR')}</p>
              <p className="text-[5.5px] text-zinc-600 font-bold leading-tight mt-2 italic">Conversão real de trabalho em riqueza.</p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[7px] font-black text-zinc-500 mb-2">Performance Radar</p>
              <p className="text-lg font-black italic leading-none">78%</p>
              <p className={`text-[5.5px] font-bold leading-tight mt-2 italic ${activeCycle.tipo === "FUTURO" ? "text-orange-500/70" : "text-zinc-600"}`}>
                {activeCycle.tipo === "FUTURO" ? "* Estimativa volátil." : "Dados técnicos validados."}
              </p>
            </div>
          </div>

          {/* DIAGNÓSTICO DE MELHORIA */}
          <div className={`p-5 rounded-[2rem] border transition-colors duration-500 
            ${activeCycle.tipo === "FUTURO" ? "bg-zinc-900/40 border-white/5" : "bg-yellow-500/5 border-yellow-500/20"}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={12} className={activeCycle.tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"} />
              <span className={`text-[8px] font-black tracking-widest ${activeCycle.tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"}`}>Diagnóstico de Melhoria</span>
            </div>
            <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium">
              {vereditoInteligente.dica}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
