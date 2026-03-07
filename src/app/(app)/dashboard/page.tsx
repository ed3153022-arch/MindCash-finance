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

  // Cálculos de Resumo
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  const categoriasAtivas = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  // Função para definir a cor da barra de progresso
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-orange-500";
    return "bg-yellow-400";
  };

  if (loading) return null;

  return (
    <div className="w-full space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter italic">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/metas")} className="bg-[#111] border border-white/10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white">Metas 📈</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">+ Transação</button>
        </div>
      </div>

      {/* CARDS DE SALDO */}
      <div className="space-y-3">
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Saldo Disponível</p>
          <h2 className="text-3xl font-black italic text-white">R$ {saldo.toLocaleString('pt-BR')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] p-5 rounded-3xl border border-white/5">
            <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Saídas</p>
            <h2 className="text-xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</h2>
          </div>
          <div className="bg-[#111] p-5 rounded-3xl border border-white/5">
            <p className="text-green-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Entradas</p>
            <h2 className="text-xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</h2>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE ROSCA */}
      <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 flex flex-col items-center">
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#141414" strokeWidth="18" />
            <circle cx="80" cy="80" r="70" fill="none" 
              stroke={categoriasAtivas[0]?.cor || "#FF007A"} 
              strokeWidth="20" strokeDasharray="440" 
              strokeDashoffset={440 - (440 * porcentagemGeral) / 100} 
              strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic text-white">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">Gasto</span>
          </div>
        </div>
        <div className="flex gap-6 mt-8">
          {categoriasAtivas.map(c => <span key={c.nome} className="text-3xl">{c.emoji}</span>)}
        </div>
        <p className="mt-6 text-zinc-500 font-black text-[11px] uppercase tracking-tighter">
          <span className="text-white text-base">R$ {saídas.toLocaleString()}</span> de R$ {orcamentoTotal.toLocaleString()}
        </p>
      </div>

      {/* LIMITES POR CATEGORIA (BARRAS COLORIDAS) */}
      <div className="bg-[#111] p-8 rounded-[3rem] border border-white/5 space-y-8">
        <h3 className="text-xl font-black italic uppercase text-white">Limites por Categoria</h3>
        <div className="space-y-8">
          {metas.map(meta => {
            const gastoCat = transacoes
              .filter(t => t.type === "saida" && t.category === meta.category)
              .reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / meta.amount) * 100, 100);
            const catInfo = MASTER_CATS.find(c => c.nome === meta.category);

            return (
              <div key={meta.id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{catInfo?.emoji}</span>
                    <span className="text-xs font-black uppercase italic text-white">{meta.category}</span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-400">
                    R$ {gastoCat.toLocaleString()} / {meta.amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${getProgressColor(progresso)}`} 
                    style={{ width: `${progresso}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE REGISTRO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black italic uppercase text-white">Novo Registro</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 font-bold text-[10px] uppercase">Fechar X</button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-8 border border-white/5">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>

            {tipo === "saida" && (
              <div className="grid grid-cols-3 gap-2 mb-8">
                {categoriasAtivas.map(c => (
                  <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-4 rounded-2xl border transition-all ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black/40"}`}>
                    <div className="text-2xl mb-1">{c.emoji}</div>
                    <div className="text-[8px] font-black uppercase text-white">{c.nome}</div>
                  </button>
                ))}
              </div>
            )}

            <input type="number" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-black border border-white/10 p-6 rounded-2xl text-3xl font-black mb-8 outline-none text-white focus:border-yellow-400" />
            
            <button onClick={async () => {
              if(!valor || (tipo === 'saida' && !catSel)) return alert("Preencha tudo!");
              const { data: { user } } = await supabase.auth.getUser();
              await supabase.from("transactions").insert({
                user_id: user?.id,
                type: tipo,
                category: tipo === 'saida' ? catSel : 'Receita',
                amount: parseFloat(valor)
              });
              setShowModal(false);
              setValor("");
              loadData();
            }} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-xs shadow-lg shadow-yellow-400/20 active:scale-95 transition">Confirmar Registro</button>
          </div>
        </div>
      )}
    </div>
  );
}
