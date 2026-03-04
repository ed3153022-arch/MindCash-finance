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

      if (goalsData) {
        setMetas(goalsData);
        const global = goalsData.find(g => g.type === "Meta de Gasto Global")?.amount || 
                       goalsData.filter(g => g.type === "Limite de Categoria").reduce((acc, g) => acc + g.amount, 0);
        setOrcamentoGlobal(global || 5000);

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

  const renderDonutChartWithIcons = () => {
    const raio = 55;
    const centro = 80;
    const circunferencia = 2 * Math.PI * raio;
    let acumuladoPercent = 0;

    const fatias = CATEGORIAS_LISTA.map(cat => ({
      ...cat,
      valor: gastosPorCategoria[cat.nome] || 0
    })).filter(f => f.valor > 0);

    return fatias.map((fatia, i) => {
      const percentual = fatia.valor / (totalSaidas || 1);
      const dashArray = `${percentual * circunferencia} ${circunferencia}`;
      const dashOffset = -acumuladoPercent * circunferencia;
      const anguloMeioFatia = (acumuladoPercent + percentual / 2) * 360 - 90;
      acumuladoPercent += percentual;

      const xIcone = centro + raio * Math.cos((anguloMeioFatia * Math.PI) / 180);
      const yIcone = centro + raio * Math.sin((anguloMeioFatia * Math.PI) / 180);

      return (
        <g key={i}>
          <circle cx={centro} cy={centro} r={raio} fill="none" stroke={fatia.cor} strokeWidth="18"
            strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000" />
          <text x={xIcone} y={yIcone} fontSize="14" textAnchor="middle" alignmentBaseline="middle" className="select-none pointer-events-none">
            {fatia.icone}
          </text>
        </g>
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  if (loading) return <div className="text-white p-10 font-black italic uppercase">Carregando...</div>;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700">
      
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
          <h2 className="text-3xl font-black tracking-tighter italic">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-red-500/80 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Total Saídas</p>
          <h2 className="text-3xl font-black tracking-tighter italic text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="bg-[#111111] rounded-[2.5rem] p-8 border border-white/5">
          <p className="text-green-500/80 text-[9px] tracking-[0.3em] uppercase font-black mb-4">Total Entradas</p>
          <h2 className="text-3xl font-black tracking-tighter italic text-green-500">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      {/* GRÁFICOS E LIMITES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO DE ROSCA ESTILO CANVA */}
        <div className="bg-[#111111] p-10 rounded-[3.5rem] border border-white/5 flex flex-col items-center">
          <span className="text-gray-400 text-[9px] uppercase font-black tracking-[0.3em] mb-10 self-start">Uso do Orçamento</span>
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="55" fill="none" stroke="#1a1a1a" strokeWidth="18" />
              {renderDonutChartWithIcons()}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black tracking-tighter">{porcentagemGlobal.toFixed(0)}%</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gasto</span>
            </div>
          </div>
          <div className="mt-10 self-start w-full">
             <p className="text-gray-500 text-[10px] font-black uppercase tracking-tighter">
              <span className="text-white text-lg">R$ {totalSaidas.toLocaleString()}</span> de R$ {orcamentoGlobal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* LIMITES POR CATEGORIA COM CORES DE ALERTA */}
        <div className="lg:col-span-2 bg-[#111111] p-10 rounded-[3.5rem] border border-white/5">
          <h3 className="text-2xl font-black mb-10 italic uppercase tracking-tighter leading-none">Limites por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            {metas.filter(g => g.type === "Limite de Categoria").map((meta) => {
              const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
              const progresso = (gastoReal / meta.amount) * 100;
              
              let corProgresso = "#EAB308"; // Amarelo
              if (progresso >= 70 && progresso < 90) corProgresso = "#F97316"; // Laranja
              if (progresso >= 90) corProgresso = "#EF4444"; // Vermelho

              return (
                <div key={meta.id} className="group">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-black flex items-center gap-3 italic uppercase tracking-tighter">
                      <span className="text-2xl">{getIconData(meta.category).icone}</span>
                      {meta.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-500">
                      <span className="text-white text-sm font-black">R$ {gastoReal.toFixed(0)}</span> / {meta.amount}
                    </span>
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

      {/* MODAL DE REGISTRO */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-[#111111] border border-white/10 w-full max-w-sm rounded-[3rem] p-10">
            <h2 className="text-3xl font-black mb-8 italic tracking-tighter uppercase text-center">Registrar</h2>
            <form onSubmit={handleSaveTransacao} className="space-y-8">
              <div className="flex bg-black p-2 rounded-2xl border border-white/5">
                <button type="button" onClick={() => setTipoTransacao("saida")} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === 'saida' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500'}`}>Saída</button>
                <button type="button" onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === 'entrada' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500'}`}>Entrada</button>
              </div>
              
              {tipoTransacao === "saida" && (
                <select className="w-full bg-black border border-white/10 rounded-2xl p-5 text-[11px] font-black uppercase outline-none focus:border-yellow-400 transition"
                  value={categoriaTransacao} onChange={(e) => setCategoriaTransacao(e.target.value)}>
                  {metas.filter(g => g.type === "Limite de Categoria").map(meta => (
                    <option key={meta.id} value={meta.category || ""}>{getIconData(meta.category).icone} {meta.category}</option>
                  ))}
                </select>
              )}

              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-2xl">R$</span>
                <input required type="number" step="0.01" placeholder="0,00"
                  className="w-full bg-black border border-white/10 rounded-3xl p-6 pl-16 text-4xl font-mono text-yellow-400 outline-none"
                  value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowTransacaoModal(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-yellow-400/10">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
