"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UpgradeModal from "@/components/UpgradeModal";

type Goal = {
  id: string;
  title: string;
  type: string;
  category: string | null;
  amount: number;
};

const CATEGORIAS_LISTA = [
  { nome: "Moradia", icone: "🏠" },
  { nome: "Alimentação", icone: "🍔" },
  { nome: "Transporte", icone: "🚗" },
  { nome: "Entretenimento", icone: "🎬" },
  { nome: "Saúde", icone: "💊" },
  { nome: "Educação", icone: "📚" },
  { nome: "Assinaturas", icone: "💳" },
  { nome: "Compras", icone: "🛍" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  
  // Estados de Dados Reais
  const [metas, setMetas] = useState<Goal[]>([]);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Record<string, number>>({});
  const [orcamentoGlobal, setOrcamentoGlobal] = useState(0);

  // Estados do Formulário de Transação
  const [tipoTransacao, setTipoTransacao] = useState<"entrada" | "saida">("saida");
  const [categoriaTransacao, setCategoriaTransacao] = useState(CATEGORIAS_LISTA[0].nome);
  const [valorTransacao, setValorTransacao] = useState("");
  const [descricaoTransacao, setDescricaoTransacao] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Buscar Metas
    const { data: goalsData } = await supabase.from("goals").select("*").eq("user_id", user.id);
    
    // 2. Buscar Transações do Mês
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: transacoes } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", inicioMes);

    if (transacoes) {
      const saidas = transacoes.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0);
      const entradas = transacoes.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
      
      const agrupado = transacoes.filter(t => t.type === 'saida').reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      setTotalSaidas(saidas);
      setTotalEntradas(entradas);
      setGastosPorCategoria(agrupado);
    }

    if (goalsData) {
      setMetas(goalsData);
      const global = goalsData.find(g => g.type === "Meta de Gasto Global")?.amount || 
                     goalsData.filter(g => g.type === "Limite de Categoria").reduce((acc, g) => acc + g.amount, 0);
      setOrcamentoGlobal(global || 5000);
    }
    setLoading(false);
  }

  async function handleSaveTransacao(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("transactions").insert([{
      user_id: user.id,
      amount: parseFloat(valorTransacao),
      type: tipoTransacao,
      category: categoriaTransacao,
      description: descricaoTransacao,
      created_at: new Date().toISOString()
    }]);

    if (!error) {
      setShowTransacaoModal(false);
      setValorTransacao("");
      setDescricaoTransacao("");
      loadDashboardData(); // Recarrega os números do dashboard
    } else {
      alert("Erro ao salvar transação: " + error.message);
    }
  }

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-yellow-400 italic animate-pulse">Carregando...</div>;

  return (
    <div className="bg-black text-white min-h-screen antialiased">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10 md:py-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold italic tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm">Controle financeiro em tempo real.</p>
          </div>
          
          <div className="flex flex-row gap-3 w-full md:w-auto">
            <button onClick={() => router.push("/metas")} className="flex-1 md:px-6 px-4 py-4 border border-white/10 rounded-2xl text-sm font-medium hover:bg-white/5 transition">
              Metas 📈
            </button>
            <button onClick={() => setShowTransacaoModal(true)} className="flex-1 md:px-8 bg-yellow-400 hover:bg-yellow-300 text-black rounded-2xl py-4 text-sm font-black transition shadow-lg shadow-yellow-400/20">
              + Transação
            </button>
          </div>
        </div>

        {/* CARDS DE RESUMO REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 ring-1 ring-white/5">
            <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Saldo</p>
            <h2 className="text-3xl font-black text-white">R$ {(totalEntradas - totalSaidas).toLocaleString()}</h2>
          </div>
          <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 ring-1 ring-white/5">
            <p className="text-red-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Saídas</p>
            <h2 className="text-3xl font-black text-red-500">R$ {totalSaidas.toLocaleString()}</h2>
          </div>
          <div className="bg-[#111111] rounded-[2rem] p-6 border border-white/5 ring-1 ring-white/5">
            <p className="text-green-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-3">Entradas</p>
            <h2 className="text-3xl font-black text-green-500">R$ {totalEntradas.toLocaleString()}</h2>
          </div>
        </div>

        {/* GRÁFICOS DINÂMICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#111111] p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest block mb-4">Uso do Orçamento</span>
            <div className="text-4xl font-black mb-2">{porcentagemGlobal.toFixed(0)}%</div>
            <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-6">
              <div className="bg-yellow-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(250,204,21,0.4)]" style={{ width: `${Math.min(porcentagemGlobal, 100)}%` }} />
            </div>
            <p className="text-gray-500 text-xs">Gasto total planejado: R$ {orcamentoGlobal.toLocaleString()}</p>
          </div>

          <div className="lg:col-span-2 bg-[#111111] p-8 rounded-[2.5rem] border border-white/5">
            <h3 className="text-lg font-bold mb-8 italic">Progresso por Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {metas.filter(g => g.type === "Limite de Categoria").map((meta) => {
                const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
                const progresso = (gastoReal / meta.amount) * 100;
                return (
                  <div key={meta.id} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold">{CATEGORIAS_LISTA.find(c => c.nome === meta.category)?.icone} {meta.title}</span>
                      <span className="text-[10px] font-mono">R$ {gastoReal.toLocaleString()} / <span className="text-white/30">{meta.amount}</span></span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ${progresso > 90 ? 'bg-red-500' : 'bg-yellow-400'}`} style={{ width: `${Math.min(progresso, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE NOVA TRANSAÇÃO */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8">
            <h2 className="text-2xl font-black mb-6 italic">Novo Registro</h2>
            <form onSubmit={handleSaveTransacao} className="space-y-5">
              <div className="flex bg-black p-1 rounded-2xl border border-white/5">
                <button type="button" onClick={() => setTipoTransacao("saida")} className={`flex-1 py-3 rounded-xl font-bold transition ${tipoTransacao === 'saida' ? 'bg-red-500/10 text-red-500' : 'text-gray-500'}`}>Saída</button>
                <button type="button" onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-3 rounded-xl font-bold transition ${tipoTransacao === 'entrada' ? 'bg-green-500/10 text-green-500' : 'text-gray-500'}`}>Entrada</button>
              </div>
              
              {tipoTransacao === "saida" && (
                <select 
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 outline-none focus:border-yellow-400"
                  value={categoriaTransacao}
                  onChange={(e) => setCategoriaTransacao(e.target.value)}
                >
                  {CATEGORIAS_LISTA.map(c => <option key={c.nome} value={c.nome}>{c.icone} {c.nome}</option>)}
                </select>
              )}

              <input 
                required type="number" step="0.01" placeholder="R$ 0,00"
                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-2xl font-mono text-yellow-400 outline-none"
                value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)}
              />

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTransacaoModal(false)} className="flex-1 py-4 text-gray-500 font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
