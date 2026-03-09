"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIAS_LISTA = [
  { nome: "Alimentação", icone: "🍔", cor: "#FF1493" },
  { nome: "Moradia", icone: "🏠", cor: "#FF4500" },
  { nome: "Transporte", icone: "🚗", cor: "#00CED1" },
  { nome: "Lazer", icone: "🎬", cor: "#32CD32" },
  { nome: "Saúde", icone: "💊", cor: "#FFA500" },
  { nome: "Assinaturas", icone: "💳", cor: "#FFD700" },
  { nome: "Compras", icone: "🛍", cor: "#8A2BE2" },
  { nome: "Outros", icone: "⚡", cor: "#7B61FF" },
];

export default function MetasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  
  const [categoriaMeta, setCategoriaMeta] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMetas();
  }, []);

  async function loadMetas() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase.from("goals").select("*").eq("user_id", user.id);
      setMetas(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleSaveMeta = async () => {
    if (!valorMeta || !categoriaMeta || isSaving) {
      alert("Selecione uma categoria e um valor!");
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const valorLimpo = valorMeta.toString().replace(/\./g, "").replace(",", ".");
      const valorNumerico = parseFloat(valorLimpo);
      const dataAtual = new Date().toISOString().split('T')[0];
      await supabase.from("goals").delete().eq("user_id", user.id).eq("category", categoriaMeta);
      await supabase.from("goals").insert({
        user_id: user.id,
        category: categoriaMeta,
        title: `Meta de ${categoriaMeta}`,
        amount: valorNumerico,
        type: "Mensal",
        month: dataAtual,
        current_amount: 0
      });
      setShowMetaModal(false);
      setValorMeta("");
      setCategoriaMeta("");
      await loadMetas(); 
    } catch (err: any) { alert("Erro: " + err.message); } finally { setIsSaving(false); }
  };

  const handleDeleteMeta = async (id: string) => {
    if (!confirm("Deseja excluir esta meta?")) return;
    await supabase.from("goals").delete().eq("id", id);
    loadMetas();
  };

  if (loading) return null;

  return (
    <>
      {/* HEADER - SOLTO */}
      <div className="flex justify-between items-end w-full px-2">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">LIMITES</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Teto de Gastos</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white tracking-widest active:scale-95 transition"
        >
          Voltar
        </button>
      </div>

      {/* CARD PRINCIPAL DE METAS - SOLTO */}
      <div className="bg-[#111] px-12 py-10 rounded-[3rem] border border-white/5 w-full">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Meus Limites</h3>
          <button 
            onClick={() => setShowMetaModal(true)} 
            className="bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[9px] uppercase shadow-xl shadow-yellow-400/10 active:scale-95 transition"
          >
            + Definir Meta
          </button>
        </div>

        <div className="space-y-6 w-full">
          {metas.length > 0 ? metas.map((meta) => (
            <div key={meta.id} className="flex justify-between items-center bg-black/30 p-6 rounded-[2rem] border border-white/5 w-full">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{CATEGORIAS_LISTA.find(c => c.nome === meta.category)?.icone || "💰"}</span>
                <div>
                  <p className="text-white font-black italic uppercase text-[11px] leading-none">{meta.category}</p>
                  <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mt-1.5">Mensal</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-base font-black text-white italic">R$ {Number(meta.amount).toLocaleString('pt-BR')}</span>
                <button 
                  onClick={() => handleDeleteMeta(meta.id)} 
                  className="bg-red-500/10 text-red-500 w-8 h-8 flex items-center justify-center rounded-xl text-lg font-black hover:bg-red-500/20 transition active:scale-95"
                >
                  ×
                </button>
              </div>
            </div>
          )) : (
            <p className="text-zinc-600 text-center py-12 font-black uppercase text-[10px] italic tracking-widest">Nenhuma meta definida</p>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {showMetaModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black italic uppercase text-white mb-8 tracking-tighter">Novo Limite</h2>
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 italic tracking-widest">1. Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIAS_LISTA.map((cat) => (
                    <button
                      key={cat.nome}
                      onClick={() => setCategoriaMeta(cat.nome)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 ${
                        categoriaMeta === cat.nome 
                        ? "border-yellow-400 bg-yellow-400/10" 
                        : "border-white/5 bg-black/40"
                      }`}
                    >
                      <span className="text-2xl">{cat.icone}</span>
                      <span className="text-[8px] font-black uppercase text-white text-center leading-tight">{cat.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 italic tracking-widest">2. Valor (R$)</label>
                <input 
                  type="text" inputMode="numeric" placeholder="0,00" value={valorMeta} 
                  onChange={(e) => setValorMeta(e.target.value)} 
                  className="w-full bg-black border border-white/10 rounded-3xl p-6 text-4xl font-black italic text-white outline-none focus:border-yellow-400 placeholder:opacity-20" 
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button onClick={handleSaveMeta} disabled={isSaving} className="w-full bg-yellow-400 text-black py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest active:scale-95 transition">
                  {isSaving ? "Gravando..." : "Confirmar Meta"}
                </button>
                <button onClick={() => setShowMetaModal(false)} className="w-full py-4 text-zinc-600 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
