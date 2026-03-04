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
};

const CATEGORIAS_PREDEFINIDAS = [
  { nome: "Moradia", icone: "🏠" },
  { nome: "Alimentação", icone: "🍔" },
  { nome: "Transporte", icone: "🚗" },
  { nome: "Entretenimento", icone: "🎬" },
  { nome: "Saúde", icone: "💊" },
  { nome: "Educação", icone: "📚" },
  { nome: "Assinaturas", icone: "💳" },
  { nome: "Compras", icone: "🛍" },
];

const TIPOS_META = [
  { nome: "Limite de Categoria", descricao: "Quanto posso gastar em uma categoria" },
  { nome: "Meta de Ganho", descricao: "Quanto quero ganhar no mês" },
  { nome: "Meta de Gasto Global", descricao: "Limite total de saídas do mês" },
];

export default function MetasPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [tipoSelecionado, setTipoSelecionado] = useState(TIPOS_META[0].nome);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(CATEGORIAS_PREDEFINIDAS[0]);
  const [valorLimite, setValorLimite] = useState("");

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setGoals(data);
    setLoading(false);
  }

  async function handleSaveGoal(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const agora = new Date();
      const dataParaOBanco = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;

      const payload = {
        user_id: user.id,
        type: tipoSelecionado,
        title: tipoSelecionado === "Limite de Categoria" ? categoriaSelecionada.nome : tipoSelecionado,
        category: tipoSelecionado === "Limite de Categoria" ? categoriaSelecionada.nome : null,
        amount: parseFloat(valorLimite),
        month: dataParaOBanco,
      };

      // Tenta atualizar se já existir a mesma categoria no mesmo mês (onConflict depende das constraints do seu banco)
      // Caso não queira risco de erro de constraint, o Dashboard tratará a soma de qualquer forma.
      const { error } = await supabase.from("goals").insert([payload]);

      if (error) {
        alert(`Erro técnico: ${error.message}`);
      } else {
        setShowModal(false);
        setValorLimite("");
        fetchGoals();
      }
    } catch (err) {
      alert("Erro ao processar o salvamento.");
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user?.id);
    if (!error) setGoals(prev => prev.filter(g => g.id !== id));
  }

  const getIcon = (goal: Goal) => {
    if (goal.type !== "Limite de Categoria") return "🎯";
    return CATEGORIAS_PREDEFINIDAS.find(c => c.nome === goal.category)?.icone || "💰";
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2 transition">
            ← Voltar ao Painel
          </button>
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter">Minhas Metas</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition shadow-lg shadow-yellow-400/20">
          + Configurar Nova Meta
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando banco...</p>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 bg-[#111111] rounded-[3rem] border border-dashed border-white/5">
          <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Nenhuma meta ativa para este período.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-[#111111] p-8 rounded-[3rem] border border-white/5 flex flex-col justify-between hover:border-white/20 transition duration-300">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="text-3xl bg-black p-4 rounded-2xl border border-white/5 shadow-inner">{getIcon(goal)}</span>
                  <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-gray-500 uppercase font-black tracking-widest italic border border-white/5">
                    {goal.type}
                  </span>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-1">{goal.title}</h3>
                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Valor planejado</p>
              </div>
              <div className="mt-10 flex justify-between items-end">
                <span className="text-2xl font-black text-yellow-400 italic tracking-tighter">
                  R$ {goal.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button onClick={() => deleteGoal(goal.id)} className="text-red-500/20 hover:text-red-500 transition-all p-2" title="Excluir">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl">
            <h2 className="text-3xl font-black mb-8 text-center italic uppercase tracking-tighter">Nova Definição</h2>
            
            <form onSubmit={handleSaveGoal} className="space-y-8">
              <div className="grid grid-cols-1 gap-3">
                {TIPOS_META.map((tipo) => (
                  <button
                    key={tipo.nome}
                    type="button"
                    onClick={() => setTipoSelecionado(tipo.nome)}
                    className={`p-5 rounded-2xl border text-left transition duration-300 ${tipoSelecionado === tipo.nome ? 'border-yellow-400 bg-yellow-400/5' : 'border-white/5 bg-black'}`}
                  >
                    <p className={`font-black uppercase text-[10px] tracking-widest ${tipoSelecionado === tipo.nome ? 'text-yellow-400' : 'text-white'}`}>{tipo.nome}</p>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">{tipo.descricao}</p>
                  </button>
                ))}
              </div>

              {tipoSelecionado === "Limite de Categoria" && (
                <div className="grid grid-cols-4 gap-3">
                  {CATEGORIAS_PREDEFINIDAS.map((cat) => (
                    <button
                      key={cat.nome}
                      type="button"
                      onClick={() => setCategoriaSelecionada(cat)}
                      className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${categoriaSelecionada.nome === cat.nome ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/5 bg-black'}`}
                    >
                      <span className="text-2xl mb-1">{cat.icone}</span>
                      <span className="text-[7px] truncate w-full text-center uppercase font-black tracking-tighter">{cat.nome}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] px-1">Valor do Objetivo</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  className="w-full bg-black border border-white/10 rounded-2xl p-6 focus:border-yellow-400 outline-none text-3xl font-black italic tracking-tighter text-yellow-400 transition"
                  placeholder="0,00"
                  value={valorLimite}
                  onChange={e => setValorLimite(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-yellow-400/10">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
