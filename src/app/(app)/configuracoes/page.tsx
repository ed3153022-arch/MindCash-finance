"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Brain, Wallet, BarChart3, Zap, Flame, Trophy } from "lucide-react";

export default function VereditoPage() {
  const router = useRouter();

  // Valores simulados para o gráfico (0 a 100)
  const stats = { disciplina: 95, mental: 70, financeiro: 82, foco: 64 };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-6 pt-24 pb-20">
        
        {/* HEADER COM IDENTIDADE FORTE */}
        <div className="px-2">
          <h1 className="text-6xl font-black italic uppercase leading-[0.8] tracking-tighter text-white">
            VEREDITO
          </h1>
          <p className="text-yellow-400 text-[10px] font-black tracking-[0.5em] uppercase italic mt-4 px-1 opacity-80">
            Inteligência e Disciplina
          </p>
        </div>

        {/* CONTAINER DO GRÁFICO DE TEIA (RADAR) */}
        <div className="relative bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-10 flex items-center justify-center overflow-hidden shadow-2xl">
          {/* Brilho de fundo */}
          <div className="absolute inset-0 bg-yellow-400/5 blur-[80px] rounded-full" />
          
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* SVG da Teia */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
              {/* Linhas de fundo (as teias cinzas) */}
              {[20, 40, 60, 80, 100].map((r) => (
                <circle key={r} cx="50" cy="50" r={r/2} fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1" opacity="0.2" />
              ))}
              
              {/* Eixos da Teia */}
              <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.1" opacity="0.1" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.1" opacity="0.1" />

              {/* O Polígono da Teia (O Veredito Real) */}
              {/* Pontos calculados com base nos stats: topo(disciplina), direita(mental), baixo(financeiro), esquerda(foco) */}
              <polygon 
                points={`50,${50 - stats.disciplina/2} ${50 + stats.mental/2},50 50,${50 + stats.financeiro/2} ${50 - stats.foco/2},50`}
                fill="rgba(250, 204, 21, 0.15)"
                stroke="#facc15"
                strokeWidth="1.5"
                className="drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
              />
            </svg>

            {/* Score Central */}
            <div className="z-10 text-center">
              <span className="text-6xl font-black italic leading-none drop-shadow-md">85</span>
              <p className="text-[8px] font-black uppercase text-yellow-400 tracking-[0.3em] mt-1">Score</p>
            </div>
          </div>
        </div>

        {/* STATUS DE "MESTRE" */}
        <div className="bg-yellow-400 p-5 rounded-2xl border-2 border-black flex items-center justify-between shadow-[0_10px_20px_rgba(250,204,21,0.1)]">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-black/50 tracking-widest leading-none">Status Atual</span>
            <span className="text-2xl font-black italic uppercase text-black leading-tight tracking-tighter">Mestre Financeiro</span>
          </div>
          <div className="bg-black p-3 rounded-xl">
            <Zap className="text-yellow-400 h-5 w-5 fill-yellow-400" />
          </div>
        </div>

        {/* GRID DE ATRIBUTOS COM BORDAS ARREDONDADAS */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<ShieldCheck size={14}/>} label="Disciplina" value={stats.disciplina} />
          <StatCard icon={<Brain size={14}/>} label="Mental" value={stats.mental} />
          <StatCard icon={<Wallet size={14}/>} label="Financeiro" value={stats.financeiro} isYellow />
          <StatCard icon={<BarChart3 size={14}/>} label="Foco" value={stats.foco} />
        </div>

        {/* INFO ADICIONAL DE PERFORMANCE */}
        <div className="bg-[#0e0e0e] rounded-3xl p-6 border border-white/5 flex justify-between items-center mt-2">
           <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Sessão Atual</span>
                <span className="text-lg font-black italic uppercase">12 DIAS</span>
              </div>
           </div>
           <div className="h-8 w-[1px] bg-white/5" />
           <div className="flex items-center gap-4 text-right">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Eficiência</span>
                <span className="text-lg font-black italic uppercase text-yellow-400">TOP 5%</span>
              </div>
           </div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")}
          className="mt-4 py-4 text-zinc-700 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition-all"
        >
          [ Retornar ao Dashboard ]
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, isYellow = false }: any) {
  return (
    <div className="bg-[#111] p-5 rounded-[1.5rem] border border-white/5 flex flex-col gap-3 group active:scale-95 transition">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className={isYellow ? "text-yellow-400" : ""}>{icon}</span>
        <span className="text-[8px] font-black uppercase tracking-widest italic">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-black italic ${isYellow ? 'text-yellow-400' : 'text-white'}`}>{value}</span>
        <span className="text-[10px] font-black text-zinc-800">/100</span>
      </div>
    </div>
  );
}
