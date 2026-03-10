"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HistoricoPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [router]);

  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTransacoes(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const confirmacao = window.confirm("Deseja realmente excluir esta transação?");
    if (!confirmacao) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setTransacoes(transacoes.filter(t => t.id !== id));
    } catch (e) {
      alert("Erro ao excluir transação");
      console.error(e);
    }
  }

  if (loading) return null;

  return (
    <>
      {/* HEADER - md:col-span-2 para alinhar com o Dashboard */}
      <div className="flex justify-between items-end w-full px-2 md:col-span-2">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">ATIVIDADE</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Log de operações</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white tracking-widest active:scale-95 transition"
        >
          Voltar
        </button>
      </div>

      {/* LISTA DE TRANSAÇÕES - md:col-span-2 para foco total na leitura */}
      <div className="bg-[#111] px-12 py-10 rounded-[3rem] border border-white/5 w-full md:col-span-2">
        {/* No Desktop, podemos usar 2 colunas para o histórico se houver muitos itens, 
            mas o ideal para extrato é manter 1 coluna centralizada e larga para leitura clara */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {transacoes.length > 0 ? transacoes.map((t) => (
            <div key={t.id} className="flex justify-between items-center border-b border-white/5 pb-6 last:border-0 last:pb-0 gap-4">
              <div className="space-y-2 flex-1">
                <p className="text-white font-black italic uppercase text-[11px] leading-none tracking-tight">
                  {t.category}
                </p>
                <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-[0.2em]">
                  {new Date(t.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`text-sm font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleDelete(t.id)}
                  className="bg-red-500/10 text-red-500 w-8 h-8 flex items-center justify-center rounded-xl text-lg font-black hover:bg-red-500/20 transition active:scale-95"
                >
                  ×
                </button>
              </div>
            </div>
          )) : (
            <p className="text-zinc-600 text-center py-10 font-black uppercase text-[10px] italic tracking-widest">Vazio</p>
          )}
        </div>
      </div>
    </>
  );
}
