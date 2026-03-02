"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UpgradeModal from "@/components/UpgradeModal";

type Goal = {
  id: string;
  title: string;
  category: string | null;
  amount: number;
};

// Cores vibrantes estilo gráfico financeiro premium
const CATEGORIAS_LISTA = [
  { nome: "Moradia", icone: "🏠", cor: "#FF4500" },
  { nome: "Alimentação", icone: "🍔", cor: "#FFA500" },
  { nome: "Transporte", icone: "🚗", cor: "#00CED1" },
  { nome: "Entretenimento", icone: "🎬", cor: "#32CD32" },
  { nome: "Saúde", icone: "💊", cor: "#FF1493" },
  { nome: "Educação", icone: "📚", cor: "#4169E1" },
  { nome: "Assinaturas", icone: "💳", cor: "#FFD700" },
  { nome: "Compras", icone: "🛍", cor: "#8A2BE2" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  
  // Estados de Dados
  const [metas, setMetas] = useState<Goal[]>([]);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Record<string, number>>({});

  // Estados do Formulário (Sincronizados com sua correção)
  const [tipoTransacao, setTipoTransacao] = useState<"entrada" | "saida">("saida");
  const [categoriaTransacao, setCategoriaTransacao] = useState(CATEGORIAS_LISTA[0].nome);
  const [valorTransacao, setValorTransacao] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goalsData } = await supabase.from("goals").select("*").eq("user_id", user.id);
      
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      
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
      if (goalsData) setMetas(goalsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // FUNÇÃO DE SALVAMENTO CORRIGIDA E INTEGRADA
  async function handleSaveTransacao(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const valorFloat = parseFloat(valorTransacao);
      if (isNaN(valorFloat)) {
        alert("Insira um valor válido");
        return;
      }

      const payload = {
        user_id: user.id,
        amount: valorFloat,
        type: tipoTransacao,
        category: tipoTransacao === "saida" ? categoriaTransacao : "Entrada",
        created_at: new Date().toISOString(), 
      };

      const { error } = await supabase.from("transactions").insert([payload]);

      if (error) {
        alert(`Erro técnico: ${error.message}`);
      } else {
        setShowTransacaoModal(false);
        setValorTransacao("");
        loadDashboardData(); // Atualiza o gráfico de rosca na hora!
      }
    } catch (err) {
      alert("Erro ao processar a transação.");
    }
  }

  // Renderização do Gráfico de Rosca (Donut)
  const renderDonutChart = () => {
    const raio = 50;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;

    const fatias = CATEGORIAS_LISTA.map(cat => ({
      ...cat,
      valor: gastosPorCategoria[cat.nome] || 0
    })).filter(f => f.valor > 0);

    if (fatias.length === 0) {
      return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1C1C1C" strokeWidth="18" />;
    }

    return fatias.map((fatia, i) => {
      const percentual = fatia.valor / (totalSaidas || 1);
      const dashArray = `${percentual * circunferencia} ${circunferencia}`;
      const dashOffset = -acumulado * circunferencia;
      acumulado += percentual;

      return (
        <circle
          key={i}
          cx="80"
          cy="80"
          r={raio}
          fill="none"
          stroke={fatia.cor}
          strokeWidth="18"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap={fatias.length === 1 ? "butt" : "round"}
          className="transition-all duration-1000 ease-in-out"
        />
      );
    });
  };

  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-yellow-400 italic animate-pulse">MINDCASH...</div>;

  return (
    <div className="bg-black text-white min-h-screen antialiased">
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Dashboard</h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Gestão de Ativos</p>
          </div>
          <button onClick={() => setShowTransacaoModal(true)} className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition active:scale-95 shadow-lg shadow-yellow-400/10">
            + Transação
          </button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-end">
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Saldo Total</p>
              <h2 className="text-4xl font-black tracking-tighter">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</h2>
            </div>
            <div className="text-green-500 text-xs font-bold bg-green-500/10 px-3 py-1 rounded-full">+ Entradas</div>
          </div>
          <div className="bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-end">
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Gasto Mensal</p>
              <h2 className="text-4xl font-black tracking-tighter text-red-500">R$ {totalSaidas.toLocaleString('pt-BR')}</h2>
            </div>
            <div className="text-red-500 text-xs font-bold bg-red-500/10 px-3 py-1 rounded-full">- Saídas</div>
          </div>
        </div>

        {/* GRÁFICO DE ROSCA ESTILO INSTAGRAM */}
        <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <h3 className="text-sm font-black uppercase italic mb-12 tracking-widest text-gray-400">Distribuição de Gastos</h3>
          
          <div className="flex flex-col lg:flex-row items-center justify-around gap-16">
            {/* SVG DO GRÁFICO */}
            <div className="relative w-72 h-72">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {renderDonutChart()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Total</span>
                <span className="text-3xl font-black tracking-tighter italic">R$ {totalSaidas.toLocaleString()}</span>
              </div>
            </div>

            {/* LEGENDA DINÂMICA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 w-full lg:w-auto">
              {CATEGORIAS_LISTA.map(cat => {
                const valor = gastosPorCategoria[cat.nome] || 0;
                if (valor === 0) return null;
                return (
                  <div key={cat.nome} className="flex items-center justify-between gap-8 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px] shadow-current" style={{ backgroundColor: cat.cor, color: cat.cor }} />
                      <span className="text-[11px] font-black uppercase tracking-tight text-gray-300">{cat.icone} {cat.nome}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-white">R$ {valor.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE REGISTRO (Utilizando seu handleSaveTransacao corrigido) */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8">
            <h2 className="text-xl font-black mb-8 italic uppercase text-center tracking-tighter">Novo Lançamento</h2>
            <form onSubmit={handleSaveTransacao} className="space-y-6">
              <div className="flex bg-black p-1 rounded-2xl border border-white/5">
                <button type="button" onClick={() => setTipoTransacao("saida")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition ${tipoTransacao === 'saida' ? 'bg-red-500 text-white' : 'text-gray-600'}`}>Saída</button>
                <button type="button" onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition ${tipoTransacao === 'entrada' ? 'bg-green-500 text-white' : 'text-gray-600'}`}>Entrada</button>
              </div>
              
              {tipoTransacao === "saida" && (
                <select 
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:border-yellow-400 transition"
                  value={categoriaTransacao}
                  onChange={(e) => setCategoriaTransacao(e.target.value)}
                >
                  {CATEGORIAS_LISTA.map(c => <option key={c.nome} value={c.nome}>{c.icone} {c.nome}</option>)}
                </select>
              )}

              <input 
                required type="number" step="0.01" placeholder="R$ 0,00"
                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-2xl font-black text-yellow-400 outline-none focus:border-yellow-400"
                value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)}
              />

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTransacaoModal(false)} className="flex-1 py-4 text-gray-500 font-black text-[10px] uppercase">Sair</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-yellow-400/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
