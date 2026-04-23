"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging, Flame
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Estados iniciais seguros
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const [transRes, limitesRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: false }),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        const agora = new Date();

        const saídas = rawData.filter(t => t.type === 'withdrawal');
        const saldoAtual = rawData.reduce((acc, t) => t.type === 'deposit' ? acc + Number(t.amount) : acc - Math.abs(Number(t.amount)), 0);
        
        // Alocação de Poder
        const totalSaidas = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 1;
        const volPoder = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volPrazer = saídas.filter(t => ["Lazer", "Restaurante", "Shopping", "Viagem", "iFood"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volManutencao = Math.max(0, totalSaidas - volPoder - volPrazer);

        setPowerAllocation({
          manutencao: Math.round((volManutencao / totalSaidas) * 100),
          prazer: Math.round((volPrazer / totalSaidas) * 100),
          poder: Math.round((volPoder / totalSaidas) * 100)
        });

        // Autonomia
        const ultimos30Dias = saídas.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 30);
        const gastoDiarioMedio = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) / 30;
        const diasRestantes = gastoDiarioMedio > 0 ? Math.floor(saldoAtual / gastoDiarioMedio) : 0;
        
        setBurnData({ 
          dias: Math.max(0, diasRestantes), 
          percentual: Math.min(100, (diasRestantes / 30) * 100) 
        });

        // Métricas
        const dias7D = new Set(rawData.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 7).map(t => new Date(t.created_at).toDateString())).size;
        setMetrics({
          consistencia: Math.min(100, Math.round((dias7D / 7) * 100)),
          precisao: Math.min(100, Math.round((rawData.filter(t => t.category && !["Outros"].includes(t.category)).length / (rawData.length || 1)) * 100)),
          previsao: 70, 
          disciplina: 80,
          evolucao: 65,
          engajamento: 90
        });

      } catch (e) { 
        console.error("Erro interno:", e); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchVereditoData();
  }, [router]);

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;

  const status = useMemo(() => {
    if (avgScore >= 80) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10" };
    if (avgScore >= 50) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10" };
  }, [avgScore]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="text-yellow-400 animate-spin" size={32} />
    </div>
  );

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter">
      <div className="space-y-6">
        
        {/* HEADER LIMPO */}
        <header className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <h1 className="text-5xl font-black italic leading-none">VEREDITO</h1>
            <p className="text-[9px] text-zinc-500 font-bold tracking-[0.3em] mt-1">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* SELOS */}
        <section className="bg-zinc-950 p-4 rounded-3xl border border-white/5 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center py-3 opacity-50"><Shield size={16}/><span className="text-[7px] mt-1">MURALHA</span></div>
          <div className="flex flex-col items-center py-3 opacity-50"><ShieldCheck size={16}/><span className="text-[7px] mt-1">SENTINELA</span></div>
          <div className="flex flex-col items-center py-3 opacity-50"><Crown size={16}/><span className="text-[7px] mt-1">SOBERANO</span></div>
          <div className="flex flex-col items-center py-3 opacity-50"><Flame size={16}/><span className="text-[7px] mt-1">IMPULSO</span></div>
        </section>

        {/* STATUS */}
        <section className={`p-6 rounded-3xl border border-white/5 ${status.bg} relative overflow-hidden`}>
          <h2 className={`text-5xl font-black italic mb-2 ${status.color}`}>{status.label}</h2>
          <p className="text-[10px] text-zinc-400 normal-case">Análise de fluxo concluída com sucesso.</p>
          <BrainCircuit className="absolute -right-6 -bottom-6 text-white/5" size={100} />
        </section>

        {/* ALOCAÇÃO */}
        <section className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BatteryCharging className="text-zinc-500" size={12} />
            <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-24 gap-3">
            {[
              { label: "FIXO", val: powerAllocation.manutencao, color: "bg-zinc-800" },
              { label: "LAZER", val: powerAllocation.prazer, color: "bg-orange-500/40" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-lg overflow-hidden flex flex-col justify-end" style={{ height: '70px' }}>
                  <div className={`w-full ${b.color} transition-all duration-700`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[9px] font-black italic">{b.val}%</p>
              </div>
            ))}
          </div>
        </section>

        {/* AUTONOMIA */}
        <section className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-[8px] font-black text-zinc-500 tracking-widest uppercase">Autonomia</span>
              <h3 className="text-3xl font-black italic mt-1">{burnData.dias} DIAS</h3>
            </div>
            <Hourglass className="text-yellow-500 opacity-30" size={20} />
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${burnData.percentual}%` }} />
          </div>
        </section>

        {/* VULNERABILIDADE */}
        <section className="bg-red-950/10 border border-red-500/20 p-5 rounded-3xl flex items-center gap-4">
           <AlertTriangle className="text-red-500" size={20} />
           <div>
              <p className="text-[9px] font-black text-red-500 tracking-widest uppercase">Vigilância</p>
              <p className="text-[10px] text-zinc-400 normal-case">Continue registrando seus aportes para manter a precisão.</p>
           </div>
        </section>

      </div>
    </div>
  );
}
