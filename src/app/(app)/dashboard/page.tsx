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

    // LÓGICA SOLICITADA: O gráfico percorre as categorias gastas e ocupa espaço proporcional ao limite total
    return CATEGORIAS_LISTA.map((cat, i) => {
      const gastoReal = gastosPorCategoria[cat.nome] || 0;
      if (gastoReal <= 0) return null;

      // A fatia ocupa apenas o percentual do gasto real sobre o orçamento total
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
          strokeWidth="25"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return null;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER E CARDS DE SALDO */}
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-gray-500 text-[9px] uppercase font-black mb-4">Saldo Disponível</p>
          <h2 className="text-3xl font-black italic">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-red-500 text-[9px] uppercase font-black mb-4">Total Saídas</p>
          <h2 className="text-3xl font-black italic text-red-500">R$ {totalSaidas.toLocaleString('pt-BR')}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-green-500 text-[9px] uppercase font-black mb-4">Total Entradas</p>
          <h2 className="text-3xl font-black italic text-green-500">R$ {totalEntradas.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRÁFICO DE USO */}
        <div className="bg-[#111111] p-10 rounded-[3.5rem] border border-white/5 flex flex-col items-center">
          <span className="text-gray-400 text-[10px] uppercase font-black mb-10 self-start">Uso do Orçamento</span>
          
          <div className="relative w-56 h-56 flex items-center justify-center mb-10">
            <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
              {/* Fundo cinza (sem cor) que representa o orçamento total disponível */}
              <circle cx="80" cy="80" r="50" fill="none" stroke="#1a1a1a" strokeWidth="25" />
              {renderDonutChart()}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter">{porcentagemGlobal.toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500 uppercase font-black">Gasto</span>
            </div>
          </div>

          {/* LEGENDA: Apenas categorias com transações */}
          <div className="w-full grid grid-cols-3 gap-y-6 mb-8 mt-4">
            {CATEGORIAS_LISTA.map(cat => {
              if ((gastosPorCategoria[cat.nome] || 0) <= 0) return null;
              return (
                <div key={cat.nome} className="flex items-center gap-2 justify-center">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.cor }} />
                  <span className="text-xl leading-none">{cat.icone}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-white/5 w-full">
            <p className="text-gray-500 text-[11px] font-black uppercase">
              <span className="text-white text-lg font-black italic">R$ {totalSaidas.toLocaleString()}</span> DE R$ {orcamentoGlobal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* LISTA DE LIMITES */}
        <div className="lg:col-span-2 bg-[#111111] p-10 rounded-[3.5rem] border border-white/5">
          <h3 className="text-2xl font-black mb-10 italic uppercase">Limites por Categoria</h3>
          <div className="grid grid-cols-1 gap-12">
            {metas.map((meta) => {
              const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
              const progresso = (gastoReal / meta.amount) * 100;
              const catData = CATEGORIAS_LISTA.find(c => c.nome === meta.category) || { icone: "💰" };

              return (
                <div key={meta.id}>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-black flex items-center gap-3 italic uppercase text-white">
                      <span className="text-2xl">{catData.icone}</span>
                      {meta.category}
                    </span>
                    <span className="text-[10px] font-black text-white italic">R$ {gastoReal.toLocaleString()} / {meta.amount}</span>
                  </div>
                  <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${Math.min(progresso, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
