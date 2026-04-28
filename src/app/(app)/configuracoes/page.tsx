"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BrainCircuit, CalendarDays, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client"; // Verifique se este é o seu path do Supabase

export default function CardCiclosOperacionais() {
  const [selectedCycle, setSelectedCycle] = useState(2);
  const [sentencaIA, setSentencaIA] = useState("");
  const [isLoadingIA, setIsLoadingIA] = useState(false);
  
  const supabase = createClient();

  const cyclesData = useMemo(() => [
    { label: "FEV", tipo: "PASSADO", saldo: 1100, status: "ESTÁVEL", poder: 150 },
    { label: "MAR", tipo: "PASSADO", saldo: 4250, status: "DOMINANTE", poder: 1850 },
    { label: "ABR", tipo: "ATUAL", saldo: 2840, status: "DOMINANTE", poder: 950 },
    { label: "MAI", tipo: "FUTURO", saldo: 3200, status: "PROJEÇÃO", poder: 1800 },
    { label: "JUN", tipo: "FUTURO", saldo: 1200, status: "ALVO", poder: 2100 }
  ], []);

  const activeCycle = cyclesData[selectedCycle];
  const maxSaldo = useMemo(() => Math.max(...cyclesData.map(c => c.saldo), 1), [cyclesData]);

  // --- A PONTE DA INTELIGÊNCIA ---
  useEffect(() => {
    const fetchVeredito = async () => {
      setIsLoadingIA(true);
      const periodoChave = `${activeCycle.label}-${new Date().getFullYear()}`;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        // 1. Tenta buscar no Cache do Supabase
        const { data: cache } = await supabase
          .from('vereditos_ia')
          .select('*')
          .eq('user_id', user.id)
          .eq('periodo', periodoChave)
          .single();

        // Se o cache existe e os valores são os mesmos, usa ele
        if (cache && Number(cache.saldo_referencia) === activeCycle.saldo && Number(cache.poder_referencia) === activeCycle.poder) {
          setSentencaIA(cache.sentenca);
          setIsLoadingIA(false);
          return;
        }

        // 2. Se não tem cache ou valor mudou, chama a API Route da IA
        const res = await fetch('/api/veredito-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saldo: activeCycle.saldo,
            poder: activeCycle.poder,
            status: activeCycle.status,
            tipo: activeCycle.tipo,
            periodo: periodoChave
          }),
        });

        const data = await res.json();
        const textoFinal = data.text;

        // 3. Salva o novo veredito no Supabase (Upsert)
        await supabase.from('vereditos_ia').upsert({
          user_id: user.id,
          periodo: periodoChave,
          saldo_referencia: activeCycle.saldo,
          poder_referencia: activeCycle.poder,
          sentenca: textoFinal
        });

        setSentencaIA(textoFinal);
      } catch (error) {
        console.error("Erro na ponte:", error);
        setSentencaIA("Análise técnica indisponível no momento.");
      } finally {
        setIsLoadingIA(false);
      }
    };

    fetchVeredito();
  }, [selectedCycle, activeCycle, supabase]);

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

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCycle}
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
              <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1">Status</p>
              <span className={`text-[10px] font-black italic uppercase leading-none ${activeCycle.tipo === "PASSADO" ? "text-green-400" : "text-yellow-500"}`}>
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
              <p className="text-lg font-black italic leading-none">
                {((activeCycle.poder / activeCycle.saldo) * 100).toFixed(0)}%
              </p>
              <p className={`text-[5.5px] font-bold leading-tight mt-2 italic ${activeCycle.tipo === "FUTURO" ? "text-orange-500/70" : "text-zinc-600"}`}>
                {activeCycle.tipo === "FUTURO" ? "* Estimativa volátil." : "Dados técnicos validados."}
              </p>
            </div>
          </div>

          {/* DIAGNÓSTICO DE MELHORIA (IA LIVE) */}
          <div className={`p-5 rounded-[2rem] border transition-all duration-500 
            ${isLoadingIA ? "animate-pulse border-yellow-500/50" : activeCycle.tipo === "FUTURO" ? "bg-zinc-900/40 border-white/5" : "bg-yellow-500/5 border-yellow-500/20"}
          `}>
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={12} className={isLoadingIA ? "text-yellow-500" : activeCycle.tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"} />
              <span className={`text-[8px] font-black tracking-widest ${activeCycle.tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"}`}>
                {isLoadingIA ? "Processando Veredito..." : "Veredito da Inteligência"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium min-h-[40px]">
              {isLoadingIA ? "Cruzando dados de capital e retenção..." : sentencaIA}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
