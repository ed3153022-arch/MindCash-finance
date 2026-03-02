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
    
    // 1️⃣ Correção: Garantindo que o loading pare mesmo sem usuário
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setGoals(data);
    setLoading(false);
  }

  async function deleteGoal(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2️⃣ Segurança Extra: Validando user_id no delete
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) {
      // 4️⃣ Performance: Usando callback para evitar estado stale
      setGoals(prev => prev.filter(g => g.id !== id));
    }
  }

  // 3️⃣ Blindagem: Garantindo que valores nulos não quebrem o reduce
  const totalEmMetas = goals.reduce(
    (acc, goal) => acc + (goal.amount || 0), 
    0
  );

  return (
    <div className="bg-black text-white min-h-screen antialiased font-sans">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <button 
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 hover:text-white text-xs uppercase tracking-[0.2em] mb-2 transition flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight italic">Minhas Metas</h1>
            <p className="text-gray-500 text-sm">Gerencie seus objetivos e limites financeiros.</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-2xl font-black transition shadow-[0_0_20px_rgba(250,204,21,0.15)] active:scale-95"
          >
            + Criar Meta
          </button>
        </div>

        {/* RESUMO RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111111] p-7 rounded-2xl border border-white/5 ring-1 ring-white/5">
            <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Total em Objetivos</p>
            <h2 className="text-4xl font-black text-white">R$ {totalEmMetas.toLocaleString()}</h2>
          </div>
          <div className="bg-[#111111] p-7 rounded-2xl border border-white/5 ring-1 ring-white/5">
            <p className="text-yellow-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Metas Ativas</p>
            <h2 className="text-4xl font-black text-white">{goals.length}</h2>
          </div>
        </div>

        {/* LISTA DE METAS */}
        <div className="bg-[#111111] rounded-[2rem] border border-white/5 ring-1 ring-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold">Histórico e Detalhes</h3>
            <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest font-bold">
              Organizado por data
            </span>
          </div>

          {loading ? (
            <div className="p-24 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-yellow-400 rounded-full mb-4" role="status"></div>
              <p className="text-gray-500 text-sm font-medium">Sincronizando com Supabase...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className="p-24 text-center">
               <div className="text-4xl mb-4 opacity-20">📈</div>
               <p className="text-gray-500 mb-6 font-medium">Nenhum plano traçado por aqui ainda.</p>
               <button onClick={() => setShowModal(true)} className="text-yellow-400 text-xs font-bold uppercase tracking-widest hover:text-white transition">Definir primeira meta</button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {goals.map((goal) => (
                <div key={goal.id} className="p-8 hover:bg-white/[0.01] transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 rounded text-[9px] uppercase font-black tracking-tighter">
                          {goal.type}
                        </span>
                        {goal.category && (
                          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight">
                            / {goal.category}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-white/90 group-hover:text-white transition-colors">
                        {goal.title}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-10">
                      <div className="text-right">
                        <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest mb-1">Montante Alvo</p>
                        <p className="text-2xl font-mono font-black text-white">
                          R$ {goal.amount?.toLocaleString() || "0,00"}
                        </p>
                      </div>

                      {/* AÇÕES DE GESTÃO */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {/* Lógica de Editar */}}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all active:scale-90"
                          title="Editar Meta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          onClick={() => deleteGoal(goal.id)}
                          className="p-3 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-500 transition-all active:scale-90"
                          title="Excluir Meta"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-20 pb-12 text-center">
          <p className="text-gray-700 text-[10px] tracking-[0.5em] uppercase font-bold">
            MindCash • Inteligência Financeira
          </p>
        </div>
      </div>
    </div>
  );
}
