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
  const [closedNotifications, setClosedNotifications] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("alertas_silenciados");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [gastosFixos, setGastosFixos] = useState<any[]>([]);
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");
  const [fixoNome, setFixoNome] = useState("");
  const [fixoValor, setFixoValor] = useState("");
  const [fixoData, setFixoData] = useState("");

  useEffect(() => {
    localStorage.setItem("alertas_silenciados", JSON.stringify(closedNotifications));
  }, [closedNotifications]);

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
      gerarAlertasDinamicos(m.data || [], t.data || [], f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // --- LÓGICA DO GRÁFICO DE LINHAS (RASTREAMENTO DIÁRIO) ---
  const timelineData = useMemo(() => {
    const dias = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    let maxValor = 10;
    const series = MASTER_CATS.map(cat => {
      const pontos = dias.map((dataStr, index) => {
        const total = transacoes
          .filter(t => t.created_at.startsWith(dataStr) && 
                       t.type === 'saida' && 
                       t.category?.toLowerCase() === cat.nome.toLowerCase())
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        if (total > maxValor) maxValor = total;
        return { x: index * 65, y: total, dia: dataStr.split('-')[2] };
      });
      return { ...cat, pontos };
    });

    return { series, maxValor: maxValor * 1.2, width: 29 * 65 };
  }, [transacoes]);

  const solvePath = (pontos: any[], height: number, max: number) => {
    if (pontos.length === 0) return "";
    const getPos = (p: any) => ({ x: p.x, y: height - (p.y / max) * (height - 40) });
    let d = `M ${getPos(pontos[0]).x} ${getPos(pontos[0]).y}`;
    for (let i = 0; i < pontos.length - 1; i++) {
      const curr = getPos(pontos[i]);
      const next = getPos(pontos[i+1]);
      const mx = (curr.x + next.x) / 2;
      d += ` C ${mx} ${curr.y}, ${mx} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  // --- MANTENDO SUAS FUNÇÕES ORIGINAIS ---
  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setClosedNotifications(prev => [...prev, id]);
  };

  const gerarAlertasDinamicos = (metasData: any[], transData: any[], fixosData: any[]) => {
    const novosAlertas: any[] = [];
    const hojeStr = `${agora.getDate()}${agora.getMonth() + 1}${agora.getFullYear()}`;
    const diaHoje = String(agora.getDate()).padStart(2, '0');

    fixosData.forEach(gasto => {
      const diaGasto = String(gasto.due_day).padStart(8, '0').slice(0, 2);
      if (diaGasto === diaHoje) {
        novosAlertas.push({
          id: `fixo-${gasto.id}-${hojeStr}`,
          title: "SENTENÇA DE HOJE",
          msg: `PAGAMENTO OBRIGATÓRIO: "${gasto.name.toUpperCase()}" vence hoje.`,
          severity: "warning",
          icon: <Zap size={14} className="text-yellow-400" />
        });
      }
    });
    setNotifications(prev => {
      const filtrar = novosAlertas.filter(n => !closedNotifications.includes(n.id) && !prev.some(p => p.id === n.id));
      return [...prev, ...filtrar];
    });
  };

  const maskMoney = (v: string) => {
    const onlyNums = v.replace(/\D/g, "");
    if (!onlyNums) return "";
    return (Number(onlyNums) / 100).toFixed(2).replace(".", ",");
  };

  const maskDate = (v: string) => {
    const onlyNums = v.replace(/\D/g, "").slice(0, 8);
    if (onlyNums.length >= 5) return onlyNums.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
    if (onlyNums.length >= 3) return onlyNums.replace(/(\d{2})(\d{2})/, "$1/$2");
    return onlyNums;
  };

  const formatDisplayDate = (d: any) => {
    if (!d) return "";
    const clean = String(d).replace(/\D/g, "");
    const padded = clean.padStart(8, '0');
    return padded.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
  };

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, msg, title: type === 'success' ? 'SUCESSO' : 'ERRO', severity: type === 'success' ? 'success' : 'danger', icon: <Bell size={14} /> }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  const transacoesCards = transacoes.filter(t => {
    const d = new Date(t.created_at);
    return viewMode === "mes" ? (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) : (d.getFullYear() === anoAtual);
  });

  const entradasCard = transacoesCards.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saidasCard = transacoesCards.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const totalSaidasMes = transacoes.filter(t => {
    const d = new Date(t.created_at);
    return t.type === "saida" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((acc, t) => acc + Number(t.amount), 0);
  
  const orcamentoTotalMes = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeralMes = Math.min(Math.round((totalSaidasMes / orcamentoTotalMes) * 100), 100);
  const saldoGeral = transacoes.reduce((acc, t) => t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0);

  async function handleAddFixed() {
    try {
      if (!fixoNome || !fixoValor || fixoData.length < 10) return notify("Preencha tudo!", "error");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("fixed_expenses").insert({ user_id: user?.id, name: fixoNome.trim().toUpperCase(), amount: parseFloat(fixoValor.replace(",", ".")), due_day: fixoData.replace(/\D/g, "") });
      if (error) throw error;
      notify("Sentença Fixa Salva!");
      setShowFixedModal(false); setFixoNome(""); setFixoValor(""); setFixoData("");
      loadData();
    } catch (e) { notify("Erro ao salvar", "error"); }
  }

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white bg-black min-h-screen font-sans">
      
      {/* HEADER & SALDO (Sua base original) */}
      <div className="flex flex-col gap-2 w-full pt-4">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase italic">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 italic"><Plus size={14} strokeWidth={3} /> NOVA TRANSAÇÃO</button>
        </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase mb-1 italic">Saldo Disponível (Total)</p>
        <h2 className="text-4xl font-black italic">R$ {saldoGeral.toLocaleString('pt-BR')}</h2>
      </div>

      <div className="flex flex-col gap-3">
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 relative">
            <p className="text-green-500 text-[9px] font-black uppercase mb-1 italic">Entradas ({viewMode === 'mes' ? 'Mês' : 'Ano'})</p>
            <h2 className="text-4xl font-black italic text-green-500">R$ {entradasCard.toLocaleString('pt-BR')}</h2>
            <div className="absolute right-6 top-[55%] -translate-y-1/2 flex gap-1.5">
              <button onClick={() => setViewMode("mes")} className={`px-3 py-2 rounded-lg border-2 font-black text-[7px] italic ${viewMode === 'mes' ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' : 'border-zinc-800 text-zinc-500'}`}>MÊS</button>
              <button onClick={() => setViewMode("ano")} className={`px-3 py-2 rounded-lg border-2 font-black text-[7px] italic ${viewMode === 'ano' ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' : 'border-zinc-800 text-zinc-500'}`}>ANO</button>
            </div>
          </div>
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
            <p className="text-red-500 text-[9px] font-black uppercase mb-1 italic">Saídas ({viewMode === 'mes' ? 'Mês' : 'Ano'})</p>
            <h2 className="text-4xl font-black italic text-red-500">R$ {saidasCard.toLocaleString('pt-BR')}</h2>
          </div>
      </div>

      {/* NOVO: GRÁFICO DE RASTREAMENTO DIÁRIO (30 DIAS) */}
      <div className="bg-[#0c0c0c] pt-8 pb-4 rounded-[2rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
        <div className="px-8 mb-6">
          <h3 className="text-sm font-black italic uppercase tracking-widest text-zinc-400">Rastreamento Diário</h3>
          <p className="text-[10px] text-zinc-600 font-bold uppercase italic">Fluxo de gastos das categorias</p>
        </div>

        <div className="overflow-x-auto px-4 pb-4 scrollbar-hide">
          <div style={{ width: `${timelineData.width}px` }} className="relative h-[220px]">
            {/* Grade Pontilhada */}
            <svg width={timelineData.width} height="180" className="absolute inset-0">
              <defs>
                <pattern id="grid" width="65" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="#1a1a1a" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            <svg width={timelineData.width} height="180" className="relative overflow-visible">
              {timelineData.series.map((serie, sIdx) => {
                const pathData = solvePath(serie.pontos, 180, timelineData.maxValor);
                if (!pathData) return null;
                return (
                  <g key={sIdx}>
                    <defs>
                      <linearGradient id={`grad-${sIdx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={serie.cor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={serie.cor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${pathData} L ${serie.pontos[serie.pontos.length-1].x} 180 L ${serie.pontos[0].x} 180 Z`} fill={`url(#grad-${sIdx})`} />
                    <path d={pathData} fill="none" stroke={serie.cor} strokeWidth="3" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${serie.cor}44)` }} />
                    {serie.pontos.map((p, pIdx) => p.y > 0 && (
                      <circle key={pIdx} cx={p.x} cy={180 - (p.y / timelineData.maxValor) * 140} r="3.5" fill={serie.cor} stroke="#000" strokeWidth="2" />
                    ))}
                  </g>
                );
              })}
            </svg>

            <div className="flex justify-between mt-4 border-t border-white/5 pt-2">
              {timelineData.series[0].pontos.map((p, i) => (
                <div key={i} style={{ width: '65px' }} className="flex-shrink-0 text-center text-[8px] font-black text-zinc-700 italic">{p.dia}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO DONUT (Sua base original) */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center">
        <span className="text-zinc-500 text-[10px] font-black uppercase mb-10 self-start italic">Uso do Orçamento (Mês)</span>
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={70} fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {/* Renderizar segmentos baseado nas categorias dos limites... */}
            {MASTER_CATS.map((cat) => {
                const gastoCat = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === cat.nome.toLowerCase() && new Date(t.created_at).getMonth() === mesAtual).reduce((acc, t) => acc + Number(t.amount), 0);
                if (gastoCat <= 0) return null;
                const circunferencia = 2 * Math.PI * 70;
                return <circle key={cat.nome} cx="80" cy="80" r={70} fill="none" stroke={cat.cor} strokeWidth="20" strokeDasharray={`${(gastoCat/totalSaidasMes) * circunferencia} ${circunferencia}`} strokeLinecap="round" />;
            })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic">{porcentagemGeralMes}%</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase italic">Gasto</span>
          </div>
        </div>
        <p className="text-zinc-500 font-black text-[11px] uppercase italic text-center">
          <span className="text-white text-base">R$ {totalSaidasMes.toLocaleString('pt-BR')}</span> DE R$ {orcamentoTotalMes.toLocaleString('pt-BR')}
        </p>
      </div>

      {/* LIMITES & ATIVIDADE (Suas seções finais permanecem aqui) */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-8">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Limites por Categoria</h3>
        <div className="space-y-6">
          {metas.map(meta => {
            const gastoCatMes = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase() && new Date(t.created_at).getMonth() === mesAtual).reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCatMes / Number(meta.amount)) * 100, 100);
            return (
              <div key={meta.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase italic">{meta.category}</span>
                  <span className="text-[10px] font-black text-zinc-400">R$ {gastoCatMes.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${gastoCatMes > meta.amount ? "bg-red-500" : "bg-yellow-400"}`} style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL TRANSAÇÃO (Suas lógicas originais) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-center">Novo Registro</h2>
            <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-3xl font-black italic outline-none text-center focus:border-yellow-400 mb-6" />
            <button onClick={() => setShowModal(false)} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px]">Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
}
