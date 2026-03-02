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

  // Estados para o formulário da nova meta
  const [newGoal, setNewGoal] = useState({ title: "", amount: "", type: "Economia", category: "" });

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const { data: { user } } = await supabase.auth.getUser();
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

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("goals").insert([
      { 
        title: newGoal.title, 
        amount: parseFloat(newGoal.amount), 
        type: newGoal.type, 
        category: newGoal.category, 
        user_id: user.id 
      }
    ]);

    if (!error) {
      setShowModal(false);
      setNewGoal({ title: "", amount: "", type: "Economia", category: "" });
      fetchGoals();
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("Tem certeza?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) setGoals(prev => prev.filter(g => g.id !== id));
  }

  const totalEmMetas = goals.reduce((acc, goal) => acc + (goal.amount || 0), 0);

  return (
    <div className="bg-black text-white min-h-screen antialiased">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <button 
              onClick={() => router.push("/dashboard")}
              className="text-gray-500 hover:text-white text-xs uppercase tracking-widest mb-2 flex items-center gap-2"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight">Minhas Metas</h1>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-bold transition w-full md:w-auto text-sm"
          >
            + Criar Meta
          </button>
        </div>

        {/* CARDS RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 ring-1 ring-white/5">
            <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">Total Planejado</p>
            <h2 className="text-2xl font-bold">R$ {totalEmMetas.toLocaleString()}</h2>
          </div>
          <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 ring-1 ring-white/5">
            <p className="text-yellow-500 text-[10px] uppercase font-bold mb-2">Quantidade</p>
            <h2 className="text-2xl font-bold">{goals.length}</h2>
          </div>
        </div>

        {/* LISTA DE METAS */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 ring-1 ring-white/5 overflow-hidden">
          {loading ? (
            <p className="p-10 text-center text-gray-500">Carregando...</p>
          ) : (
            <div className="divide-y divide-white/5">
              {goals.map((goal) => (
                <div key={goal.id} className="p-5 md:p-6 hover:bg-white/[0.02]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase font-bold">
                        {goal.type}
                      </span>
                      <h3 className="text-lg font-bold mt-1 break-words">{goal.title}</h3>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-xl font-mono font-bold">R$ {goal.amount?.toLocaleString()}</p>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} className="p-2 text-gray-500 hover:text-red-500 transition">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO (Sempre em cima de tudo) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Nova Meta</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold px-1">Título</label>
                <input 
                  required
                  className="w-full bg-black border border-white/10 rounded-xl p-3 mt-1 focus:border-yellow-400 outline-none transition"
                  placeholder="Ex: Reserva de Emergência"
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold px-1">Valor (R$)</label>
                <input 
                  required
                  type="number"
                  className="w-full bg-black border border-white/10 rounded-xl p-3 mt-1 focus:border-yellow-400 outline-none transition"
                  placeholder="0.00"
                  value={newGoal.amount}
                  onChange={e => setNewGoal({...newGoal, amount: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-gray-400 hover:text-white font-semibold transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-300 transition"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
