"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Zap, Trash2, X, Bell, AlertTriangle, Info } from "lucide-react";

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
  
  // --- SISTEMA DE NOTIFICAÇÕES (ESTADOS) ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [closedNotifications, setClosedNotifications] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("alertas_silenciados");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("alertas_silenciados", JSON.stringify(closedNotifications));
  }, [closedNotifications]);

  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setClosedNotifications(prev => [...prev, id]);
  };

  // --- LÓGICA DE ALERTAS DINÂMICOS ---
  const gerarAlertasDinamicos = (metasData: any[], transData: any[], fixosData: any[]) => {
    const novosAlertas: any[] = [];
    const hoje = new Date();
    const hojeStr = `${hoje.getDate()}${hoje.getMonth() + 1}${hoje.getFullYear()}`;
    const diaHoje = String(hoje.getDate()).padStart(2, '0');

    // Verifica Vencimentos de hoje (Extraindo dia do int4)
    fixosData.forEach(gasto => {
      const dataCompleta = String(gasto.due_day).padStart(8, '0');
      const diaGasto = dataCompleta.slice(0, 2);

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

    // Verifica Limites/Metas
    metasData.forEach(meta => {
      const gastoCat = transData
        .filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase())
        .reduce((acc, t) => acc + Number(t.amount), 0);
      const limite = Number(meta.amount);
      if (gastoCat >= limite) {
        novosAlertas.push({
          id: `meta-${meta.id}-${gastoCat}`, 
          title: gastoCat > limite ? "EXECUÇÃO DE LIMITE" : "TETO ALCANÇADO",
          msg: gastoCat > limite 
            ? `VEREDITO: ${meta.category.toUpperCase()} excedeu o teto em R$ ${(gastoCat - limite).toLocaleString('pt-BR')}.`
            : `ALERTA: Você atingiu o teto de R$ ${limite.toLocaleString('pt-BR')} em ${meta.category.toUpperCase()}.`,
          severity: gastoCat > limite ? "danger" : "info",
          icon: gastoCat > limite ? <AlertTriangle size={14} /> : <Info size={14} />
        });
      }
    });

    setNotifications(prev => {
      const filtrar = novosAlertas.filter(n => !closedNotifications.includes(n.id) && !prev.some(p => p.id === n.id));
      return [...prev, ...filtrar];
    });
  };

  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [gastosFixos, setGastosFixos] = useState<any[]>([]);
  
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");

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
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id).order("due_day", { ascending: true })
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
      setGastosFixos(f.data || []);

      // DISPARA OS ALERTAS APÓS CARREGAR OS DADOS
      gerarAlertasDinamicos(m.data || [], t.data || [], f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { 
      id, 
      msg, 
      title: type === 'success' ? 'SUCESSO' : 'ERRO', 
      severity: type === 'success' ? 'success' : 'danger',
      icon: <Bell size={14} />
    }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
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

  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  const categoriasDosLimites = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  async function handleAddFixed() {
    try {
      if (!fixoNome || !fixoValor || fixoData.length < 10) return notify("Preencha tudo!", "error");
      const { data: { user } } = await supabase.auth.getUser();
      const valorNum = parseFloat(fixoValor.replace(",", "."));
      const dataLimpa = fixoData.replace(/\D/g, "");

      const { error } = await supabase.from("fixed_expenses").insert({
        user_id: user?.id, name: fixoNome.trim().toUpperCase(), amount: valorNum, due_day: dataLimpa
      });

      if (error) throw error;
      notify("Sentença Fixa Salva!");
      setShowFixedModal(false); setFixoNome(""); setFixoValor(""); setFixoData("");
      loadData();
    } catch (e) { notify("Erro ao salvar", "error"); }
  }

  async function deleteFixed(id: string) {
    await supabase.from("fixed_expenses").delete().eq("id", id);
    loadData();
    notify("Sentença removida");
  }

  const renderDonutChartSegments = () => {
    const raio = 70;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;
    if (saídas <= 0) return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1a1a1a" strokeWidth="20" />;

    return categoriasDosLimites.map((cat) => {
      const gastoCat = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === cat.nome.toLowerCase()).reduce((acc, t) => acc + Number(t.amount), 0);
      if (gastoCat <= 0) return null;
      const percentual = gastoCat / saídas;
      const strokeDasharray = `${percentual * circunferencia} ${circunferencia}`;
      const strokeDashoffset = -acumulado * circunferencia;
      acumulado += percentual;
      return <circle key={cat.nome} cx="80" cy="80" r={raio} fill="none" stroke={cat.cor} strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />;
    });
  };

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white bg-black min-h-screen font-sans">
      
      {/* HUD DE NOTIFICAÇÕES DINÂMICAS */}
      <div className="fixed top-4 right-4 left-4 z-[999] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className={`pointer-events-auto bg-[#0a0a0a]/95 backdrop-blur-xl border-2 p-4 rounded-[2rem] shadow-2xl flex gap-4 items-start transition-all ${n.severity === 'danger' ? 'border-red-500/50' : n.severity === 'warning' ? 'border-yellow-500/50' : n.severity === 'info' ? 'border-blue-500/50' : 'border-green-500/50'}`}>
            <div className={`p-3 rounded-2xl bg-black border border-white/5 flex-shrink-0 ${n.severity === 'danger' ? 'text-red-500' : n.severity === 'warning' ? 'text-yellow-400' : n.severity === 'info' ? 'text-blue-400' : 'text-green-500'}`}>
              {n.icon || <Bell size={14} />}
            </div>
            <div className="flex-1">
              <h4 className="text-[9px] font-black italic uppercase tracking-[0.15em] text-zinc-500 mb-0.5">{n.title}</h4>
              <p className="text-[11px] font-black italic uppercase leading-tight text-white/95">{n.msg}</p>
            </div>
            <button onClick={() => closeNotification(n.id)} className="text-zinc-600 p-1 hover:text-white transition-colors">
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="flex flex-col gap-2 w-full pt-4">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 italic">
            <Plus size={14} strokeWidth={3} /> NOVA TRANSAÇÃO
          </button>
        </div>
      </div>

      {/* SALDO & RESUMO */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic">R$ {saldo.toLocaleString('pt-BR')}</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5">
            <p className="text-green-500 text-[8px] font-black uppercase italic mb-1">Entradas</p>
            <h2 className="text-xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</h2>
          </div>
          <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5">
            <p className="text-red-500 text-[8px] font-black uppercase italic mb-1">Saídas</p>
            <h2 className="text-xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</h2>
          </div>
      </div>

      {/* GASTOS FIXOS */}
      <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Gastos Fixos</h3>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic">Veredito Mensal</p>
          </div>
          <button onClick={() => setShowFixedModal(true)} className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-1">
            <Zap size={12} fill="black" /> ADICIONAR
          </button>
        </div>
        
        <div className="space-y-3">
          {gastosFixos.map(gasto => (
            <div key={gasto.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 text-[9px] font-black px-2 py-1 rounded-md text-yellow-400 italic">
                  {formatDisplayDate(gasto.due_day)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase italic leading-none">{gasto.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-black italic">R$ {Number(gasto.amount).toLocaleString('pt-BR')}</p>
                <button onClick={() => deleteFixed(gasto.id)} className="text-zinc-800">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRÁFICO DONUT */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 self-start italic">Uso do Orçamento</span>
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={70} fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {renderDonutChartSegments()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic leading-none">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic mt-2">Gasto</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-8 w-full">
          {categoriasDosLimites.map(c => (
            <div key={c.nome} className="flex flex-col items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.cor }} />
              <span className="text-2xl">{c.emoji}</span>
            </div>
          ))}
        </div>
        <p className="text-zinc-500 font-black text-[11px] uppercase italic tracking-tight text-center">
          <span className="text-white text-base">R$ {saídas.toLocaleString('pt-BR')}</span> DE R$ {orcamentoTotal.toLocaleString('pt-BR')}
        </p>
      </div>

      {/* LIMITES */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-8">
        <h3 className="text-xl font-black italic uppercase tracking-tighter">Limites por Categoria</h3>
        <div className="space-y-6">
          {metas.map(meta => {
            const gastoCat = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase()).reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / Number(meta.amount)) * 100, 100);
            const excedeu = gastoCat > Number(meta.amount);
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());
            return (
              <div key={meta.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase italic">{catInfo?.emoji} {meta.category}</span>
                  <span className="text-[10px] font-black text-zinc-400">R$ {gastoCat.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${excedeu ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-yellow-400"}`} style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATIVIDADE */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Atividade</h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Recentes</span>
        </div>
        <div className="space-y-3">
          {transacoes.slice(0, 4).map((t) => {
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === t.category?.toLowerCase());
            return (
              <div key={t.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.type === 'entrada' ? "💰" : (catInfo?.emoji || "💸")}</span>
                  <div>
                    <p className="text-white font-black italic uppercase text-[10px] leading-none">{t.category}</p>
                    <p className="text-zinc-600 text-[8px] font-bold uppercase mt-1">{new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className={`text-sm font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-white'}`}>
                  {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR')}
                </span>
              </div>
            );
          })}
          <button onClick={() => router.push("/historico")} className="w-full py-4 mt-2 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic">
            Ver atividade Completa →
          </button>
        </div>
      </div>

      {/* MODAL NOVA TRANSAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-center">Novo Registro</h2>
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-6">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>
            {tipo === "saida" && (
              <div className="grid grid-cols-3 gap-2 mb-6 max-h-40 overflow-y-auto">
                {MASTER_CATS.map(c => (
                  <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-2 rounded-xl border transition-all flex flex-col items-center ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black/40"}`}>
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-[6px] font-black uppercase">{c.nome}</span>
                  </button>
                ))}
              </div>
            )}
            <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-3xl font-black italic outline-none text-center focus:border-yellow-400 mb-6" />
            <button onClick={async () => {
                const valorNum = parseFloat(valor.replace(",", "."));
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({ user_id: user?.id, type: tipo, category: tipo === 'saida' ? catSel : 'Receita', amount: valorNum });
                setShowModal(false); setValor(""); loadData(); notify("Registrado!");
            }} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] mb-3">Confirmar</button>
            <button onClick={() => setShowModal(false)} className="w-full text-zinc-500 font-black text-[9px] uppercase">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL GASTO FIXO */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-8 text-yellow-400">Nova Sentença Fixa</h2>
            <div className="space-y-6">
              <input type="text" placeholder="NOME DO GASTO" value={fixoNome} onChange={e => setFixoNome(e.target.value)} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none focus:border-yellow-400" />
              <input type="text" inputMode="numeric" placeholder="VALOR (0,00)" value={fixoValor} onChange={e => setFixoValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none focus:border-yellow-400" />
              <input type="text" inputMode="numeric" placeholder="00/00/0000" value={fixoData} onChange={e => setFixoData(maskDate(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none focus:border-yellow-400" />
            </div>
            <button onClick={handleAddFixed} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] mt-10 active:scale-95">Confirmar</button>
            <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase mt-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
