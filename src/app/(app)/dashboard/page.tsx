"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIAS_LISTA = [
  { nome: "Alimentação", emoji: "🍔", cor: "#FF007A" },
  { nome: "Moradia", emoji: "🏠", cor: "#FF4D00" },
  { nome: "Transporte", emoji: "🚗", cor: "#00E5FF" },
  { nome: "Lazer", emoji: "🎬", cor: "#39FF14" },
  { nome: "Saúde", emoji: "💊", cor: "#FFB800" },
  { nome: "Outros", emoji: "⚡", cor: "#7B61FF" },
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
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase.from("goals").select("*").eq("user_id", user.id);
      const { data: t } = await supabase.from("transactions").select("*").eq("user_id", user.id);

      setMetas(m || []);
      setTransacoes(t || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const saídas = transacoes.filter(t => t.type === "saida").reduce((a, b) => a + b.amount, 0);
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((a, b) => a + b.amount, 0);
  const orcamentoTotal = metas.reduce((a, b) => a + (b.amount || b.target_amount || 0), 0) || 1;
  const porcentagem = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  // Filtra categorias do modal: apenas as que têm meta
  const categoriasFiltradas = CATEGORIAS_LISTA.filter(c => 
    metas.some(m => m.category?.toLowerCase() === c.nome.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="w-full space-y-8 pb-20">
      <div className="flex flex-col gap-6">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">DASHBOARD</h1>
        <div className="flex gap-3">
          <button onClick={() => router.push("/metas")} className="flex-1 bg-[#111] border border-white/10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Metas 📈</button>
          <button onClick={() => setShowModal(true)} className="flex-1 bg-yellow-400 text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">+ Transação</button>
        </div>
      </div>

      <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5">
        <p className="text-zinc-500 text-[10px] font-black uppercase mb-2">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic">R$ {(entradas - saídas).toLocaleString()}</h2>
      </div>

      {/* GRÁFICO CORRIGIDO */}
      <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 flex flex-col items-center">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a1a" strokeWidth="20" />
            <circle cx="80" cy="80" r="70" fill="none" stroke={categoriasFiltradas[0]?.cor || "#FF007A"} strokeWidth="20" 
              strokeDasharray="440" strokeDashoffset={440 - (440 * porcentagem) / 100} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black italic">{porcentagem}%</span>
            <span className="text-[10px] text-zinc-500 font-black">GASTO</span>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          {categoriasFiltradas.map(c => <span key={c.nome} className="text-2xl">{c.emoji}</span>)}
        </div>
      </div>

      {/* MODAL COM BOTÕES (SEM SELECT) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10">
            <h2 className="text-2xl font-black italic uppercase mb-6">Novo Registro</h2>
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-xl mb-6">
              <button onClick={() => setTipo("saida")} className={`py-2 rounded-lg font-black text-[10px] uppercase ${tipo === "saida" ? "bg-red-500" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-2 rounded-lg font-black text-[10px] uppercase ${tipo === "entrada" ? "bg-green-500" : "text-zinc-500"}`}>Entrada</button>
            </div>
            {tipo === "saida" && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {categoriasFiltradas.map(c => (
                  <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-3 rounded-xl border ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5"}`}>
                    <div className="text-xl">{c.emoji}</div>
                    <div className="text-[8px] font-black uppercase mt-1">{c.nome}</div>
                  </button>
                ))}
              </div>
            )}
            <input type="number" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl text-2xl font-black mb-6 outline-none text-white" />
            <button onClick={() => setShowModal(false)} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-black uppercase text-[11px]">Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
}
