"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TrendingUp, Zap, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mês">("semana");
  const [trendData, setTrendData] = useState<{ x: number; y: number }[]>([]);
  const [statusFeedback, setStatusFeedback] = useState({ label: "Analisando...", color: "text-zinc-500", icon: <Info size={16}/> });

  useEffect(() => {
    let isMounted = true;

    async function fetchSystemData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const { data: rawData, error } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id);

        if (!isMounted) return;

        // --- LÓGICA INFALÍVEL DE CÁLCULO ---
        let saldoTotal = 0;
        if (rawData && rawData.length > 0) {
          saldoTotal = rawData.reduce((acc, t) => {
            const val = Math.abs(Number(t.amount)) || 0;
            return t.type === 'withdrawal' ? acc - val : acc + val;
          }, 0);
        }

        const numDias = periodo === "dia" ? 1 : periodo === "semana" ? 7 : 30;
        const pontosFixos = 50; 
        const novaTrend = [];

        // Forçamos a inclinação a ser visível mas controlada
        // Se saldoTotal for 1000, a inclinação final será +- 40 pixels
        const forcaInclinacao = Math.max(-40, Math.min(40, saldoTotal / 100));

        for (let i = 0; i <= pontosFixos; i++) {
          const x = (i / pontosFixos) * 300;
          const progresso = i / pontosFixos;
          
          // A linha começa em 65 (centro) e vai para cima (Y menor) ou baixo (Y maior)
          const inclinar = forcaInclinacao * progresso * (numDias / 10);
          const onda = Math.sin(i * 0.6) * 6; // Onda constante para o gráfico ter "vida"

          novaTrend.push({ 
            x: x, 
            y: 65 - inclinar + onda 
          });
        }

        setTrendData(novaTrend);

        // Feedback simplificado
        if (saldoTotal > 0) {
          setStatusFeedback({ label: `PROJEÇÃO POSITIVA (+${numDias}D)`, color: "text-green-400", icon: <CheckCircle2 size={16}/> });
        } else if (saldoTotal < 0) {
          setStatusFeedback({ label: `PROJEÇÃO DE QUEDA (+${numDias}D)`, color: "text-red-500", icon: <AlertCircle size={16}/> });
        } else {
          setStatusFeedback({ label: "FLUXO ESTÁVEL", color: "text-yellow-400", icon: <TrendingUp size={16}/> });
        }

      } catch (err) {
        console.error("Erro no Veredito:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSystemData();
    return () => { isMounted = false; };
  }, [periodo, router]);

  // Função de desenho da linha (SVG Path)
  const pathData = useMemo(() => {
    if (trendData.length < 2) return "";
    return `M ${trendData[0].x},${trendData[0].y} ` + 
      trendData.map((p, i) => i === 0 ? "" : `L ${p.x},${p.y}`).join(" ");
  }, [trendData]);

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans uppercase">
      <div className="max-w-xl mx-auto space-y-12 pt-8">
        <header className="flex justify-between items-start">
          <h1 className="text-7xl font-black italic tracking-tighter">VEREDITO</h1>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        <div className="bg-[#050505] p-10 rounded-[3rem] border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-[9px] font-black text-zinc-600 tracking-widest">TENDÊNCIA PRÓXIMA {periodo}</h4>
            <div className="flex bg-black p-1 rounded-xl border border-white/10">
              {["dia", "semana", "mês"].map((t) => (
                <button key={t} onClick={() => setPeriodo(t as any)} 
                  className={`px-4 py-1 rounded-lg text-[8px] font-black ${periodo === t ? 'bg-yellow-400 text-black' : 'text-zinc-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-48 w-full mb-10">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-zinc-800 text-[10px]">CARREGANDO...</div>
            ) : (
              <svg viewBox="0 0 300 130" className="w-full h-full overflow-visible">
                {/* Grid */}
                {[0, 1, 2, 3].map(i => (
                  <line key={i} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="white" opacity="0.05" />
                ))}
                {/* Linha da Projeção */}
                <path d={pathData} fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                <circle cx={trendData[trendData.length-1]?.x} cy={trendData[trendData.length-1]?.y} r="3" fill="#facc15" />
              </svg>
            )}
          </div>

          <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
            {statusFeedback.icon}
            <span className={`text-[10px] font-bold tracking-tighter ${statusFeedback.color}`}>{statusFeedback.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
