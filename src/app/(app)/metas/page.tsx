"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MASTER_CATS = [
  { nome: "Alimentação", emoji: "🍔" },
  { nome: "Moradia", emoji: "🏠" },
  { nome: "Transporte", emoji: "🚗" },
  { nome: "Lazer", emoji: "🎬" },
  { nome: "Saúde", emoji: "💊" },
  { nome: "Educação", emoji: "📚" },
  { nome: "Assinaturas", emoji: "💳" },
  { nome: "Compras", emoji: "🛍" },
  { nome: "Outros", emoji: "⚡" },
];

export default function MetasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    loadMetas();
  }, []);

  async function loadMetas() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const { data } = await supabase.from("goals").select("*").eq("user_id", user.id);
    setMetas(data || []);
    setLoading(false);
  }

  async function handleSalvarLimite() {
    if (!valor || !catSel) return alert("Escolha a categoria e o valor!");
    
    // Limpeza rigorosa do valor para evitar erros de decimal no banco
    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    if (isNaN(valorNumerico)) return alert("Valor inválido");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Removemos qualquer limite existente dessa categoria ANTES para evitar erro de duplicidade
    await supabase.from("goals").delete().match({ user_id: user.id, category: catSel });

    // Inserção simples
    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      category: catSel,
      amount: valorNumerico
    });

    if (error) {
      console.error(error);
      alert("Erro técnico: Verifique se a tabela 'goals' aceita a categoria " + catSel);
    } else {
      setShowModal(false);
      setValor("");
      setCatSel("");
      loadMetas();
    }
  }

  if (loading) return null;

  return (
    <>
      <div className="flex flex-col gap-2 w-full md:col-span-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">LIMITES</h1>
            <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Gestão de Gastos</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-[9px] font-black uppercase text-zinc-500 border border-white/10 px-4 py-2 rounded-full">← Dashboard</button>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest mt-4 w-full">+ Definir Limite</button>
      </div>

      {/* LISTA: Borda 1.5rem e Padding superior aumentado para não cortar o título */}
      <div className="bg-[#111] pt-16 pb-10 px-8 rounded-[1.5rem] border border-white/5 w-full md:col-span-2">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter mb-10">Ativos no Mês</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metas.map((meta) => {
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());
            return (
              <div key={meta.id} className="bg-black/40 p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{catInfo?.emoji || "💰"}</span>
                  <div>
                    <p className="text-white font-black italic uppercase text-xs">{meta.category}</p>
                    <p className="text-zinc-500 text-[10px] font-bold">R$ {Number(meta.amount).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    await supabase.from("goals").delete().eq("id", meta.id);
                    loadMetas();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 active:scale-90 transition"
                >
                  <span className="text-xl font-bold">✕</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Borda 1.5rem e Padding PT-16 para o título não grudar na curva */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[1.5rem] pt-16 pb-10 px-8 border border-white/10 shadow-2xl text-white">
            <h2 className="text-2xl font-black italic uppercase text-white mb-8">Novo Limite</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-8 max-h-[220px] overflow-y-auto pr-2">
              {MASTER_CATS.map(c => (
                <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-3 rounded-xl border flex flex-col items-center transition-all ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black/40"}`}>
                  <span className="text-xl mb-1">{c.emoji}</span>
                  <span className="text-[7px] font-black uppercase text-white text-center">{c.nome}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 mb-10">
              <label className="text-[9px] font-black uppercase text-zinc-500 italic ml-1">Valor Mensal (R$)</label>
              <input type="text" inputMode="numeric" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-4xl font-black italic outline-none text-white focus:border-yellow-400" />
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={handleSalvarLimite} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition">Confirmar</button>
              <button onClick={() => setShowModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
