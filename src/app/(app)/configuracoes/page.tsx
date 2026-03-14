"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, AlertCircle, Lightbulb, Zap } from "lucide-react";

export default function VereditoPage() {
  const router = useRouter();

  // Dados para o Gráfico de Teia (0 a 100)
  const stats = {
    disciplina: 85,
    produtividade: 70,
    conhecimento: 90,
    resiliencia: 65,
    autocontrole: 80,
    visao: 75
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      <div className="flex flex-col gap-10 w-full max-w-2xl mx-auto px-6 pt-24">
        
        {/* PRIMEIRA PARTE: NOME E DESCRIÇÃO */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black italic uppercase leading-[0.8] tracking-tighter">VEREDITO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.3em] uppercase italic px-1">
            Análise comportamental e desempenho financeiro.
          </p>
        </div>

        {/* SEGUNDA PARTE: STATUS E MELHORIA */}
        <div className="bg-yellow-400 p-6 rounded-[1.5rem] border-2 border-black shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-black font-black uppercase text-[9px] tracking-widest opacity-70">Status Atual</p>
              <h3 className="text-black text-3xl font-black italic uppercase leading-none">Em Evolução</h3>
            </div>
            <Zap className="text-black h-6 w-6 fill-black" />
          </div>
          <div className="bg-black/10 p-4 rounded-xl flex gap-3 items-start border border-black/5">
            <AlertCircle className="text-black h-5 w-5 shrink-0" />
            <p className="text-black text-[11px] font-bold leading-tight">
              PONTO DE MELHORIA: O teu autocontrole baixou 5% este fim de semana. Tenta evitar compras não planeadas após as 20h.
            </p>
          </div>
        </div>

        {/* TERCEIRA PARTE: GRÁFICO DE TEIA (RADAR) */}
        <div className="relative bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-12 flex items-center justify-center shadow-2xl">
          <div className="relative w-72 h-72">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {[20, 40, 60, 80, 100].map((r) => (
                <polygon key={r} points={getPoints(r / 2)} fill="none" stroke="white" strokeWidth="0.1" opacity="0.2" />
              ))}
              <polygon
                points={getDataPoints(stats)}
                fill="rgba(250, 204, 21, 0.2)"
                stroke="#facc15"
                strokeWidth="1.2"
              />
            </svg>
            {/* Labels das categorias nos cantos */}
            <RadarLabel pos="top-[-15px] left-1/2 -translate-x-1/2" text="Disciplina" val={stats.disciplina} />
            <RadarLabel pos="top-[25%] right-[-35px]" text="Produtividade" val={stats.produtividade} />
            <RadarLabel pos="bottom-[25%] right-[-35px]" text="Conhecimento" val={stats.conhecimento} />
            <RadarLabel pos="bottom-[-15px] left-1/2 -translate-x-1/2" text="Resiliência" val={stats.resiliencia} />
            <RadarLabel pos="bottom-[25%] left-[-35px]" text="Autocontrole" val={stats.autocontrole} />
            <RadarLabel pos="top-[25%] left-[-35px]" text="Visão" val={stats.visao} />
          </div>
        </div>

        {/* QUARTA PARTE: TENDÊNCIAS DA SEMANA */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-zinc-500 h-4 w-4" />
            <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tendência Semanal</h4>
          </div>
          <div className="flex items-end gap-2 h-24 justify-between px-2">
            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-full">
                <div style={{ height: `${h}%` }} className={`w-full rounded-t-sm transition-all ${i === 3 ? 'bg-yellow-400' : 'bg-zinc-800'}`} />
                <span className="text-[7px] font-black text-zinc-700 uppercase italic">Dia {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QUINTA PARTE: CONSELHO DO DIA */}
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity text-yellow-400">
            <Lightbulb size={40} />
          </div>
          <h4 className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 italic">Conselho do Dia</h4>
          <p className="text-white text-lg font-black italic uppercase leading-tight tracking-tight">
            Gastaste 38% em alimentação. <br/>
            <span className="text-zinc-500">Reduzir R$ 10 por dia economiza R$ 300 no mês.</span>
          </p>
        </div>

        <button onClick={() => router.push("/dashboard")} className="py-6 text-zinc-700 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white transition-all">
          [ Retornar ao Dashboard ]
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

function getDataPoints(s: any) {
  const vals = [s.disciplina, s.produtividade, s.conhecimento, s.resiliencia, s.autocontrole, s.visao];
  let p = [];
  for (let i = 0; i < 6; i++) {
    const r = (vals[i] / 100) * 50;
    const angle = (i * 60 - 90) * (Math.PI / 180);
    p.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return p.join(" ");
}

function RadarLabel({ pos, text, val }: { pos: string; text: string; val: number }) {
  return (
    <div className={`absolute ${pos} flex flex-col items-center`}>
      <span className="text-[8px] font-black uppercase text-zinc-500 italic leading-none">{text}</span>
      <span className="text-[12px] font-black text-white italic">{val}</span>
    </div>
  );
}
