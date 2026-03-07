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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

      // CORREÇÃO AQUI: Limpa pontos de milhar e converte vírgula decimal em ponto
      // Ex: "2.000,50" -> "2000.50"
      const valorLimpo = valorMeta.toString().replace(/\./g, "").replace(",", ".");
      const valorNumerico = parseFloat(valorLimpo);

      if (isNaN(valorNumerico)) {
        alert("Por favor, insira um valor numérico válido.");
        setIsSaving(false);
        return;
      }

      const dataAtual = new Date().toISOString().split('T')[0];

      // PASSO 1: Deleta a meta antiga daquela categoria
      await supabase
        .from("goals")
        .delete()
        .eq("user_id", user.id)
        .eq("category", categoriaMeta);

      // PASSO 2: Insere com todos os campos obrigatórios
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        category: categoriaMeta,
        title: `Meta de ${categoriaMeta}`,
        amount: valorNumerico,
        type: "Mensal",
        month: dataAtual,
        current_amount: 0
      });

      if (error) throw error;
      
      setShowMetaModal(false);
      setValorMeta("");
      setCategoriaMeta("");
      await loadMetas(); 
      alert("Meta definida com sucesso!");

    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMeta = async (id: string) => {
    if (!confirm("Deseja excluir esta meta?")) return;
    await supabase.from("goals").delete().eq("id", id);
    loadMetas();
  };

  if (loading) return null;

  return (
    <div className="w-full space-y-10 pb-20 p-4">
      <div className="flex justify-between items-end mt-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">Metas</h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Limites Mensais</p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white">Voltar</button>
      </div>

      <div className="bg-[#111] p-6 rounded-[2.5rem] border border-white/5">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Meus Limites</h3>
          <button onClick={() => setShowMetaModal(true)} className="bg-yellow-400 text-black px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-yellow-400/20 active:scale-95 transition">+ Definir Meta</button>
        </div>

        <div className="space-y-3">
          {metas.length > 0 ? metas.map((meta) => (
            <div key={meta.id} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{CATEGORIAS_LISTA.find(c => c.nome === meta.category)?.icone || "💰"}</span>
                <div>
                  <p className="text-white font-black italic uppercase text-sm">{meta.category}</p>
                  <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Limite Mensal</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-black text-white italic">R$ {Number(meta.amount).toLocaleString('pt-BR')}</span>
                <button onClick={() => handleDeleteMeta(meta.id)} className="bg-red-500/10 text-red-500 p-2 rounded-lg text-[10px] font-black">✕</button>
              </div>
            </div>
          )) : (
            <p className="text-zinc-600 text-center py-10 font-black uppercase text-[10px] italic">Nenhuma meta definida</p>
          )}
        </div>
      </div>

      {showMetaModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black italic uppercase text-white mb-8 tracking-tighter">Novo Limite</h2>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 italic">1. Escolha a Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIAS_LISTA.map((cat) => (
                    <button
                      key={cat.nome}
                      onClick={() => setCategoriaMeta(cat.nome)}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
                        categoriaMeta === cat.nome 
                        ? "border-yellow-400 bg-yellow-400/10 scale-95" 
                        : "border-white/5 bg-black/40"
                      }`}
                    >
                      <span className="text-2xl">{cat.icone}</span>
                      <span className="text-[8px] font-black uppercase text-white text-center leading-tight">{cat.nome}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2 italic">2. Valor do Limite (R$)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0,00" 
                  value={valorMeta} 
                  onChange={(e) => setValorMeta(e.target.value)} 
                  className="w-full bg-black border border-white/10 rounded-2xl p-6 text-4xl font-black italic text-white outline-none focus:border-yellow-400" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowMetaModal(false)} className="flex-1 border border-white/10 text-zinc-500 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button 
                  onClick={handleSaveMeta} 
                  disabled={isSaving}
                  className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition"
                >
                  {isSaving ? "Gravando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
