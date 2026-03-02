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

      // SOLUÇÃO PARA O ERRO DE DATA:
      // Criamos uma data válida (AAAA-MM-DD) para o banco aceitar o campo 'month'
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const dataParaOBanco = `${ano}-${mes}-01`; // Formato: 2026-03-01

      const payload = {
        user_id: user.id,
        type: tipoSelecionado,
        title: tipoSelecionado === "Limite de Categoria" ? categoriaSelecionada.nome : tipoSelecionado,
        category: tipoSelecionado === "Limite de Categoria" ? categoriaSelecionada.nome : null,
        amount: parseFloat(valorLimite),
        month: dataParaOBanco, // Enviando data real em vez de texto
      };

      // Removemos o campo 'icon' pois ele não existe no seu schema
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

  // Lógica visual para ícones sem precisar da coluna no banco
  const getIcon = (goal: Goal) => {
    if (goal.type !== "Limite de Categoria") return "💰";
    return CATEGORIAS_PREDEFINIDAS.find(c => c.nome === goal.category)?.icone || "🎯";
  };

  return (
    <div className="bg-black text-white min-h-screen antialiased">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <button onClick={() => router.push("/dashboard")} className="text-gray-500 hover:text-white text-xs uppercase tracking-widest mb-2 flex items-center gap-2 transition">
              ← Dashboard
            </button>
            <h1 className="text-3xl font-extrabold italic tracking-tight">Metas e Planejamento</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-2xl font-bold transition w-full md:w-auto active:scale-95 shadow-lg shadow-yellow-400/20">
            + Configurar Nova Meta
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10 font-mono animate-pulse">Sincronizando banco...</p>
        ) : goals.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-[2rem] border border-dashed border-white/10">
            <p className="text-gray-500">Nenhuma meta ativa para este período.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-[#111111] p-7 rounded-[2.5rem] border border-white/5 ring-1 ring-white/5 flex flex-col justify-between hover:ring-white/10 transition duration-300">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl bg-black/40 p-2 rounded-xl border border-white/5 shadow-inner">{getIcon(goal)}</span>
                    <span className="text-[9px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase font-black tracking-widest italic border border-white/5">
                      {goal.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{goal.title}</h3>
                  <p className="text-gray-500 text-xs">Valor planejado</p>
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <span className="text-2xl font-mono font-black text-yellow-400 drop-shadow-sm">
                    R$ {goal.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => deleteGoal(goal.id)} className="text-red-500/30 hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-xl" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 text-center italic">Nova Definição</h2>
            
            <form onSubmit={handleSaveGoal} className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {TIPOS_META.map((tipo) => (
                  <button
                    key={tipo.nome}
                    type="button"
                    onClick={() => setTipoSelecionado(tipo.nome)}
                    className={`p-4 rounded-2xl border text-left transition duration-300 ${tipoSelecionado === tipo.nome ? 'border-yellow-400 bg-yellow-400/5 shadow-[0_0_15px_rgba(250,204,21,0.05)]' : 'border-white/5 bg-black hover:border-white/20'}`}
                  >
                    <p className={`font-bold ${tipoSelecionado === tipo.nome ? 'text-yellow-400' : 'text-white'}`}>{tipo.nome}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{tipo.descricao}</p>
                  </button>
                ))}
              </div>

              {tipoSelecionado === "Limite de Categoria" && (
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIAS_PREDEFINIDAS.map((cat) => (
                    <button
                      key={cat.nome}
                      type="button"
                      onClick={() => setCategoriaSelecionada(cat)}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${categoriaSelecionada.nome === cat.nome ? 'border-yellow-400 bg-yellow-400/10 scale-95' : 'border-white/5 bg-black hover:border-white/20'}`}
                    >
                      <span className="text-xl mb-1">{cat.icone}</span>
                      <span className="text-[8px] truncate w-full text-center uppercase font-bold tracking-tighter">{cat.nome}</span>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-1">Valor do Objetivo (R$)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 mt-2 focus:border-yellow-400 outline-none text-xl font-mono text-yellow-400 transition"
                  placeholder="0,00"
                  value={valorLimite}
                  onChange={e => setValorLimite(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-gray-500 font-bold hover:text-white transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black hover:bg-yellow-300 transition shadow-lg shadow-yellow-400/10">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
