"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIAS_LISTA = [
  { nome: "Alimentação", icone: "🍔", cor: "#FF1493" },
  { nome: "Moradia", icone: "🏠", cor: "#FF4500" },
  { nome: "Transporte", icone: "🚗", cor: "#00CED1" },
  { nome: "Entretenimento", icone: "🎬", cor: "#32CD32" },
  { nome: "Saúde", icone: "💊", cor: "#FFA500" },
  { nome: "Educação", icone: "📚", cor: "#4169E1" },
  { nome: "Assinaturas", icone: "💳", cor: "#FFD700" },
  { nome: "Compras", icone: "🛍", cor: "#8A2BE2" },
];

export default function MetasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  
  // Estados para nova meta
  const [categoriaMeta, setCategoriaMeta] = useState("Alimentação");
  const [valorMeta, setValorMeta] = useState("");

  useEffect(() => {
    loadMetas();
  }, []);

  async function loadMetas() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id);

      setMetas(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveMeta = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !valorMeta) return;

      const { error } = await supabase.from("goals").upsert({
        user_id: user.id,
        category: categoriaMeta,
        amount: parseFloat(valorMeta.replace(",", ".")),
        type: "Limite de Categoria"
      }, { onConflict: 'user_id, category' });

      if (error) throw error;
      
      setShowMetaModal(false);
      setValorMeta("");
      loadMetas();
    } catch (err) {
      alert("Erro ao salvar meta");
    }
  };

  const handleDeleteMeta = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    loadMetas();
  };

  if (loading) return null;

  return (
    <div className="w-full space-y-10 pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">Metas</h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Defina seus Limites</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white"
        >
          Voltar
        </button>
      </div>

      {/* LISTA DE METAS ATUAIS */}
      <div className="bg-[#111] p-8 rounded-[3rem] border border-white/5">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black italic uppercase text-white">Meus Limites</h3>
          <button 
            onClick={() => setShowMetaModal(true)}
            className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-400/20"
          >
            + Definir Meta
          </button>
        </div>

        <div className="space-y-4">
          {metas.length > 0 ? metas.map((meta) => (
            <div key={meta.id} className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-3xl">
                  {CATEGORIAS_LISTA.find(c => c.nome === meta.category)?.icone || "💰"}
                </span>
                <div>
                  <p className="text-white font-black italic uppercase">{meta.category}</p>
                  <p className="text-gray-500 text-[10px] font-bold">LIMITE MENSAL</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-6">
                <span className="text-xl font-black text-white italic">R$ {meta.amount.toLocaleString()}</span>
                <button onClick={() => handleDeleteMeta(meta.id)} className="text-red-500 font-black text-[10px] uppercase">Excluir</button>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-10 font-black uppercase text-[10px]">Nenhuma meta definida ainda.</p>
          )}
        </div>
      </div>

      {/* MODAL PARA CRIAR META */}
      {showMetaModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] p-10 border border-white/10">
            <h2 className="text-3xl font-black italic uppercase text-white mb-8">Definir Limite</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Categoria</label>
                <select 
                  value={categoriaMeta} 
                  onChange={(e) => setCategoriaMeta(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black italic outline-none"
                >
                  {CATEGORIAS_LISTA.map(cat => <option key={cat.nome} value={cat.nome} className="bg-black">{cat.icone} {cat.nome}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-2">Valor do Limite (R$)</label>
                <input 
                  type="number" 
                  placeholder="0,00" 
                  value={valorMeta} 
                  onChange={(e) => setValorMeta(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-4xl font-black italic text-white outline-none" 
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowMetaModal(false)} className="flex-1 border border-white/10 text-white py-5 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                <button onClick={handleSaveMeta} className="flex-1 bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px]">Salvar Meta</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
