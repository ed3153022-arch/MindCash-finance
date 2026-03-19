"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [projectedBalance, setProjectedBalance] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  
  const stats = useMemo(() => [
    { label: "Disciplina", value: 100 }, { label: "Produtividade", value: 85 },
    { label: "Conhecimento", value: 15 }, { label: "Resiliência", value: 100 },
    { label: "Autocontrole", value: 90 }, { label: "Visão", value: 10 },
  ], []);

  const getDataPoints = useCallback((st: any[]) => {
    return st.map((s, i) => {
      const a = (i * 60 - 90) * (Math.PI / 180);
      const r = (s.value / 100) * 45;
      return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
    }).join(" ");
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemData() {
      try {
        setLoading(true);
        setProjectedBalance(null); // Limpa para garantir a troca visual

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        // --- TESTE DE INTERFACE (DEBUG) ---
        // Se a renderização estiver OK, os números 1, 2 ou 3 DEVEM aparecer.
        let valorTeste = 0;
        if (periodo === "dia") valorTeste = 1;
        else if (periodo === "semana") valorTeste = 2;
        else if (periodo === "mês") valorTeste = 3;

        // Simulando busca de dados para manter o comportamento real
        const { data: allTxs } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id);

        if (!isMounted) return;

        // LOG PARA VOCÊ VER NO CONSOLE DO NAVEGADOR (F12)
        console.log(`Período alterado para: ${periodo}. Valor esperado: ${valorTeste}`);
        
        // Aplicando o valor de teste 1, 2 ou 3
        setProjectedBalance(valorTeste);

        // Gráfico variando conforme o teste para conferência visual
        const pontos = 20;
        const tempTrend = [];
        for (let i = 0; i < pontos; i++) {
          const noise = Math.sin(i * 0.5 + valorTeste) * 10;
          tempTrend.push({ x: i, y: 50 - (valorTeste * 5) - noise });
        }
        setTrendData(tempTrend);

      } catch (e) {
        console.error("Erro no Debug:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
  }, [periodo, router]);

  const getSmoothPath = () => {
    if (trendData.length < 2) return "";
    const width = 300;
    const step = width / (trendData.length - 1);
    return trendData.reduce((acc, p, i) => {
      const x = i * step;
      if (i === 0) return `M ${x},${p.y}`;
      const prevX = (i - 1) * step;
      const cpX = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX},${trendData[i-1].y} ${cpX},${p.y} ${x},${p.y}`;
    }, "");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
            <p className="text-zinc-800 text-[8px] font-bold tracking-[0.7em] mt-4 uppercase">DEBUG MODE v1.0</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Dashboard de Projeção */}
        <div className="bg-[#050505] p-12 rounded-[3.5rem] border border-white/5 relative shadow-2xl">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-600 italic flex items-center gap-3 tracking-widest uppercase">
              <TrendingUp size={14} className="text-yellow-500"/> Teste de Alternância
            </h4>
            <div className="flex bg-black p-1.5 rounded-2xl border border-white/10">
              {(["dia", "semana", "mês"] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setPeriodo(t)} 
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black transition-all duration-300 ${periodo === t ? 'bg-yellow-400 text-black scale-105' : 'text-zinc-700 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full relative mb-6">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getSmoothPath()} fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-8 mt-6">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-[0.6em] mb-2 uppercase">Modo de Diagnóstico</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest">VERIFICANDO RENDER...</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-[0.2em] uppercase">Valor de Teste ({periodo})</p>
              <p className="text-7xl font-black italic text-yellow-400 leading-none tracking-tighter">
                {projectedBalance !== null ? projectedBalance : "..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
