"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ trans: [], lims: [] });

  // 1. Garante que o componente está montado no cliente antes de renderizar
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const [tRes, lRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        setData({ trans: tRes.data || [], lims: lRes.data || [] });
      } catch (e) {
        console.error("Erro Supabase:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [mounted, router]);

  // 2. Cálculos protegidos (se data for nulo, não quebra)
  const stats = useMemo(() => {
    const t = data?.trans || [];
    const l = data?.lims || [];
    
    const saídas = t.filter((item: any) => item.type === 'withdrawal');
    const totalSaidas = saídas.reduce((acc: number, item: any) => acc + Math.abs(item.amount), 0) || 1;
    
    // Alocação simplificada
    const poderVol = t.filter((item: any) => ["Investimentos", "Reserva", "Aportes"].includes(item.category))
                    .reduce((acc: number, item: any) => acc + Math.abs(item.amount), 0);
    
    return {
      poder: Math.round((poderVol / totalSaidas) * 100) || 0,
      consistencia: Math.min(100, t.length * 2),
      dias: 15 // Placeholder fixo para teste
    };
  }, [data]);

  // Se não estiver montado ou estiver carregando, mostra apenas o loader limpo
  if (!mounted || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="text-yellow-400 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter">
      <div className="space-y-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-white/10 pb-4">
          <div>
            <h1 className="text-5xl font-black italic leading-none">VEREDITO</h1>
            <p className="text-[9px] text-zinc-500 font-bold tracking-[0.3em] mt-1">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={20} />
        </header>

        {/* STATUS PRINCIPAL */}
        <section className="p-6 rounded-3xl border border-white/5 bg-zinc-900/30 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-5xl font-black italic mb-2 text-yellow-400">ANALISADO</h2>
            <p className="text-[10px] text-zinc-400 font-medium normal-case leading-tight">
              O sistema processou seus dados. Sua autonomia está em nível estável.
            </p>
          </div>
          <BrainCircuit className="absolute -right-6 -bottom-6 text-white/5" size={100} />
        </section>

        {/* MÉTRICAS EM GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
            <span className="text-[8px] font-black text-zinc-500 tracking-widest">AUTONOMIA</span>
            <h3 className="text-3xl font-black italic mt-1">{stats.dias} DIAS</h3>
          </div>
          <div className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
            <span className="text-[8px] font-black text-zinc-500 tracking-widest">PODER</span>
            <h3 className="text-3xl font-black italic mt-1">{stats.poder}%</h3>
          </div>
        </div>

        {/* DISTRIBUIÇÃO SIMPLIFICADA */}
        <section className="bg-zinc-950 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BatteryCharging className="text-zinc-500" size={12} />
            <span className="text-[8px] font-black text-zinc-500 tracking-widest">FLUXO DE CAIXA</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 transition-all duration-1000" 
              style={{ width: `${stats.poder}%` }} 
            />
          </div>
        </section>

        {/* SELOS DE PERFORMANCE */}
        <section className="bg-zinc-950 p-4 rounded-3xl border border-white/5 flex justify-around">
          <Shield size={20} className="text-zinc-700" />
          <ShieldCheck size={20} className="text-zinc-700" />
          <Trophy size={20} className="text-zinc-700" />
          <Crown size={20} className="text-zinc-700" />
        </section>

        {/* ALERTA DE VULNERABILIDADE */}
        <section className="bg-red-950/10 border border-red-500/20 p-5 rounded-3xl flex items-center gap-4">
           <AlertTriangle className="text-red-500 shrink-0" size={20} />
           <div>
              <p className="text-[9px] font-black text-red-500 tracking-widest mb-0.5">VIGILÂNCIA ATIVA</p>
              <p className="text-[10px] text-zinc-400 normal-case leading-tight">Mantenha os registros atualizados para evitar pontos cegos.</p>
           </div>
        </section>

      </div>
    </div>
  );
}
