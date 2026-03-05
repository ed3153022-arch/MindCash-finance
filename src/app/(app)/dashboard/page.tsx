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
      loadDashboardData();
    } catch (err) {
      alert("Erro ao salvar");
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
        <circle key={i} cx="80" cy="80" r={raio} fill="none" stroke={cat.cor} strokeWidth="25" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000" />
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return null;

  return (
    <div className="w-full min-h-screen bg-black text-white p-6 pt-12 space-y-10 animate-in fade-in duration-500 pb-32">
      
      {/* HEADER FIXADO PARA NÃO SUMIR */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter">Dashboard</h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Inteligência Financeira</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/metas")} className="flex-1 px-6 py-5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition bg-[#111]">Metas 📈</button>
          <button onClick={() => setShowTransacaoModal(true)} className="flex-1 px-8 bg-yellow-400 text-black rounded-2xl py-5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300">+ Transação</button>
        </div>
      </div>

      {/* CARDS RESUMO */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[#111] rounded-[2rem] p-6 border border-white/5">
          <p className="text-gray-500 text-[9px] uppercase font-black mb-2">Saldo Disponível</p>
          <h2 className="text-3xl font-black italic">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111] rounded-[2rem] p-6 border border-white/5">
            <p className="text-red-500 text-[9px] uppercase font-black mb-2">Saídas</p>
            <h2 className="text-xl font-black italic text-red-500">R$ {totalSaidas.toLocaleString('pt-BR')}</h2>
          </div>
          <div className="bg-[#111] rounded-[2rem] p-6 border border-white/5">
            <p className="text-green-500 text-[9px] uppercase font-black mb-2">Entradas</p>
            <h2 className="text-xl font-black italic text-green-500">R$ {totalEntradas.toLocaleString('pt-BR')}</h2>
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 flex flex-col items-center">
        <span className="text-gray-400 text-[10px] uppercase font-black self-start mb-8">Uso do Orçamento</span>
        <div className="relative w-56 h-56 flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="50" fill="none" stroke="#1a1a1a" strokeWidth="25" />
            {renderDonutChart()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-5xl font-black">{porcentagemGlobal.toFixed(0)}%</span>
            <span className="text-[10px] text-gray-500 uppercase font-black">Gasto</span>
          </div>
        </div>

        {/* LEGENDA DINÂMICA BASEADA NAS METAS */}
        <div className="w-full grid grid-cols-3 gap-y-6 mt-4">
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
      </div>

      {/* LISTA DE LIMITES */}
      <div className="bg-[#111] p-8 rounded-[3rem] border border-white/5">
        <h3 className="text-xl font-black mb-8 italic uppercase text-white">Limites por Categoria</h3>
        <div className="space-y-6">
          {metas.map((meta) => {
            const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
            const progresso = (gastoReal / meta.amount) * 100;
            const catData = CATEGORIAS_LISTA.find(c => c.nome === meta.category) || { icone: "💰" };
            return (
              <div key={meta.id}>
                <div className="flex justify-between items-end mb-2 font-black italic uppercase text-[10px]">
                  <span className="flex items-center gap-2"><span>{catData.icone}</span> {meta.category}</span>
                  <span className="text-gray-400">R$ {gastoReal.toLocaleString()} / {meta.amount}</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${Math.min(progresso, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL INTEGRADO */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 relative">
            <button onClick={() => setShowTransacaoModal(false)} className="absolute top-6 right-6 text-gray-500 font-black text-[10px] uppercase">Fechar X</button>
            <h2 className="text-2xl font-black italic uppercase text-white mb-6">Novo Registo</h2>
            <div className="space-y-4">
              <div className="flex bg-white/5 p-1 rounded-xl">
                <button onClick={() => setTipoTransacao("saida")} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${tipoTransacao === "saida" ? "bg-red-500 text-white" : "text-gray-500"}`}>Saída</button>
                <button onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${tipoTransacao === "entrada" ? "bg-green-500 text-white" : "text-gray-500"}`}>Entrada</button>
              </div>
              {tipoTransacao === "saida" && (
                <select value={categoriaTransacao} onChange={(e) => setCategoriaTransacao(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none">
                  {CATEGORIAS_LISTA.map(cat => <option key={cat.nome} value={cat.nome}>{cat.icone} {cat.nome}</option>)}
                </select>
              )}
              <input type="text" placeholder="Valor R$ 0,00" value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-black text-white outline-none" />
              <button onClick={handleAddTransaction} className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase text-[11px]">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
