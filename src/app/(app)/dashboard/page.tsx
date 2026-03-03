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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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

  // --- AJUSTE 2: GRÁFICO COM ÍCONES NA BORDA (ESTILO CANVA) ---
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
      
      // Cálculo do ângulo para posicionar o ícone no final da fatia
      // -90 graus para começar no topo do círculo
      const anguloIcone = (acumuladoPercent + percentual) * 360 - 90;
      
      acumuladoPercent += percentual;

      return (
        <g key={i}>
          {/* O Arco Colorido */}
          <circle
            cx={centro}
            cy={centro}
            r={raio}
            fill="none"
            stroke={fatia.cor}
            strokeWidth="14"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          
          {/* O Ícone na Borda (Posicionamento matemático) */}
          <g transform={`rotate(${anguloIcone} ${centro} ${centro})`}>
            <text
              x={centro + raio} 
              y={centro + 5}
              fontSize="16"
              className="select-none"
              style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
              textAnchor="middle"
            >
              {fatia.icone}
            </text>
          </g>
        </g>
      );
    });
  };

  const porcentagemGlobal = (totalSaidas / (orcamentoGlobal || 1)) * 100;

  return (
    <div className="bg-black text-white min-h-screen antialiased font-sans">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Dashboard</h1>
            <p className="text-gray-500 text-xs font-medium tracking-widest uppercase">Inteligência Financeira</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/metas")} className="flex-1 px-6 py-4 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition">Metas 📈</button>
            <button onClick={() => setShowTransacaoModal(true)} className="flex-1 px-8 bg-yellow-400 text-black rounded-2xl py-4 text-xs font-black uppercase tracking-widest shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300">+ Transação</button>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#111111] rounded-[2.5rem] p-7 border border-white/5 shadow-2xl">
            <p className="text-gray-500 text-[10px] tracking-[0.3em] uppercase font-black mb-4">Saldo Disponível</p>
            <h2 className="text-3xl font-black tracking-tighter">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-[#111111] rounded-[2.5rem] p-7 border border-white/5">
            <p className="text-red-500/80 text-[10px] tracking-[0.3em] uppercase font-black mb-4">Total Saídas</p>
            <h2 className="text-3xl font-black tracking-tighter text-red-500">R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-[#111111] rounded-[2.5rem] p-7 border border-white/5">
            <p className="text-green-500/80 text-[10px] tracking-[0.3em] uppercase font-black mb-4">Total Entradas</p>
            <h2 className="text-3xl font-black tracking-tighter text-green-500">R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* GRÁFICOS E METAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Ajuste 2: Gráfico Estilo Canva com ícones flutuantes */}
          <div className="bg-[#111111] p-8 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center">
            <span className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mb-8 self-start">Uso do Orçamento</span>
            
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                {/* Círculo de fundo (trilha cinza) */}
                <circle cx="80" cy="80" r="55" fill="none" stroke="#222" strokeWidth="14" />
                {renderDonutChartWithIcons()}
              </svg>
              
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black tracking-tighter">{porcentagemGlobal.toFixed(0)}%</span>
                <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Gasto</span>
              </div>
            </div>

            <div className="mt-8 self-start">
               <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tighter">
                <span className="text-white font-black">R$ {totalSaidas.toLocaleString()}</span> de R$ {orcamentoGlobal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Ajuste 1: Limites por Categoria com espaçamento corrigido */}
          <div className="lg:col-span-2 bg-[#111111] p-8 rounded-[3rem] border border-white/5">
            <h3 className="text-xl font-black mb-8 italic uppercase tracking-tighter">Limites por Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
              {metas.filter(g => g.type === "Limite de Categoria").map((meta) => {
                const gastoReal = gastosPorCategoria[meta.category || ""] || 0;
                const progresso = (gastoReal / meta.amount) * 100;
                const iconData = getIconData(meta.category);
                
                return (
                  <div key={meta.id} className="group">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold flex items-center gap-2 italic uppercase tracking-tighter">
                        <span className="text-xl">{iconData.icone}</span>
                        {meta.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-gray-500 shrink-0">
                        <span className="text-white">R$ {gastoReal.toFixed(0)}</span> / {meta.amount}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full transition-all duration-700" 
                        style={{ width: `${Math.min(progresso, 100)}%`, backgroundColor: iconData.cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE TRANSAÇÃO */}
      {showTransacaoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-6 italic tracking-tighter uppercase text-center">Registrar</h2>
            <form onSubmit={handleSaveTransacao} className="space-y-6">
              <div className="flex bg-black p-1.5 rounded-2xl border border-white/5">
                <button type="button" onClick={() => setTipoTransacao("saida")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === 'saida' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500'}`}>Saída</button>
                <button type="button" onClick={() => setTipoTransacao("entrada")} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${tipoTransacao === 'entrada' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500'}`}>Entrada</button>
              </div>
              
              {tipoTransacao === "saida" && (
                <select 
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-bold uppercase outline-none focus:border-yellow-400 transition"
                  value={categoriaTransacao}
                  onChange={(e) => setCategoriaTransacao(e.target.value)}
                >
                  {metas.filter(g => g.type === "Limite de Categoria").map(meta => (
                    <option key={meta.id} value={meta.category || ""}>
                      {getIconData(meta.category).icone} {meta.category}
                    </option>
                  ))}
                  {metas.filter(g => g.type === "Limite de Categoria").length === 0 && (
                     <option disabled>Nenhuma meta definida</option>
                  )}
                </select>
              )}

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-xl">R$</span>
                <input required type="number" step="0.01" placeholder="0,00"
                  className="w-full bg-black border border-white/10 rounded-2xl p-5 pl-12 text-3xl font-mono text-yellow-400 outline-none focus:border-yellow-400 transition"
                  value={valorTransacao} onChange={(e) => setValorTransacao(e.target.value)} />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setShowTransacaoModal(false)} className="flex-1 py-4 text-gray-600 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition">Cancelar</button>
                <button type="submit" className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-yellow-300 transition">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
