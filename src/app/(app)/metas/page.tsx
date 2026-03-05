"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Goal = {
  id: string;
  category: string | null;
  amount: number;
  type: string;
};

const CATEGORIAS_LISTA = [
  { nome: "Moradia", icone: "🏠", cor: "#FF4500" },
  { nome: "Alimentação", icone: "🍔", cor: "#FF1493" },
  { nome: "Transporte", icone: "🚗", cor: "#00CED1" },
  { nome: "Entretenimento", icone: "🎬", cor: "#32CD32" },
  { nome: "Saúde", icone: "💊", cor: "#FFA500" },
  { nome: "Educação", icone: "📚", cor: "#4169E1" },
  { nome: "Assinaturas", icone: "💳", cor: "#FFD700" },
  { nome: "Compras", icone: "🛍", cor: "#8A2BE2" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  const [metas, setMetas] = useState<Goal[]>([]);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Record<string, number>>({});
  const [orcamentoGlobal, setOrcamentoGlobal] = useState(0);

  // Estados para o formulário do Modal
  const [tipoTransacao, setTipoTransacao] = useState<"entrada" | "saida">("saida");
  const [categoriaTransacao, setCategoriaTransacao] = useState("");
  const [valorTransacao, setValorTransacao] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "Limite de Categoria");

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
          if (t.category) acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

        setTotalSaidas(saidas);
        setTotalEntradas(entradas);
        setGastosPorCategoria(agrupado);
      }

      if (goalsData) {
        setMetas(goalsData);
        const somaTotalLimites = goalsData.reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
        setOrcamentoGlobal(somaTotalLimites || 1);
        if (goalsData.length > 0) setCategoriaTransacao(goalsData[0].category || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTransaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: tipoTransacao,
        category: tipoTransacao === "saida" ? categoriaTransacao : null,
        amount: parseFloat(valorTransacao.replace(",", ".")),
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      setShowTransacaoModal(false);
      setValorTransacao("");
      loadDashboardData(); // Recarrega o gráfico e os saldos
    } catch (err) {
      alert("Erro ao salvar transação");
    }
  };

  const renderDonutChart = () => {
    const raio = 50;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;

    return CATEGORIAS_LISTA.map((cat, i) => {
      const gastoReal = gastosPorCategoria[cat.nome] || 0;
      if (gastoReal <= 0) return null;

      const percentual = gastoReal / (orcamentoGlobal || 1);
      const dashArray = `${percentual * circunferencia} ${circunferencia}`;
      const dashOffset = -acumulado * circunferencia;
      acumulado += percentual;

      return (
        <circle key={i} cx="80" cy="80" r={raio} fill="none" stroke={cat.cor} strokeWidth="25" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return null;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">Dashboard</h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Inteligência Financeira</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/metas")} className="flex-1 px-6 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition text-white">Metas 📈</button>
          <button onClick={() => setShowTransacaoModal(true)} className="flex-1 px-8 bg-yellow-400 text-black rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300">+ Transação</button>
        </div>
      </div>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-gray-500 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Saldo Disponível</p>
          <h2 className="text-3xl font-black italic text-white">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 text-red-500">
          <p className="text-red-500/80 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Total Saídas</p>
          <h2 className="text-3xl font-black italic">R$ {totalSaidas.toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5 text-green-500">
          <p className="text-green-500/80 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Total Entradas</p>
          <h2 className="text-3xl font-black italic">R$ {totalEntradas.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO */}
        <div className="bg-[#111111] p-10 rounded-[3.5rem] border border-white/5 flex flex-col items-center">
          <span className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-10 self-start">Uso do Orçamento</span>
          
          <div className="relative w-56 h-56 flex items-center justify-center mb-10">
            <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="50" fill="none" stroke="#1a1a1a" strokeWidth="25" />
              {renderDonutChart()}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter text-white">{porcentagemGlobal.toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gasto</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-y-6 mb-8 mt-4">
            {metas.map(meta => {
              const catData = CATEGORIAS_LISTA.find(c => c.nome === meta.category);
              if (!catData) return null;
              return (
                <div key={meta.id} className="flex flex-col items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catData.cor }} />
                  <span className="text-2xl">{catData.icone}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/5 w-full text-center text-gray-500 text-[11px] font-black uppercase tracking-tighter">
            <span className="text-white text-lg font-black italic">R$ {totalSaidas.toLocaleString()}</span> DE R$ {orcamentoGlobal.toLocaleString()}
          </div>
        </div>

        {/* METAS */}
        <div className="lg:col-span-2 bg-[#111111] p-10 rounded-[3.5rem] border border-white/5">
          <h3 className="text-2xl font-black mb-10 italic uppercase text-white">Limites por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-white">
            {metas.map((meta) => {
              const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
              const progresso = (gastoReal / meta.amount) * 100;
              const catData = CATEGORIAS_LISTA.find(c => c.nome === meta.category) || { icone: "💰" };
              return (
                <div key={meta.id}>
                  <div className="flex justify-between items-end mb-4 font-black italic uppercase text-[10px]">
                    <span className="flex items-center gap-2"><span className="text-2xl">{catData.icone}</span> {meta.category}</span>
                    <span>R$ {gastoReal.toLocaleString()} / {meta.amount}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${Math.min(progresso, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE TRANSAÇÃO RESTAURADO */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-[#111111] w-full max-w-md rounded-[3rem] p-10 border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowTransacaoModal(false)} className="absolute top-8 right-8 text-gray-500 font-black uppercase text-[10px] tracking-widest">Fechar X</button>
            
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-8">Nova Registro</h2>
            
            <div className="space-y-6">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setTipoTransacao("saida")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === "saida" ? "bg-red-500 text-white" : "text-gray-500"}`}>Saída</button>
                <button onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === "entrada" ? "bg-green-500 text-white" : "text-gray-500"}`}>Entrada</button>
              </div>

              {tipoTransacao === "saida" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Categoria</label>
                  <select value={categoriaTransacao} onChange={(e) => setCategoriaTransacao(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-black italic outline-none">
                    {CATEGORIAS_LISTA.map(cat => <option key={cat.nome} value={cat.nome}>{cat.icone} {cat.nome}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Valor (R$)</label>
                <input type="text" placeholder="0,00" value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-4xl font-black italic text-white outline-none placeholder:text-white/10" />
              </div>

              <button onClick={handleAddTransaction} className="w-full bg-yellow-400 text-black py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-yellow-400/20 active:scale-95 transition">Confirmar Registo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
