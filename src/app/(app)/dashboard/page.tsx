"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Hourglass, Zap, X, Trash2 } from "lucide-react";

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
  const [transacoesTudo, setTransacoesTudo] = useState<any[]>([]); // Para Saldo Total
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [ignoredExpenses, setIgnoredExpenses] = useState<string[]>([]);
  const [showFixedModal, setShowFixedModal] = useState(false);
  
  const [newFixed, setNewFixed] = useState({ name: '', amount: '', due_date: '' });
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

      // Buscamos TODAS as transações para o Saldo e Histórico
      const [m, t, f] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }), // Sem filtro de data inicial aqui
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id).order("due_day", { ascending: true })
      ]);

      setMetas(m.data || []);
      setTransacoesTudo(t.data || []);
      setFixedExpenses(f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Cálculos de Tempo para Gráfico e Limites (Mês Atual)
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const transacoesMes = transacoesTudo.filter(t => {
    const dataT = new Date(t.created_at);
    return dataT.getMonth() === mesAtual && dataT.getFullYear() === anoAtual;
  });

  // 1. SALDO TOTAL (Histórico completo)
  const entradasTotal = transacoesTudo.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saidasTotal = transacoesTudo.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldoDisponivel = entradasTotal - saidasTotal;

  // 2. ENTRADAS/SAÍDAS DO MÊS (Para os cards menores)
  const entradasMes = transacoesMes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saidasMes = transacoesMes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);

  // 3. GRÁFICO (Baseado no orçamento e gastos do mês)
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saidasMes / orcamentoTotal) * 100), 100);

  const maskDate = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{4})(\d+?)$/, "$1");
  };

  if (loading) return null;

  return (
    <>
      {/* NOTIFICAÇÕES (Omitidas aqui para focar no seu pedido, mas mantidas na lógica) */}
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 w-full md:col-span-2">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4 md:max-w-sm">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase text-white">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase">+ Nova Transação</button>
        </div>
      </div>

      {/* CARD SALDO ATUAL (Agora pegando tudo) */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full md:col-span-2">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível (Total)</p>
        <h2 className="text-4xl font-black italic text-white">R$ {saldoDisponivel.toLocaleString('pt-BR')}</h2>
      </div>

      {/* CARDS ENTRADAS E SAÍDAS DO MÊS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 w-full">
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5">
          <p className="text-green-500 text-[9px] font-black uppercase italic">Entradas (Mês)</p>
          <h2 className="text-2xl font-black italic text-green-500">R$ {entradasMes.toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111] p-8 rounded-[1.5rem] border border-white/5">
          <p className="text-red-500 text-[9px] font-black uppercase italic">Saídas (Mês)</p>
          <h2 className="text-2xl font-black italic text-red-500">R$ {saidasMes.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      {/* GRÁFICO (Uso do Orçamento do Mês) */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center w-full">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest self-start italic">Uso do Orçamento Mensal</span>
        <div className="relative w-64 h-64 flex items-center justify-center my-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a1a" strokeWidth="18" />
              <circle 
                cx="80" cy="80" r="70" fill="none" stroke="#FF007A" strokeWidth="18" 
                strokeDasharray={`${(porcentagemGeral / 100) * 440} 440`} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-6xl font-black italic text-white">{porcentagemGeral}%</span>
              <span className="text-[10px] text-zinc-500 font-black uppercase italic">Gasto</span>
            </div>
        </div>
      </div>

      {/* LIMITES POR CATEGORIA (Mês Atual) */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-10 w-full">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Limites por Categoria</h3>
        <div className="space-y-8">
          {metas.map(meta => {
            const gastoCat = transacoesMes.filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase()).reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / Number(meta.amount)) * 100, 100);
            return (
              <div key={meta.id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase italic text-white">{meta.category}</span>
                  <span className="text-[10px] font-black text-zinc-400">R$ {gastoCat.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-yellow-400" style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATIVIDADE (Ajustado para aparecer as 3 últimas) */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-8 w-full md:col-span-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Atividade</h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase italic">Recentes</span>
        </div>
        <div className="space-y-4">
          {transacoesTudo.slice(0, 3).map((t) => ( // Pega as 3 primeiras do array ordenado por data
            <div key={t.id} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{t.type === 'entrada' ? "💰" : "💸"}</span>
                <div>
                  <p className="text-white font-black italic uppercase text-[10px]">{t.category}</p>
                  <p className="text-zinc-600 text-[8px] font-bold mt-1">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <span className={`text-sm font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-white'}`}>
                {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR')}
              </span>
            </div>
          ))}
          <button onClick={() => router.push("/historico")} className="w-full py-5 mt-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest active:scale-95 transition">
            Ver atividade Completa →
          </button>
        </div>
      </div>
    </>
  );
}
