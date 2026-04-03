"use client";

import { useEffect, useState } from "react";
import { useRouter } from "navigation";
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

      // REMOVIDO: Filtro de início de mês para carregar TODO O PERÍODO
      const [m, t] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }) // Carrega todas, das mais novas para as mais antigas
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Cálculos baseados no array total de transações
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  
  // Orçamento total (metas acumuladas)
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  const categoriasAtivas = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  const renderDonutChartSegments = () => {
    const raio = 70;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;
    if (saídas <= 0) return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1a1a1a" strokeWidth="20" />;

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
          strokeDashoffset={strokeDashoffset} strokeLinecap="round"
        />
      );
    });
  };

  if (loading) return null;

  return (
    <>
      <div className="flex flex-col gap-2 w-full md:col-span-2">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-white">DASHBOARD</h1>
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Inteligência Financeira Total</p>
        
        <div className="grid grid-cols-2 gap-3 mt-4 md:max-w-sm">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition text-white">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition">+ Nova Transação</button>
        </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full md:col-span-2">
        <div className="px-2"> 
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Acumulado (Todo Período)</p>
          <h2 className="text-4xl font-black italic text-white break-words">R$ {saldo.toLocaleString('pt-BR')}</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 w-full">
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full">
            <div className="px-2">
              <p className="text-green-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Entradas Totais</p>
              <h2 className="text-3xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</h2>
            </div>
          </div>
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full">
            <div className="px-2">
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saídas Totais</p>
              <h2 className="text-3xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</h2>
            </div>
          </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center w-full">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 self-start italic px-2">Uso do Orçamento Total</span>
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={70} fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {renderDonutChartSegments()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic text-white leading-none">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic mt-2">Gasto</span>
          </div>
        </div>
        
        <p className="text-zinc-500 font-black text-[11px] uppercase italic tracking-tight text-center px-2">
          <span className="text-white text-base">R$ {saídas.toLocaleString('pt-BR')}</span> GASTOS NO TOTAL
        </p>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-10 w-full">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter px-2">Limites por Categoria (Geral)</h3>
        <div className="space-y-10 px-2">
          {metas.map(meta => {
            const gastoCat = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase()).reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / Number(meta.amount)) * 100, 100);
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());
            return (
              <div key={meta.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase italic text-white">{catInfo?.emoji} {meta.category}</span>
                  <span className="text-[10px] font-black text-zinc-400">R$ {gastoCat.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-1000 ${progresso >= 90 ? "bg-red-500" : "bg-yellow-400"}`} style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-8 w-full md:col-span-2">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Atividade Histórica</h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Últimos Movimentos</span>
        </div>
        <div className="space-y-4 px-2">
          {transacoes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transacoes.slice(0, 4).map((t) => {
                  const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === t.category?.toLowerCase());
                  return (
                    <div key={t.id} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{t.type === 'entrada' ? "💰" : (catInfo?.emoji || "💸")}</span>
                        <div>
                          <p className="text-white font-black italic uppercase text-[10px] leading-none">{t.category}</p>
                          <p className="text-zinc-600 text-[8px] font-bold uppercase mt-1">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-white'}`}>
                        {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => router.push("/historico")} className="w-full py-5 mt-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white tracking-[0.2em]">
                Ver histórico completo →
              </button>
            </>
          ) : (
            <p className="text-zinc-600 text-center py-6 font-black uppercase text-[10px] italic">Nenhum registro ainda</p>
          )}
        </div>
      </div>

      {/* O Modal permanece o mesmo, chamando loadData() que agora atualiza o histórico total */}
      {/* ...restante do código (modais)... */}
    </>
  );
}
