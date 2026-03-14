"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Zap, 
  Lightbulb, 
  TrendingUp, 
  Calendar,
  ChevronLeft
} from "lucide-react";

export default function VereditoPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState("semana");

  // Dados das Disciplinas
  const stats = [
    { label: "Disciplina", value: 85, color: "text-white" },
    { label: "Produtividade", value: 70, color: "text-white" },
    { label: "Conhecimento", value: 90, color: "text-white" },
    { label: "Resiliência", value: 65, color: "text-white" },
    { label: "Autocontrole", value: 80, color: "text-yellow-400" },
    { label: "Visão", value: 75, color: "text-white" },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto px-6 pt-24">
        
        {/* PARTE 1: NOME E DESCRIÇÃO */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase leading-[0.8] tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic px-1">
            Análise comportamental e desempenho.
          </p>
        </div>

        {/* PARTE 3: STATUS ATUAL (APENAS O STATUS) */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black flex items-center justify-between shadow-lg">
          <div>
            <p className="text-black font-black uppercase text-[9px] tracking-widest opacity-70">Status Atual</p>
            <h3 className="text-black text-3xl font-black italic uppercase leading-none">Em Evolução</h3>
          </div>
          <Zap className="text-black h-8 w-8 fill-black" />
        </div>

        {/* PARTE 1 & 2: GRÁFICO DE TEIA PEQUENO + LEGENDA DE SCORES */}
        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-8 space-y-8">
          {/* Gráfico Reduzido e sem Score Central */}
          <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r / 2)} fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
              ))}
              <polygon
                points={getDataPoints(stats)}
                fill="rgba(250, 204, 21, 0.2)"
                stroke="#facc15"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Legenda Estilo Print (Scores Individuais) */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
            {stats.map((item) => (
              <div key={item.label} className="text-center space-y-1">
                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-tighter italic">{item.label}</p>
                <p className={`text-xl font-black italic ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PARTE 5: GRÁFICO DE TENDÊNCIAS EM LINHA COM FILTRO */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-zinc-500 h-4 w-4" />
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-white">Tendências</h4>
            </div>
            {/* Filtros Dia/Semana/Mês */}
            <div className="flex bg-black p-1 rounded-xl border border-white/5">
              {["dia", "semana", "mês"].map((t) => (
                <button 
                  key={t}
                  onClick={() => setPeriodo(t)}
                  className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase italic transition-all ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          {/* Gráfico de Linha Simples (SVG) */}
          <div className="h-32 w-full pt-4">
            <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
              <path
                d="M0,50 Q25,10 50,40 T100,20 T150,45 T200,10"
                fill="none"
                stroke="#facc15"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="200" cy="10" r="3" fill="#facc15" />
            </svg>
          </div>
        </div>

        {/* PARTE 4: CONSELHO E PONTO DE MELHORIA JUNTOS */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-yellow-400">
              <Lightbulb size={16} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Análise do Dia</h4>
            </div>
            <p className="text-white text-lg font-black italic uppercase leading-tight tracking-tight">
              Gastaste 38% em alimentação. <br/>
              <span className="text-zinc-500">Reduzir R$ 10 por dia economiza R$ 300 no mês.</span>
            </p>
          </div>
          
          <div className="pt-6 border-t border-white/10">
            <p className="text-yellow-400 text-[9px] font-black uppercase tracking-widest mb-1">Ponto de Melhoria</p>
            <p className="text-zinc-400 text-xs font-bold leading-relaxed italic">
              O teu autocontrole baixou 5% este fim de semana. Tenta evitar compras não planeadas após as 20h.
            </p>
          </div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")} 
          className="py-6 text-zinc-700 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={12} /> RETORNAR AO DASHBOARD
        </button>
      </div>
    </div>
  );
}

// Funções Auxiliares para o Gráfico de Teia
function getPoints(r: number) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}

function getDataPoints(stats: any[]) {
  let p = [];
  for (let i = 0; i < 6; i++) {
    const r = (stats[i].value / 100) * 50;
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}
