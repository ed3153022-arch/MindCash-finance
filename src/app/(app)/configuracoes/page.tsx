"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trophy, Flame, Target, Zap } from "lucide-react";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulação de carregamento
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto px-6">
      {/* HEADER IMPACTANTE */}
      <div className="pt-24 pb-10 px-2">
        <h1 className="text-6xl font-black italic uppercase leading-[0.8] tracking-tighter text-white">VEREDITO</h1>
        <p className="text-yellow-400 text-[10px] font-black tracking-[0.5em] uppercase italic mt-4 px-1">Disciplina é Liberdade</p>
      </div>

      {/* CARD DE STATUS DIÁRIO */}
      <div className="bg-yellow-400 p-8 rounded-[1.5rem] border border-black flex items-center justify-between">
        <div>
          <p className="text-black font-black uppercase text-[10px] tracking-widest mb-1">Status de Hoje</p>
          <h3 className="text-black text-3xl font-black italic uppercase leading-none">Sob Controle</h3>
        </div>
        <div className="bg-black p-4 rounded-2xl shadow-xl">
          <Zap className="text-yellow-400 h-8 w-8 fill-yellow-400" />
        </div>
      </div>

      {/* GRID DE DISCIPLINA */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak */}
        <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 flex flex-col items-center text-center">
          <Flame className="text-orange-500 h-8 w-8 mb-3" />
          <span className="text-4xl font-black text-white italic">05</span>
          <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mt-1">Dias de Foco</span>
        </div>

        {/* Metas Cumpridas */}
        <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 flex flex-col items-center text-center">
          <Trophy className="text-yellow-400 h-8 w-8 mb-3" />
          <span className="text-4xl font-black text-white italic">92%</span>
          <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mt-1">Eficiência</span>
        </div>
      </div>

      {/* ANALISE MENSAL */}
      <div className="bg-[#111] pt-12 pb-10 px-8 rounded-[1.5rem] border border-white/5 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Target className="text-white h-5 w-5" />
          <h4 className="text-white font-black italic uppercase text-sm">Veredito do Mês</h4>
        </div>
        
        <div className="space-y-6">
          <p className="text-zinc-400 text-xs leading-relaxed font-medium">
            Você está <span className="text-white font-bold">R$ 450,00</span> abaixo do limite planejado. Se mantiver esse ritmo, chegará ao fim do mês com <span className="text-yellow-400 font-bold">excelência</span>.
          </p>
          
          {/* Barra de Progresso Estilizada */}
          <div className="w-full h-4 bg-black rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-yellow-400 w-[65%]" />
          </div>
          
          <div className="flex justify-between text-[9px] font-black uppercase text-zinc-600 tracking-widest">
            <span>Gasto: 65%</span>
            <span>Meta: 100%</span>
          </div>
        </div>
      </div>

      {/* BOTÃO DE VOLTAR */}
      <button 
        onClick={() => router.push("/dashboard")} 
        className="w-full py-5 text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em] hover:text-white transition"
      >
        [ Voltar ao Painel ]
      </button>
    </div>
  );
}
