"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MASTER_CATS = [
  { nome: "Alimentação", emoji: "🍔", cor: "#FF007A" },
  { nome: "Moradia", emoji: "🏠", cor: "#FF4D00" },
  { nome: "Transporte", emoji: "🚗", cor: "#00E5FF" },
  { nome: "Lazer", emoji: "🎬", cor: "#39FF14" },
  { nome: "Saúde", emoji: "💊", cor: "#FFB800" },
  { nome: "Educação", emoji: "📚", cor: "#4169E1" },
  { nome: "Assinaturas", emoji: "💳", cor: "#FFD700" },
  { nome: "Compras", emoji: "🛍", cor: "#8A2BE2" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

      const [m, t] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).gte("created_at", inicioMes)
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  const categoriasAtivas = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  const renderDonutChartSegments = () => {
    const raio = 70;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;

    if (saídas <= 0) {
      return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1a1a1a" strokeWidth="20" strokeDasharray={`${circunferencia} ${circunferencia}`} />;
    }

    return categoriasAtivas.map((cat) => {
      const gastoCat = transacoes
        .filter(t => t.type === "saida" && t.category?.toLowerCase() === cat.nome.toLowerCase())
        .reduce((acc, t) => acc + Number(t.amount), 0);

      if (gastoCat <= 0) return null;

      const percentual = gastoCat / saídas;
      const strokeDasharray = `${percentual * circunferencia} ${circunferencia}`;
      const strokeDashoffset = -acumulado * circunferencia;
      acumulado += percentual;

      return (
        <circle 
          key={cat.nome} cx="80" cy="80" r={raio} fill="none" 
          stroke={cat.cor} strokeWidth="20" strokeDasharray={strokeDasharray} 
          strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" 
        />
      );
    });
  };

  if (loading) return null;

  return (
    // space-y-8 garante o respiro IGUAL entre todos os blocos do dashboard
    <div className="w-full space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">DASHBOARD</h1>
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic">Inteligência Financeira</p>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition">Metas 📈</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition">+ Transação</button>
        </div>
      </div>

      {/* CARDS DE SALDO - Agora todos um embaixo do outro para evitar corte de texto */}
      <div className="flex flex-col gap-4 w-full">
        {/* Card Saldo */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 w-full">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
          <h2 className="text-4xl font-black italic text-white break-words">R$ {saldo.toLocaleString('pt-BR')}</h2>
        </div>
        
        {/* Card Saídas - Removida a Grid para não apertar o texto */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 w-full">
          <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Saídas</p>
          <h2 className="text-3xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</h2>
        </div>

        {/* Card Entradas */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 w-full">
          <p className="text-green-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Entradas</p>
          <h2 className="text-3xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      {/* GRÁFICO DE ROSCA */}
      <div className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center w-full">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 self-start italic">Uso do Orçamento</span>
        
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {renderDonutChartSegments()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic text-white leading-none">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic mt-2">Gasto</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {categoriasAtivas.map(c => (
            <div key={c.nome} className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.cor }} />
              <span className="text-3xl">{c.emoji}</span>
            </div>
          ))}
        </div>

        <p className="text-zinc-500 font-black text-[11px] uppercase italic tracking-tight">
          <span className="text-white text-base">R$ {saídas.toLocaleString('pt-BR')}</span> DE R$ {orcamentoTotal.toLocaleString('pt-BR')}
        </p>
      </div>

      {/* LIMITES POR CATEGORIA */}
      <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 space-y-8 w-full">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Limites por Categoria</h3>
        <div className="space-y-8">
          {metas.map(meta => {
            const gastoCat = transacoes
              .filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase())
              .reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / Number(meta.amount)) * 100, 100);
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());

            const getProgressColor = (percent: number) => {
              if (percent >= 90) return "bg-red-500";
              if (percent >= 70) return "bg-orange-500";
              return "bg-yellow-400";
            };

            return (
              <div key={meta.id} className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{catInfo?.emoji}</span>
                    <span className="text-xs font-black uppercase italic text-white">{meta.category}</span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 italic">
                    R$ {gastoCat.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-1000 ${getProgressColor(progresso)}`} style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* O Modal permanece igual, mas com paddings ajustados internamente se necessário */}
    </div>
  );
}
