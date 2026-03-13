"use client";

import React from "react";

export default function RadarChartVeredito() {
  // Valores de 0 a 100 para as 6 categorias
  const stats = {
    disciplina: 85,
    produtividade: 70,
    conhecimento: 90,
    resiliencia: 65,
    autocontrole: 80,
    visao: 75
  };

  return (
    <div className="relative bg-[#0a0a0a] rounded-[2rem] border border-white/5 p-10 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
      {/* Título da Seção - Com respiro para não cortar no topo */}
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8 italic">
        Performance Global
      </h3>

      <div className="relative w-80 h-80">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(250,204,21,0.1)]">
          {/* Teia de Fundo (Hexágono) */}
          {[20, 40, 60, 80, 100].map((r) => (
            <polygon
              key={r}
              points={getPoints(r / 2)}
              fill="none"
              stroke="white"
              strokeWidth="0.1"
              opacity="0.2"
            />
          ))}

          {/* Eixos que ligam o centro às pontas */}
          <line x1="50" y1="50" x2="50" y2="0" stroke="white" strokeWidth="0.1" opacity="0.2" />
          <line x1="50" y1="50" x2="93.3" y2="25" stroke="white" strokeWidth="0.1" opacity="0.2" />
          <line x1="50" y1="50" x2="93.3" y2="75" stroke="white" strokeWidth="0.1" opacity="0.2" />
          <line x1="50" y1="50" x2="50" y2="100" stroke="white" strokeWidth="0.1" opacity="0.2" />
          <line x1="50" y1="50" x2="6.7" y2="75" stroke="white" strokeWidth="0.1" opacity="0.2" />
          <line x1="50" y1="50" x2="6.7" y2="25" stroke="white" strokeWidth="0.1" opacity="0.2" />

          {/* ÁREA PREENCHIDA (A TEIA DO USUÁRIO) */}
          <polygon
            points={getDataPoints(stats)}
            fill="rgba(250, 204, 21, 0.2)"
            stroke="#facc15"
            strokeWidth="1.2"
            className="animate-pulse"
          />
        </svg>

        {/* Labels das Categorias ao redor da Teia */}
        <Label style="top-[-10px] left-1/2 -translate-x-1/2" text="Disciplina" />
        <Label style="top-[20%] right-[-20px]" text="Produtividade" />
        <Label style="bottom-[20%] right-[-20px]" text="Conhecimento" />
        <Label style="bottom-[-10px] left-1/2 -translate-x-1/2" text="Resiliência" />
        <Label style="bottom-[20%] left-[-20px]" text="Autocontrole" />
        <Label style="top-[20%] left-[-20px]" text="Visão" />

        {/* SCORE CENTRAL */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black italic text-white leading-none">81</span>
          <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Score</span>
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares para calcular os pontos do hexágono
function getPoints(r: number) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    points.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function getDataPoints(s: any) {
  const factors = [s.disciplina, s.produtividade, s.conhecimento, s.resiliencia, s.autocontrole, s.visao];
  const points = [];
  for (let i = 0; i < 6; i++) {
    const r = (factors[i] / 100) * 50;
    const angle = (i * 60 - 90) * (Math.PI / 180);
    points.push(`${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function Label({ style, text }: { style: string; text: string }) {
  return (
    <span className={`absolute ${style} text-[8px] font-black uppercase tracking-tighter text-zinc-500 italic`}>
      {text}
    </span>
  );
}
