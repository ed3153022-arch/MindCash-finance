"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Zap, Trash2, X, Bell } from "lucide-react";

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
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: 'success' | 'error'}[]>([]);
  
  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [gastosFixos, setGastosFixos] = useState<any[]>([]);
  
  // States para novos registros
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");
  
  // States para Gasto Fixo
  const [fixoNome, setFixoNome] = useState("");
  const [fixoValor, setFixoValor] = useState("");
  const [fixoData, setFixoData] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const [m, t, f] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id).order("due_date", { ascending: true })
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
      setGastosFixos(f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  // Funções de Máscara
  const maskMoney = (v: string) => {
    v = v.replace(/\D/g, "");
    if (!v) return "";
    const val = (Number(v) / 100).toFixed(2);
    return val.replace(".", ",");
  };

  const maskDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
  };

  // ADICIONAR GASTO FIXO (FIXED)
  async function handleAddFixed() {
    try {
      if (!fixoNome || !fixoValor || !fixoData) {
        notify("Preencha todos os campos!", "error");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      const cleanValor = parseFloat(fixoValor.replace(",", "."));
      const cleanData = fixoData.replace(/\//g, ""); // Remove barras para o badge

      const { error } = await supabase.from("fixed_expenses").insert({
        user_id: user?.id,
        name: fixoNome,
        amount: cleanValor,
        due_date: cleanData
      });

      if (error) throw error;

      notify("Sentença fixa salva!");
      setShowFixedModal(false);
      setFixoNome(""); setFixoValor(""); setFixoData("");
      loadData();
    } catch (e) {
      notify("Erro ao salvar", "error");
      console.error(e);
    }
  }

  async function deleteFixed(id: string) {
    const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
    if (!error) {
      notify("Sentença removida");
      loadData();
    }
  }

  // Cálculos Gerais
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  const categoriasDosLimites = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white font-sans">
      
      {/* NOTIFICAÇÕES (Sistema de Alerta) */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-l-4 font-black italic uppercase text-[10px] tracking-widest shadow-2xl animate-in fade-in slide-in-from-top-4 ${n.type === 'success' ? 'bg-[#111] border-green-500 text-white' : 'bg-[#111] border-red-500 text-white'}`}>
            <Bell size={14} className={n.type === 'success' ? 'text-green-500' : 'text-red-500'} />
            {n.msg}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            <Plus size={14} strokeWidth={4} /> NOVA TRANSAÇÃO
          </button>
        </div>
      </div>

      {/* CARD SALDO */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic">R$ {saldo.toLocaleString('pt-BR')}</h2>
      </div>

      {/* GASTOS FIXOS SECTION */}
      <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Gastos Fixos</h3>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic">Veredito Mensal</p>
          </div>
          <button onClick={() => setShowFixedModal(true)} className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-1 shadow-lg shadow-yellow-400/10">
            <Zap size={12} fill="black" /> ADICIONAR
          </button>
        </div>
        
        <div className="space-y-3">
          {gastosFixos.map(gasto => (
            <div key={gasto.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 group relative">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800/80 px-2 py-1 rounded-lg border border-yellow-400/20">
                   <p className="text-yellow-400 text-[9px] font-black italic">{gasto.due_date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase italic leading-none">{gasto.name}</p>
                  <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Sentença Fixa</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-black italic">R$ {Number(gasto.amount).toLocaleString('pt-BR')}</p>
                <button onClick={() => deleteFixed(gasto.id)} className="text-zinc-700 hover:text-red-500 transition">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRÁFICO E LEGENDA */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 self-start italic">Uso do Orçamento</span>
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={70} fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {/* Lógica de fatias aqui... */}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic mt-2">Gasto</span>
          </div>
        </div>
        
        {/* LEGENDA CORRIGIDA */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 w-full">
          {categoriasDosLimites.map(c => (
            <div key={c.nome} className="flex flex-col items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.cor }} />
              <span className="text-2xl">{c.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL GASTO FIXO (NOVA SENTENÇA) */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-8 text-yellow-400 italic italic">Nova Sentença Fixa</h2>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 italic ml-2">Identificação</label>
                <input 
                  type="text" 
                  placeholder="NOME DO GASTO" 
                  value={fixoNome} 
                  onChange={e => setFixoNome(e.target.value.toUpperCase())} 
                  className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic outline-none focus:border-yellow-400 transition-all text-white placeholder:text-zinc-800" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 italic ml-2">Valor da Sentença</label>
                <div className="relative">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 font-black italic text-xs">R$</span>
                   <input 
                    type="text" 
                    inputMode="numeric" 
                    placeholder="0,00" 
                    value={fixoValor} 
                    onChange={e => setFixoValor(maskMoney(e.target.value))} 
                    className="w-full bg-black border border-white/5 p-5 pl-12 rounded-2xl text-[11px] font-black italic outline-none focus:border-yellow-400 transition-all text-white" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 italic ml-2">Dia do Vencimento</label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  placeholder="00/00/0000" 
                  value={fixoData} 
                  onChange={e => setFixoData(maskDate(e.target.value))} 
                  className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[11px] font-black italic outline-none focus:border-yellow-400 transition-all text-white" 
                />
                <p className="text-[7px] text-zinc-600 font-bold italic ml-2 mt-2 uppercase">*Insira o dia, mês e ano</p>
              </div>
            </div>

            <button 
              onClick={handleAddFixed} 
              className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-10 shadow-xl shadow-yellow-400/10 active:scale-95 transition-all"
            >
              Confirmar
            </button>
            <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-widest mt-2 hover:text-white transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL TRANSAÇÃO (NOVO REGISTRO) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-center italic">Novo Registro</h2>
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-6">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>
            
            <input 
              type="text" 
              inputMode="numeric" 
              placeholder="R$ 0,00" 
              value={valor} 
              onChange={(e) => setValor(maskMoney(e.target.value))} 
              className="w-full bg-black border border-white/10 p-5 rounded-2xl text-3xl font-black italic outline-none text-center focus:border-yellow-400 mb-6" 
            />
            
            <button 
              onClick={async () => {
                const cleanValor = parseFloat(valor.replace(",", "."));
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({ user_id: user?.id, type: tipo, category: tipo === 'saida' ? catSel : 'Receita', amount: cleanValor });
                notify("Registro realizado!");
                setShowModal(false); setValor(""); loadData();
              }} 
              className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
            >
              Confirmar
            </button>
            <button onClick={() => setShowModal(false)} className="w-full text-zinc-500 font-black text-[9px] uppercase mt-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
