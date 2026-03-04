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

      // 1. Busca as Metas (Goals)
      const { data: goalsData } = await supabase.from("goals").select("*").eq("user_id", user.id);
      
      // 2. Busca Transações do Mês Atual
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

      if (goalsData) {
        setMetas(goalsData);
        
        // --- CÁLCULO MATEMÁTICO PRECISO ---
        // Soma todos os limites de categoria para formar o total do orçamento
        const somaLimites = goalsData
          .filter(g => g.type === "Limite de Categoria")
          .reduce((acc, g) => acc + g.amount, 0);
        
        setOrcamentoGlobal(somaLimites || 1); // Evita divisão por zero

        const primeiraMeta = goalsData.find(g => g.type === "Limite de Categoria");
        if (primeiraMeta) setCategoriaTransacao(primeiraMeta.category || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTransacao(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      amount: parseFloat(valorTransacao),
      type: tipoTransacao,
      category: tipoTransacao === "saida" ? categoriaTransacao : "Entrada",
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("transactions").insert([payload]);
    if (!error) {
      setShowTransacaoModal(false);
      setValorTransacao("");
      loadDashboardData();
    }
  }

  const getIconData = (cat: string | null) => CATEGORIAS_LISTA.find(c => c.nome === cat) || { icone: "💰", cor: "#888" };

  // Render do gráfico simplificado com legenda abaixo
  const renderDonutChart = () => {
    const raio = 50;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;

    const fatias = CATEGORIAS_LISTA.map(cat => ({
      ...cat,
      valor: gastosPorCategoria[cat.nome] || 0
    })).filter(f => f.valor > 0);

    return fatias.map((fatia, i) => {
      const percentual = fatia.valor / (totalSaidas || 1);
      const dashArray = `${percentual * circunferencia} ${circunferencia}`;
      const dashOffset = -acumulado * circunferencia;
      acumulado += percentual;

      return (
        <circle key={i} cx="80" cy="80" r={raio} fill="none" stroke={fatia.cor} strokeWidth="15"
          strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000" />
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return null;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Dashboard</h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Inteligência Financeira</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/metas")} className="flex-1 px-6 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition">Metas 📈</button>
          <button onClick={() => setShowTransacaoModal(true)} className="flex-1 px-8 bg-yellow-400 text-black rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300">+ Transação</button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-gray-500 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Saldo Disponível</p>
          <h2 className="text-3xl font-black tracking-tighter italic">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-red-500/80 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Total Saídas</p>
          <h2 className="text-3xl font-black tracking-tighter italic text-red-500">R$ {totalSaidas.toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-green-500/80 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Total Entradas</p>
          <h2 className="text-3xl font-black tracking-tighter italic text-green-500">R$ {totalEntradas.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO DE ROSCA COM LEGENDA */}
        <div className="bg-[#111111] p-8 rounded-[3.5rem] border border-white/5 flex flex-col items-center">
          <span className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-8 self-start">Uso do Orçamento</span>
          
          <div className="relative w-48 h-48 flex items-center justify-center mb-10">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="50" fill="none" stroke="#222" strokeWidth="15" />
              {renderDonutChart()}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black tracking-tighter">{porcentagemGlobal.toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gasto</span>
            </div>
          </div>

          <div className="w-full space-y-3 mb-8">
            {CATEGORIAS_LISTA.map(cat => {
              const valor = gastosPorCategoria[cat.nome] || 0;
              if (valor === 0) return null;
              return (
                <div key={cat.nome} className="flex justify-between items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                  <span className="text-[11px] font-bold uppercase tracking-tighter">{cat.icone} {cat.nome}</span>
                  <span className="text-[11px] font-mono font-bold text-gray-400">R$ {valor.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/5 w-full">
            {/* TEXTO DO CÁLCULO CIRCULADO NO PRINT */}
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-tighter">
              <span className="text-white text-lg font-black">R$ {totalSaidas.toLocaleString()}</span> DE R$ {orcamentoGlobal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* LIMITES POR CATEGORIA COM CORES DE CALOR */}
        <div className="lg:col-span-2 bg-[#111111] p-10 rounded-[3.5rem] border border-white/5">
          <h3 className="text-2xl font-black mb-10 italic uppercase tracking-tighter">Limites por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            {metas.filter(g => g.type === "Limite de Categoria").map((meta) => {
              const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
              const progresso = (gastoReal / meta.amount) * 100;
              const iconData = getIconData(meta.category);

              let corProgresso = "#EAB308"; // Amarelo
              if (progresso >= 70 && progresso < 90) corProgresso = "#F97316"; // Laranja
              if (progresso >= 90) corProgresso = "#EF4444"; // Vermelho

              return (
                <div key={meta.id} className="group">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-black flex items-center gap-3 italic uppercase tracking-tighter">
                      <span className="text-2xl">{iconData.icone}</span>
                      {meta.category}
                    </span>
                    <div className="text-right">
                      <span className="block text-[10px] font-black text-white">R$ {gastoReal.toLocaleString()} / {meta.amount}</span>
                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Faltam R$ {Math.max(0, meta.amount - gastoReal).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min(progresso, 100)}%`, backgroundColor: corProgresso }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE REGISTRO ... (Código de registro mantido para funcionalidade) */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-[#111111] border border-white/10 w-full max-w-sm rounded-[3rem] p-10">
            <h2 className="text-3xl font-black mb-8 italic tracking-tighter uppercase text-center">Registrar</h2>
            <form onSubmit={handleSaveTransacao} className="space-y-8">
               <div className="flex bg-black p-2 rounded-2xl border border-white/5">
                <button type="button" onClick={() => setTipoTransacao("saida")} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === 'saida' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500'}`}>Saída</button>
                <button type="button" onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === 'entrada' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500'}`}>Entrada</button>
              </div>
              <input required type="number" step="0.01" placeholder="R$ 0,00" className="w-full bg-black border border-white/10 rounded-2xl p-6 text-3xl font-mono text-yellow-400 outline-none" value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} />
              {tipoTransacao === "saida" && (
                <select className="w-full bg-black border border-white/10 rounded-2xl p-5 text-[11px] font-black uppercase" value={categoriaTransacao} onChange={(e) => setCategoriaTransacao(e.target.value)}>
                  {metas.filter(g => g.type === "Limite de Categoria").map(meta => (
                    <option key={meta.id} value={meta.category || ""}>{meta.category}</option>
                  ))}
                </select>
              )}
              <button type="submit" className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest">Confirmar</button>
              <button type="button" onClick={() => setShowTransacaoModal(false)} className="w-full text-gray-500 font-black uppercase text-[10px] mt-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
