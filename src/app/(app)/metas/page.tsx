"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Goal = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  amount: number;
  month: string | null;
};

export default function MetasPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setGoals(data);
    setLoading(false);
  }

  // Função para deletar (Exemplo de funcionalidade)
  async function deleteGoal(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (!error) setGoals(goals.filter(g => g.id !== id));
  }

  const totalEmMetas = goals.reduce((acc, goal) => acc + goal.amount, 0);

  return (
    <div className="bg-black text-white min-h-screen antialiased">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        {/* HEADER COM BOTÃO VOLTAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <button 
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 hover:text-white text-xs uppercase tracking-widest mb-2 transition flex items-center gap-2"
            >
              ← Voltar ao Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Suas Metas</h1>
            <p className="text-gray-500 text-sm">Planeje seu futuro financeiro e acompanhe o progresso.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-4 rounded-2xl font-bold transition shadow-lg shadow-yellow-400/20 whitespace-nowrap"
          >
            + Nova Meta
          </button>
        </div>

        {/* CARDS DE RESUMO DE METAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 ring-1 ring-white/5">
            <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Total Planejado</p>
            <h2 className="text-3xl font-bold text-white">R$ {totalEmMetas.toLocaleString()}</h2>
          </div>
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 ring-1 ring-white/5">
            <p className="text-yellow-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Metas Ativas</p>
            <h2 className="text-3xl font-bold text-white">{goals.length}</h2>
          </div>
        </div>

        {/* LISTAGEM / HISTÓRICO */}
        <div className="bg-[#111111] rounded-3xl border border-white/5 ring-1 ring-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-bold">Histórico de Metas</h3>
          </div>

          {loading ? (
            <div className="p-20 text-center text-gray-500 italic">Carregando metas...</div>
          ) : goals.length === 0 ? (
            <div className="p-20 text-center">
               <p className="text-gray-500 mb-4">Você ainda não definiu nenhuma meta.</p>
               <button onClick={() => setShowModal(true)} className="text-yellow-400 text-sm underline">Começar agora</button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {goals.map((goal) => (
                <div key={goal.id} className="p-6 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                          {goal.type}
                        </span>
                        {goal.category && (
                          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                            • {goal.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-semibold text-white group-hover:text-yellow-400 transition-colors">
                        {goal.title}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8">
                      <div className="text-right">
                        <p className="text-gray-500 text-[10px] uppercase font-bold">Valor Alvo</p>
                        <p className="text-xl font-mono font-bold text-white">R$ {goal.amount.toLocaleString()}</p>
                      </div>

                      {/* AÇÕES */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {/* Lógica de Editar */}}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                          title="Editar Meta"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => deleteGoal(goal.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition"
                          title="Excluir Meta"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 pb-10 text-center text-gray-600 text-[10px] tracking-[0.3em] uppercase">
          Foco e persistência geram resultados.
        </div>
      </div>

      {/* Aqui você chamará seu componente de Modal para adicionar/editar */}
      {/* {showModal && <GoalModal onClose={() => setShowModal(false)} onSave={fetchGoals} />} */}
    </div>
  );
}
