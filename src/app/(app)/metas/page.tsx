"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Se você tiver um componente separado para o Modal, importe-o aqui. 
// Caso contrário, usei a lógica de estado abaixo.
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
  
  // ESTADO DO MODAL QUE RECOLOQUEI PARA O BOTÃO VOLTAR A FUNCIONAR
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  
  const [metas, setMetas] = useState<Goal[]>([]);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Record<string, number>>({});
  const [orcamentoGlobal, setOrcamentoGlobal] = useState(0);

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
        const somaTotal = goalsData.reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
        setOrcamentoGlobal(somaTotal || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
        <circle
          key={i}
          cx="80"
          cy="80"
          r={raio}
          fill="none"
          stroke={cat.cor}
          strokeWidth="20"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-6 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER COM BOTÕES FUNCIONAIS */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter">DASHBOARD</h1>
          <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Inteligência Financeira</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => router.push("/metas")} 
            className="flex-1 bg-[#111111] border border-white/10 text-white rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition"
          >
            Metas 📈
          </button>
          <button 
            onClick={() => setShowTransacaoModal(true)} // BOTÃO VOLTOU A FUNCIONAR
            className="flex-1 bg-yellow-400 text-black rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
          >
            + Transação
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="space-y-3">
        <div className="bg-[#111111] rounded-3xl p-6 border border-white/5">
          <p className="text-gray-500 text-[9px] tracking-widest uppercase font-black mb-1">Saldo Disponível</p>
          <h2 className="text-4xl font-black italic">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-3xl p-6 border border-white/5">
          <p className="text-red-500 text-[9px] tracking-widest uppercase font-black mb-1">Total Saídas</p>
          <h2 className="text-4xl font-black italic text-red-500">R$ {totalSaidas.toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-3xl p-6 border border-white/5">
          <p className="text-green-500 text-[9px] tracking-widest uppercase font-black mb-1">Total Entradas</p>
          <h2 className="text-4xl font-black italic text-green-500">R$ {totalEntradas.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      {/* GRÁFICO DE USO */}
      <div className="bg-[#111111] p-8 rounded-[3rem] border border-white/5 flex flex-col items-center">
        <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-8 self-start">Uso do Orçamento</span>
        
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="50" fill="none" stroke="#1a1a1a" strokeWidth="20" />
            {renderDonutChart()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black tracking-tighter">{porcentagemGlobal.toFixed(0)}%</span>
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gasto</span>
          </div>
        </div>

        {/* LEGENDA DINÂMICA */}
        <div className="w-full grid grid-cols-3 gap-y-6 mt-4">
          {CATEGORIAS_LISTA.map(cat => {
            if ((gastosPorCategoria[cat.nome] || 0) <= 0) return null;
            return (
              <div key={cat.nome} className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                <span className="text-2xl">{cat.icone}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* LISTA DE LIMITES ABAIXO */}
      <div className="bg-[#111111] p-8 rounded-[3rem] border border-white/5">
        <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Limites por Categoria</h3>
        <div className="space-y-8">
          {metas.map((meta) => {
            const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
            const progresso = (gastoReal / meta.amount) * 100;
            const catData = CATEGORIAS_LISTA.find(c => c.nome === meta.category) || { icone: "💰" };

            return (
              <div key={meta.id}>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-black flex items-center gap-2 uppercase italic text-white">
                    <span className="text-xl">{catData.icone}</span> {meta.category}
                  </span>
                  <span className="text-[10px] font-black text-gray-400 italic">
                    R$ {gastoReal.toLocaleString()} / {meta.amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-1000" 
                    style={{ width: `${Math.min(progresso, 100)}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* IMPORTANTE: Aqui você deve colocar o seu componente de Modal 
          que usa o estado showTransacaoModal para abrir e fechar */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#111111] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 relative">
             <button 
               onClick={() => setShowTransacaoModal(false)}
               className="absolute top-6 right-6 text-gray-500 text-xs font-black uppercase"
             >
               Fechar X
             </button>
             {/* INSIRA AQUI O SEU FORMULÁRIO DE TRANSAÇÃO */}
             <h2 className="text-2xl font-black italic uppercase mb-6">Nova Transação</h2>
             <p className="text-gray-400 text-sm mb-4">O seu formulário de transação vai aqui dentro.</p>
          </div>
        </div>
      )}
    </div>
  );
}
