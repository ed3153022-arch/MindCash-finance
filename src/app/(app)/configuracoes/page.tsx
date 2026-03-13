"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Brain, 
  Wallet, 
  BarChart3, 
  Flame, 
  Trophy,
  Zap
} from "lucide-react";

export default function VereditoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-400 selection:text-black">
      <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto px-8 pt-24 pb-20">
        
        {/* HEADER IMPACTANTE - Evita cortes no topo */}
        <div className="space-y-2 px-2">
          <h1 className="text-6xl font-black italic uppercase leading-[0.8] tracking-tighter text-white">
            VEREDITO
          </h1>
          <p className="text-yellow-400 text-[10px] font-black tracking-[0.5em] uppercase italic mt-4 px-1">
            Inteligência e Disciplina
          </p>
        </div>

        {/* SCORE CENTRAL VISUAL - Inspirado na Visão Geral */}
        <div className="bg-[#111] p-12 rounded-[1.5rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-yellow-400/5 blur-[100px] opacity-20" />
          
          {/* Círculo de Score - Estilo MindCash */}
          <div className="w-56 h-56 border-4 border-zinc-900 rounded-full flex items-center justify-center relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="text-center z-10">
                <span className="text-7xl font-black italic text-white leading-none tracking-tighter">85</span>
                <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Score Total</p>
             </div>
             {/* Simulação do gráfico de teia */}
             <div className="absolute inset-4 border border-yellow-400/20 rounded-full rotate-45 opacity-50" />
             <div className="absolute inset-8 border border-white/5 rounded-full -rotate-12" />
          </div>
        </div>

        {/* STATUS RÁPIDO - Estilo Botão de Transação */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black flex items-center justify-between shadow-lg active:scale-[0.98] transition">
          <div>
            <p className="text-black font-black uppercase text-[9px] tracking-widest mb-1 opacity-70">Status Atual</p>
            <h3 className="text-black text-2xl font-black italic uppercase leading-none">Mestre Financeiro</h3>
          </div>
          <div className="bg-black p-3 rounded-xl">
            <Zap className="text-yellow-400 h-6 w-6 fill-yellow-400" />
          </div>
        </div>

        {/* GRID DE ATRIBUTOS - Baseado na imagem de referência */}
        <div className="grid grid-cols-2 gap-4">
          <AtributoCard icon={<ShieldCheck size={18}/>} label="Disciplina" value="95" />
          <AtributoCard icon={<Brain size={18}/>} label="Mental" value="70" />
          <AtributoCard icon={<Wallet size={18}/>} label="Financeiro" value="82" highlight />
          <AtributoCard icon={<BarChart3 size={18}/>} label="Foco" value="64" />
        </div>

        {/* RESUMO DE CONQUISTAS */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <div className="flex items-center gap-3">
                <Flame className="text-orange-500 h-5 w-5" />
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Sessão Atual</span>
             </div>
             <span className="text-white font-black italic">12 DIAS</span>
          </div>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Trophy className="text-yellow-400 h-5 w-5" />
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Eficiência</span>
             </div>
             <span className="text-white font-black italic">TOP 5%</span>
          </div>
        </div>

        {/* RODAPÉ / VOLTAR */}
        <button 
          onClick={() => router.push("/dashboard")}
          className="w-full py-6 text-zinc-600 font-black text-[10px] uppercase tracking-[0.5em] hover:text-white transition-all active:opacity-50"
        >
          [ Retornar ao Dashboard ]
        </button>
      </div>
    </div>
  );
}

// Sub-componente para os cards de atributos
function AtributoCard({ icon, label, value, highlight = false }: any) {
  return (
    <div className={`p-6 rounded-[1.5rem] border ${highlight ? 'bg-zinc-900 border-yellow-400/20' : 'bg-[#111] border-white/5'} flex flex-col gap-4 shadow-xl`}>
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-black italic ${highlight ? 'text-yellow-400' : 'text-white'}`}>
          {value}
        </span>
        <span className="text-[10px] font-black text-zinc-700 italic">/100</span>
      </div>
    </div>
  );
}
