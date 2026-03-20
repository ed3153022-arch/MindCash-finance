"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [projectedBalance, setProjectedBalance] = useState<number>(0);
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  
  const stats = useMemo(() => [
    { label: "Disciplina", value: 100 }, { label: "Produtividade", value: 85 },
    { label: "Conhecimento", value: 15 }, { label: "Resiliência", value: 100 },
    { label: "Autocontrole", value: 90 }, { label: "Visão", value: 10 },
  ], []);

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: rawData, error } = await supabase
          .from("transactions")
          .select("amount, type, created_at")
          .eq("user_id", user.id);

        if (error || !rawData) throw error;
        if (!isMounted) return;

        // 1. CALCULAR SALDO ATUAL (EXATO)
        let saldoAtual = 0;
        rawData.forEach(t => {
          const v = Math.abs(Number(t.amount));
          if (t.type.toLowerCase().trim() === 'income') saldoAtual += v;
          else saldoAtual -= v;
        });

        // 2. CALCULAR PERFORMANCE DO PERÍODO (LUCRO OU PREJUÍZO)
        const agora = new Date().getTime();
        const range = { dia: 1, semana: 7, mês: 30 }[periodo] * 24 * 60 * 60 * 1000;
        const limite = agora - range;

        let lucroNoPeriodo = 0;
        rawData.filter(t => new Date(t.created_at).getTime() >= limite).forEach(t => {
          const v = Math.abs(Number(t.amount));
          if (t.type.toLowerCase().trim() === 'income') lucroNoPeriodo += v;
          else lucroNoPeriodo -= v;
        });

        // 3. O VEREDITO: "Se eu repetir esse lucro no próximo período..."
        const previsao = saldoAtual + lucroNoPeriodo;
        setProjectedBalance(previsao);

        // 4. GRÁFICO: Se o lucro é positivo, a linha sobe do início ao fim.
        const pontos = 40;
        const tempTrend = [];
        const subida = (lucroNoPeriodo / (Math.abs(saldoAtual) || 1000)) * 100;

        for (let i = 0; i < pontos; i++) {
          const progresso = i / (pontos - 1);
          const noise = Math.sin(i * 1.5) * 4; // Detalhe visual técnico
          // Y=70 é a base, Y=20 é o topo. Se 'subida' for positiva, subtraímos para a linha subir no SVG.
          const y = 70 - (subida * progresso) - noise;
          tempTrend.push({ x: i, y: Math.max(15, Math.min(85, y)) });
        }
        setTrendData(tempTrend);

      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
  }, [periodo, router]);

  // Função para desenhar a linha suave
  const getPath = () => {
    if (trendData.length < 2) return "";
    return trendData.reduce((acc, p, i) => {
      const x = i * (300 / (trendData.length - 1));
      return i === 0 ? `M ${x},${p.y}` : `${acc} L ${x},${p.y}`;
    }, "");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-28 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter leading-[0.8]">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* Radar Chart Visual */}
        <div className="bg-[#050505] rounded-[3.5rem] border border-white/5 p-12 shadow-2xl">
          <div className="grid grid-cols-3 gap-y-10 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[8px] font-black text-zinc-700 mb-1 tracking-widest">{s.label}</p>
                <p className="text-3xl font-black italic text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard de Previsão Simples */}
        <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-white/5 relative">
          <div className="flex justify-between items-center mb-16">
            <h4 className="text-[10px] font-black text-zinc-500 tracking-widest flex items-center gap-2">
              <TrendingUp size={14}/> RITMO {periodo}
            </h4>
            <div className="flex bg-black p-1 rounded-2xl border border-white/10">
              {["dia", "semana", "mês"].map((t: any) => (
                <button key={t} onClick={() => setPeriodo(t)} className={`px-6 py-2 rounded-xl text-[9px] font-black ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-700'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-40 w-full mb-10">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <path d={getPath()} fill="none" stroke="#facc15" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="300" cy={trendData[trendData.length-1]?.y} r="8" fill="#facc15" className="animate-pulse" />
            </svg>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-10">
            <div className="text-left">
               <p className="text-[8px] text-zinc-800 font-black tracking-widest uppercase">Próximo Ciclo</p>
               <p className="text-xs font-black text-yellow-500 italic tracking-widest uppercase">Estimado</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-widest uppercase">Saldo Projetado</p>
              <p className="text-5xl font-black italic leading-none tracking-tighter text-yellow-400">
                {projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
