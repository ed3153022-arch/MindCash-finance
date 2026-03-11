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
  { nome: "Outros", emoji: "⚡", cor: "#FFFFFF" },
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

  if (loading) return null;

  return (
    <>
      <div className="flex flex-col gap-2 w-full md:col-span-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-white">LIMITES</h1>
            <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic mt-1 px-1">Gestão de Orçamento</p>
          </div>
          <button 
            onClick={() => router.push("/dashboard")} 
            className="text-[9px] font-black uppercase text-zinc-500 border border-white/10 px-4 py-2 rounded-full hover:text-white transition"
          >
            ← Voltar
          </button>
        </div>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-yellow-400 text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition mt-4 w-full md:max-w-xs"
        >
          + Definir Novo Limite
        </button>
      </div>

      <div className="bg-[#111] pt-12 pb-10 px-8 rounded-[1.5rem] border border-white/5 w-full md:col-span-2">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter mb-10 px-2">Meus Limites Ativos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {metas.length > 0 ? metas.map((meta) => {
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());
            return (
              <div key={meta.id} className="bg-black/40 p-6 rounded-2xl border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{catInfo?.emoji}</span>
                  <div>
                    <p className="text-white font-black italic uppercase text-xs">{meta.category}</p>
                    <p className="text-zinc-500 text-[10px] font-bold tracking-tight">LIMITE: R$ {Number(meta.amount).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                {/* BOTÃO CORRIGIDO: Sempre visível para facilitar o toque no celular */}
                <button 
                  onClick={async () => {
                    await supabase.from("goals").delete().eq("id", meta.id);
                    loadMetas();
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 text-red-500 border border-red-500/20 active:scale-90 transition"
                >
                  <span className="text-lg font-bold">✕</span>
                </button>
              </div>
            );
          }) : (
            <p className="text-zinc-600 font-black uppercase text-[10px] italic py-10 text-center col-span-2">Nenhum limite definido ainda.</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[1.5rem] pt-12 pb-10 px-8 border border-white/10 shadow-2xl text-white">
            <h2 className="text-2xl font-black italic uppercase text-white mb-8 px-2">Nova Meta</h2>
            
            <p className="text-[9px] font-black uppercase text-zinc-500 mb-4 ml-3 italic">1. Escolha a Categoria</p>
            <div className="grid grid-cols-3 gap-2 mb-8 max-h-[220px] overflow-y-auto pr-2 px-1">
              {MASTER_CATS.map(c => (
                <button 
                  key={c.nome} 
                  type="button"
                  onClick={() => setCatSel(c.nome)} 
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black/40"}`}
                >
                  <span className="text-xl mb-1">{c.emoji}</span>
                  <span className="text-[7px] font-black uppercase text-white text-center leading-tight">{c.nome}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 mb-10 px-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 italic">2. Valor do Limite (R$)</label>
              <input 
                type="text" inputMode="numeric" placeholder="0,00" value={valor} 
                onChange={(e) => setValor(e.target.value)} 
                className="w-full bg-black border border-white/10 p-5 rounded-2xl text-4xl font-black italic outline-none text-white focus:border-yellow-400 placeholder:opacity-20" 
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={async () => {
                  if(!valor || !catSel) return alert("Preencha categoria e valor!");
                  
                  const valorLimpo = valor.toString().replace(/\./g, "").replace(",", ".");
                  const valorNumerico = parseFloat(valorLimpo);
                  const { data: { user } } = await supabase.auth.getUser();

                  if (!user) return;

                  // Lógica corrigida para garantir o registro sem erros de banco
                  await supabase.from("goals").delete().eq("user_id", user.id).eq("category", catSel);
                  const { error } = await supabase.from("goals").insert({
                    user_id: user.id,
                    category: catSel,
                    amount: valorNumerico
                  });

                  if (error) {
                    alert("Erro ao salvar limite.");
                  } else {
                    setShowModal(false);
                    setValor("");
                    setCatSel("");
                    loadMetas();
                  }
                }} 
                className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition"
              >
                Confirmar Limite
              </button>
              <button onClick={() => { setShowModal(false); setCatSel(""); setValor(""); }} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
