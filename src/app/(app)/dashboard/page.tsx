"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Zap, Trash2, X, Bell, AlertTriangle, Info, Calendar } from "lucide-react";

const MASTER_CATS = [
  { nome: "Alimentação", emoji: "🍔", cor: "#FF007A" },
  { nome: "Moradia", emoji: "🏠", cor: "#FF4D00" },
  { nome: "Transporte", emoji: "🚗", cor: "#00E5FF" },
  { nome: "Lazer", emoji: "🎬", cor: "#39FF14" },
  { nome: "Saúde", emoji: "💊", cor: "#FFB800" },
  { nome: "Educação", emoji: "📚", cor: "#4169E1" },
  { nome: "Assinaturas", emoji: "💳", cor: "#FFD700" },
  { nome: "Compras", emoji: "🛍", cor: "#8A2BE2" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFixedModal, setShowFixedModal] = useState(false);
  
  const [viewMode, setViewMode] = useState<"mes" | "ano">("mes");
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [gastosFixos, setGastosFixos] = useState<any[]>([]);

  // Estados dos inputs
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [catSel, setCatSel] = useState("");
  const [fixoNome, setFixoNome] = useState("");
  const [fixoValor, setFixoValor] = useState("");
  const [fixoData, setFixoData] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const [m, t, f] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id).order("due_day", { ascending: true })
      ]);
      setMetas(m.data || []);
      setTransacoes(t.data || []);
      setGastosFixos(f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // --- LÓGICA DO GRÁFICO DE LINHAS (30 DIAS) ---
  const timelineData = useMemo(() => {
    const dias = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    let maxValor = 10; // Valor mínimo para escala não quebrar

    const series = MASTER_CATS.map(cat => {
      const pontos = dias.map((dataStr, index) => {
        const total = transacoes
          .filter(t => t.created_at.startsWith(dataStr) && 
                       t.type === 'saida' && 
                       t.category?.toLowerCase() === cat.nome.toLowerCase())
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        if (total > maxValor) maxValor = total;
        return { x: index * 50, y: total, data: dataStr.split('-')[2] };
      });

      return { ...cat, pontos };
    });

    return { series, maxValor, width: 29 * 50 };
  }, [transacoes]);

  // Funções Auxiliares
  const maskMoney = (v: string) => {
    const onlyNums = v.replace(/\D/g, "");
    if (!onlyNums) return "";
    return (Number(onlyNums) / 100).toFixed(2).replace(".", ",");
  };

  const saldoGeral = transacoes.reduce((acc, t) => t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0);
  const transacoesFiltradas = transacoes.filter(t => {
    const d = new Date(t.created_at);
    return viewMode === "mes" ? (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) : (d.getFullYear() === anoAtual);
  });
  const entradasCard = transacoesFiltradas.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saidasCard = transacoesFiltradas.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white bg-black min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 w-full pt-4">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase italic">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase italic">NOVA TRANSAÇÃO</button>
        </div>
      </div>

      {/* SALDO */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase mb-1 italic">Saldo Disponível (Total)</p>
        <h2 className="text-4xl font-black italic">R$ {saldoGeral.toLocaleString('pt-BR')}</h2>
      </div>

      {/* CARDS ENTRADAS/SAIDAS */}
      <div className="flex flex-col gap-3">
        <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 relative">
          <p className="text-green-500 text-[9px] font-black uppercase mb-1 italic">Entradas</p>
          <h2 className="text-4xl font-black italic text-green-500">R$ {entradasCard.toLocaleString('pt-BR')}</h2>
          <div className="absolute right-6 top-[55%] -translate-y-1/2 flex gap-1.5">
            <button onClick={() => setViewMode("mes")} className={`px-3 py-2 rounded-lg border-2 font-black text-[7px] italic ${viewMode === 'mes' ? 'border-yellow-400 text-yellow-400' : 'border-zinc-800 text-zinc-500'}`}>MÊS</button>
            <button onClick={() => setViewMode("ano")} className={`px-3 py-2 rounded-lg border-2 font-black text-[7px] italic ${viewMode === 'ano' ? 'border-yellow-400 text-yellow-400' : 'border-zinc-800 text-zinc-500'}`}>ANO</button>
          </div>
        </div>
        <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
          <p className="text-red-500 text-[9px] font-black uppercase mb-1 italic">Saídas</p>
          <h2 className="text-4xl font-black italic text-red-500">R$ {saidasCard.toLocaleString('pt-BR')}</h2>
        </div>
      </div>

      {/* NOVO GRÁFICO DE LINHAS: REALIDADE 30 DIAS */}
      <div className="bg-[#111] pt-10 pb-6 rounded-[1.5rem] border border-white/5 flex flex-col overflow-hidden">
        <div className="px-8 mb-8 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Realidade das Categorias</h3>
            <p className="text-[8px] text-zinc-500 font-black uppercase italic">Evolução dos gastos nos últimos 30 dias</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /><span className="text-[6px] font-black italic">PICO</span></div>
          </div>
        </div>

        {/* ÁREA DO GRÁFICO COM SCROLL */}
        <div className="overflow-x-auto px-8 pb-4 scrollbar-hide">
          <div style={{ width: `${timelineData.width}px` }} className="relative h-[200px]">
            <svg width={timelineData.width} height="160" className="overflow-visible">
              {timelineData.series.map((serie, sIdx) => {
                // Criar o caminho da linha (Path)
                const d = serie.pontos.map((p, i) => {
                  const x = p.x;
                  const y = 160 - (p.y / timelineData.maxValor) * 140;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ');

                return (
                  <g key={sIdx}>
                    <path 
                      d={d} 
                      fill="none" 
                      stroke={serie.cor} 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="opacity-80 transition-all duration-500"
                    />
                    {/* Pontos de destaque onde houve gasto */}
                    {serie.pontos.filter(p => p.y > 0).map((p, pIdx) => (
                      <circle 
                        key={pIdx} 
                        cx={p.x} 
                        cy={160 - (p.y / timelineData.maxValor) * 140} 
                        r="3" 
                        fill={serie.cor}
                        className="animate-pulse"
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
            
            {/* Eixo X (Dias) */}
            <div className="flex justify-between mt-4 border-t border-white/5 pt-2">
              {timelineData.series[0].pontos.map((p, i) => (
                <div key={i} style={{ width: '50px' }} className="flex-shrink-0 text-center">
                  <span className="text-[7px] font-black text-zinc-600 italic">{p.data}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* O RESTANTE DO CÓDIGO (DONUT, LIMITES, ATIVIDADE) SEGUE AQUI... */}
      {/* ... mantendo a mesma estrutura que você já aprovou anteriormente */}
    </div>
  );
}
