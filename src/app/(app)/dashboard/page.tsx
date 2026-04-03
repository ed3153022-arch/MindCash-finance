"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Zap, X, Bell, AlertTriangle, Info } from "lucide-react";

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
  const [notifications, setNotifications] = useState<any[]>([]);
  
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
      
      // Gera os alertas automáticos após carregar
      gerarAlertasSincronizados(m.data || [], t.data || [], f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  // Lógica de Alertas estilo Celular
  const gerarAlertasSincronizados = (metasData: any[], transData: any[], fixosData: any[]) => {
    const novosAlertas: any[] = [];
    const hoje = new Date();
    const hojeStr = hoje.toLocaleDateString('pt-BR').replace(/\//g, ""); // "03042026"

    // 1. Alerta de Gasto Fixo (Vence Hoje)
    fixosData.forEach(gasto => {
      if (gasto.due_day === hojeStr) {
        novosAlertas.push({
          id: `fixo-${gasto.id}`,
          title: "VENCIMENTO HOJE",
          msg: `Sua sentença "${gasto.name}" vence hoje!`,
          type: "warning",
          icon: <Zap size={14} className="text-yellow-400" />
        });
      }
    });

    // 2. Alerta de Limite Excedido
    metasData.forEach(meta => {
      const gastoCat = transData
        .filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase())
        .reduce((acc, t) => acc + Number(t.amount), 0);
      
      if (gastoCat > Number(meta.amount)) {
        novosAlertas.push({
          id: `meta-${meta.id}`,
          title: "LIMITE EXCEDIDO",
          msg: `Você ultrapassou o limite de ${meta.category}!`,
          type: "danger",
          icon: <AlertTriangle size={14} className="text-red-500" />
        });
      }
    });

    // 3. Notificação de Melhoria (Sistema)
    novosAlertas.push({
      id: "update-1",
      title: "MINDCASH UPDATE",
      msg: "Sistema de monitoramento de sentenças fixas ativado.",
      type: "info",
      icon: <Info size={14} className="text-blue-400" />
    });

    setNotifications(novosAlertas);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Máscaras e Helpers
  const maskMoney = (v: string) => {
    const onlyNums = v.replace(/\D/g, "");
    return onlyNums ? (Number(onlyNums) / 100).toFixed(2).replace(".", ",") : "";
  };

  const maskDate = (v: string) => {
    const onlyNums = v.replace(/\D/g, "").slice(0, 8);
    if (onlyNums.length >= 5) return onlyNums.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
    if (onlyNums.length >= 3) return onlyNums.replace(/(\d{2})(\d{2})/, "$1/$2");
    return onlyNums;
  };

  const formatDisplayDate = (d: any) => {
    const clean = String(d || "").replace(/\D/g, "");
    const padded = clean.length === 7 ? "0" + clean : clean;
    return padded.length === 8 ? padded.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3") : d;
  };

  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white bg-black min-h-screen font-sans overflow-x-hidden">
      
      {/* CENTRAL DE NOTIFICAÇÕES (ESTILO IOS/ANDROID) */}
      <div className="fixed top-4 right-4 left-4 z-[200] flex flex-col gap-3 pointer-events-none">
        {notifications.map((n, i) => (
          <div 
            key={n.id} 
            className="pointer-events-auto animate-in slide-in-from-top-10 duration-500 bg-[#111]/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl flex gap-4 items-start"
            style={{ zIndex: 200 - i }}
          >
            <div className={`p-2 rounded-2xl bg-black border border-white/5`}>
              {n.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-black italic uppercase tracking-tighter text-zinc-400">{n.title}</h4>
              <p className="text-[11px] font-bold italic uppercase leading-tight mt-0.5">{n.msg}</p>
            </div>
            <button onClick={() => removeNotification(n.id)} className="text-zinc-600 p-1">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mt-8">DASHBOARD</h1>

      {/* SALDO PRINCIPAL */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[2rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic">R$ {saldo.toLocaleString('pt-BR')}</h2>
        <div className="flex gap-4 mt-6">
          <button onClick={() => setShowModal(true)} className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase italic flex items-center justify-center gap-2">
            <Plus size={14} strokeWidth={3} /> Nova Transação
          </button>
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 px-6 rounded-2xl border border-white/5 font-black text-[10px] uppercase italic">🎯 Limites</button>
        </div>
      </div>

      {/* GASTOS FIXOS */}
      <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black italic uppercase tracking-tighter">Sentenças Fixas</h3>
          <button onClick={() => setShowFixedModal(true)} className="bg-zinc-800 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase border border-white/5 italic">
            + Adicionar
          </button>
        </div>
        <div className="space-y-3">
          {gastosFixos.map(gasto => (
            <div key={gasto.id} className="flex justify-between items-center bg-black/40 p-4 rounded-[1.5rem] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-900 text-[9px] font-black px-2 py-1 rounded-lg text-yellow-400 border border-yellow-400/10 italic">
                  {formatDisplayDate(gasto.due_day)}
                </div>
                <p className="text-[10px] font-black uppercase italic leading-none">{gasto.name}</p>
              </div>
              <p className="text-xs font-black italic">R$ {Number(gasto.amount).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL GASTO FIXO */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[250] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in slide-in-from-bottom-20">
            <h2 className="text-2xl font-black italic uppercase mb-8 text-yellow-400">Nova Sentença</h2>
            <div className="space-y-4">
              <input type="text" placeholder="NOME" value={fixoNome} onChange={e => setFixoNome(e.target.value)} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none" />
              <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={fixoValor} onChange={e => setFixoValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none" />
              <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" value={fixoData} onChange={e => setFixoData(maskDate(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none" />
            </div>
            <button 
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                const valorNum = parseFloat(fixoValor.replace(",", "."));
                const dataLimpa = fixoData.replace(/\D/g, "");
                await supabase.from("fixed_expenses").insert({ user_id: user?.id, name: fixoNome.toUpperCase(), amount: valorNum, due_day: dataLimpa });
                setShowFixedModal(false); setFixoNome(""); setFixoValor(""); setFixoData(""); loadData();
              }} 
              className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] mt-8"
            >
              Confirmar Sentença
            </button>
            <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase mt-2">Fechar</button>
          </div>
        </div>
      )}

      {/* MODAL TRANSAÇÃO (REUTILIZANDO O QUE JÁ FUNCIONA) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[250] flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 animate-in slide-in-from-bottom-20">
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-6">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>
            <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={valor} onChange={e => setValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/10 p-6 rounded-2xl text-4xl font-black italic outline-none text-center mb-6" />
            {tipo === "saida" && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {MASTER_CATS.map(c => (
                  <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-2 rounded-xl border flex flex-col items-center ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black"}`}>
                    <span className="text-lg">{c.emoji}</span>
                    <span className="text-[6px] font-black uppercase">{c.nome}</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={async () => {
                const valorNum = parseFloat(valor.replace(",", "."));
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({ user_id: user?.id, type: tipo, category: tipo === 'saida' ? catSel : 'Receita', amount: valorNum });
                setShowModal(false); setValor(""); loadData();
            }} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px]">Confirmar Registro</button>
            <button onClick={() => setShowModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase mt-2">Voltar</button>
          </div>
        </div>
      )}

    </div>
  );
}
