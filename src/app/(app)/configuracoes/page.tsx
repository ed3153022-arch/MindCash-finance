"use client";

import React, { useState, useMemo } from "react";
import { BrainCircuit, CalendarDays, Info } from "lucide-react";

export default function CardCiclosOperacionais() {
  const [selectedCycle, setSelectedCycle] = useState(2); // Foco no mês Atual (Ex: Abril)

  // 1. DADOS DOS CICLOS (Simulando banco de dados)
  const cyclesData = useMemo(() => [
    { label: "FEV", tipo: "PASSADO", saldo: 1100, status: "ESTÁVEL", poder: "R$ 400", radar: 55, dica: "Fevereiro teve um saldo baixo. Foque em reduzir custos fixos para aumentar seu Poder no próximo ciclo." },
    { label: "MAR", tipo: "PASSADO", saldo: 4250, status: "DOMINANTE", poder: "R$ 1.850", radar: 82, dica: "Março foi um mês de alta performance. Você converteu 43% do faturamento em Poder Real." },
    { label: "ABR", tipo: "ATUAL", saldo: 2840, status: "DOMINANTE", poder: "R$ 1.500", radar: 78, dica: "Sua operação está saudável. Mantenha a vigilância nos próximos 10 dias para fechar como Implacável." },
    { label: "MAI", tipo: "FUTURO", saldo: 3200, status: "PROJEÇÃO", poder: "R$ 1.800", radar: 70, dica: "Projeção baseada em seus limites atuais. Mantenha o teto de gastos para atingir este saldo." },
    { label: "JUN", tipo: "FUTURO", saldo: 1200, status: "ALVO", poder: "R$ 2.100", radar: 65, dica: "Meta agressiva para Junho. O sistema sugere antecipar aportes para garantir o status Alvo." }
  ], []);

  // 2. AJUSTE: Lógica de Altura Dinâmica
  // Encontramos o maior saldo para servir de referência (100%)
  const maxSaldo = Math.max(...cyclesData.map(c => c.saldo));

  const getStatusColor = (status: string) => {
    if (status.includes("DOMINANTE")) return "text-green-400";
    if (status.includes("ESTÁVEL")) return "text-yellow-400";
    if (status.includes("CRÍTICO")) return "text-red-500";
    return "text-zinc-500"; // Para projeções futuras
  };

  return (
    <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5 mx-4 my-10">
      <div className="flex items-center gap-2 mb-8 text-zinc-600">
        <CalendarDays size={14} />
        <span className="text-[9px] font-black tracking-[0.2em] uppercase">Cronograma de Ciclos</span>
      </div>

      {/* TIMELINE DE BARRAS DINÂMICAS */}
      <div className="flex justify-between items-end h-32 mb-10 px-2 border-b border-white/5 pb-4">
        {cyclesData.map((cycle, idx) => {
          // Calculo da porcentagem: (valor atual / valor máximo) * 100
          // Adicionamos um min-height de 10% para que meses com saldo R$ 1 ainda apareçam
          const barHeight = Math.max(10, (cycle.saldo / maxSaldo) * 100);
          
          return (
            <button 
              key={idx} 
              onClick={() => setSelectedCycle(idx)}
              className="flex flex-col items-center gap-3 outline-none group"
            >
              <div 
                className={`w-10 rounded-t-sm transition-all duration-700 ease-out
                  ${cycle.tipo === "FUTURO" ? "bg-zinc-800" : "bg-yellow-500"}
                  ${selectedCycle === idx ? "opacity-100 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-x-110" : "opacity-20 group-hover:opacity-40"}
                `}
                style={{ height: `${barHeight}%` }} // AQUI ESTÁ O DINAMISMO
              />
              <span className={`text-[8px] font-black tracking-tighter ${selectedCycle === idx ? "text-white" : "text-zinc-700"}`}>
                {cycle.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* INFOS DO CICLO SELECIONADO */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1 uppercase">Saldo do Período</p>
            <h4 className="text-4xl font-black italic tracking-tighter text-white leading-none">
              R$ {cyclesData[selectedCycle].saldo.toLocaleString('pt-BR')}
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1 uppercase">Veredito</p>
            <span className={`text-[10px] font-black italic uppercase leading-none ${getStatusColor(cyclesData[selectedCycle].status)}`}>
              {cyclesData[selectedCycle].status}
            </span>
          </div>
        </div>

        {/* METRICAS DE PODER E RADAR */}
        <div className="grid grid-cols-2 gap-4">
          {/* PODER TOTAL ALOCADO */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative overflow-hidden group">
            <p className="text-[7px] font-black text-zinc-500 mb-2 tracking-tighter uppercase flex items-center gap-1">
              Poder Total Alocado <Info size={8} />
            </p>
            <p className="text-lg font-black italic text-white leading-none">{cyclesData[selectedCycle].poder}</p>
            <p className="text-[5.5px] text-zinc-600 font-bold leading-tight mt-2 uppercase transition-colors group-hover:text-zinc-400">
              Capital convertido em patrimônio real e blindado.
            </p>
          </div>

          {/* PERFORMANCE RADAR */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative">
            <p className="text-[7px] font-black text-zinc-500 mb-2 tracking-tighter uppercase">Performance Radar</p>
            <p className="text-lg font-black italic text-white leading-none">{cyclesData[selectedCycle].radar}%</p>
            
            {/* Detalhe dinâmico para o futuro */}
            <p className={`text-[5.5px] font-bold leading-tight mt-2 uppercase italic 
              ${cyclesData[selectedCycle].tipo === "FUTURO" ? "text-orange-500/70" : "text-zinc-600"}`}>
              {cyclesData[selectedCycle].tipo === "FUTURO" 
                ? "* Estimativa volátil (sujeita a disciplina)." 
                : "Eficiência técnica baseada em dados reais."}
            </p>
          </div>
        </div>

        {/* DIAGNÓSTICO DE MELHORIA (DINÂMICO) */}
        <div className={`p-5 rounded-[2rem] border transition-all duration-500 
          ${cyclesData[selectedCycle].tipo === "FUTURO" ? "bg-zinc-900/40 border-white/5" : "bg-yellow-500/5 border-yellow-500/20"}
        `}>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={12} className={cyclesData[selectedCycle].tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"} />
            <span className={`text-[8px] font-black tracking-widest uppercase ${cyclesData[selectedCycle].tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"}`}>
              Diagnóstico de Melhoria
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium">
            {cyclesData[selectedCycle].dica}
          </p>
        </div>
      </div>
    </section>
  );
}
