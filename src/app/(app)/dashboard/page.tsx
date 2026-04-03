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

  // Sistema de Notificação
  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  // Máscaras
  const maskMoney = (v: string) => {
    v = v.replace(/\D/g, "");
    v = (Number(v) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    return v;
  };

  const maskDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length >= 5) v = v.replace(/^(\d{2})(\d{2})(\d{0,4}).*/, "$1/$2/$3");
    else if (v.length >= 3) v = v.replace(/^(\d{2})(\d{0,2}).*/, "$1/$2");
    return v;
  };

  async function handleAddFixed() {
    if (!fixoNome || !fixoValor || fixoData.length < 10) return notify("Preencha todos os campos corretamente", "error");
    
    const { data: { user } } = await supabase.auth.getUser();
    const rawValor = parseFloat(fixoValor.replace(/\./g, "").replace(",", "."));
    
    const { error } = await supabase.from("fixed_expenses").insert({
      user_id: user?.id,
      name: fixoNome,
      amount: rawValor,
      due_date: fixoData.replace(/\//g, "") // Salva 31032026
    });

    if (!error) {
      notify("Gasto fixo adicionado!");
      setShowFixedModal(false);
      setFixoNome(""); setFixoValor(""); setFixoData("");
      loadData();
    }
  }

  async function deleteFixed(id: string) {
    const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
    if (!error) {
      notify("Gasto removido", "success");
      loadData();
    }
  }

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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white relative">
      
      {/* NOTIFICAÇÕES FLOATING */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border font-black italic uppercase text-[10px] tracking-widest animate-in slide-in-from-right shadow-2xl ${n.type === 'success' ? 'bg-green-500 border-white/20 text-black' : 'bg-red-600 border-white/20 text-white'}`}>
            <Bell size={14} /> {n.msg}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition">
            <Plus size={14} strokeWidth={3} /> NOVA TRANSAÇÃO
          </button>
        </div>
      </div>

      {/* SALDO E TOTAIS */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic">R$ {saldo.toLocaleString('pt-BR')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
          <p className="text-green-500 text-[8px] font-black uppercase italic mb-1">Entradas</p>
          <p className="text-xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
          <p className="text-red-500 text-[8px] font-black uppercase italic mb-1">Saídas</p>
          <p className="text-xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* SEÇÃO GASTOS FIXOS */}
      <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Gastos Fixos</h3>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic text-red-500">Atenção ao Vencimento</p>
          </div>
          <button onClick={() => setShowFixedModal(true)} className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-1 active:scale-95 transition">
            <Zap size={12} fill="black" /> ADICIONAR
          </button>
        </div>
        
        <div className="space-y-3">
          {gastosFixos.map(gasto => (
            <div key={gasto.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition group">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 text-[8px] font-black p-1.5 rounded-md text-yellow-400 tracking-tighter">
                  {gasto.due_date || "DATA"}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase italic">{gasto.name}</p>
                  <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest italic">Sentença Fixa</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-black italic text-zinc-300">R$ {Number(gasto.amount).toLocaleString('pt-BR')}</p>
                <button onClick={() => deleteFixed(gasto.id)} className="text-zinc-700 hover:text-red-500 transition">
                  <Trash2 size={14} />
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
            {categoriasDosLimites.map((cat, idx) => {
               const gastoCat = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === cat.nome.toLowerCase()).reduce((acc, t) => acc + Number(t.amount), 0);
               if (gastoCat <= 0) return null;
               const circunferencia = 2 * Math.PI * 70;
               const percentual = gastoCat / (saídas || 1);
               const strokeDasharray = `${percentual * circunferencia} ${circunferencia}`;
               // Cálculo simplificado de acumulado para o mobile
               let offset = 0;
               return <circle key={cat.nome} cx="80" cy="80" r={70} fill="none" stroke={cat.cor} strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={0} strokeLinecap="round" />;
            })}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic">{porcentagemGeral}%</span>
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
      </div>

      {/* MODAL GASTO FIXO (NOVO) */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-yellow-400 italic">Nova Sentença Fixa</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 italic ml-2">Identificação</label>
                <input type="text" placeholder="NOME DO GASTO" value={fixoNome} onChange={e => setFixoNome(e.target.value.toUpperCase())} className="w-full bg-black border border-white/5 p-4 rounded-2xl text-xs font-black italic outline-none focus:border-yellow-400" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 italic ml-2">Valor da Sentença</label>
                <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={fixoValor} onChange={e => setFixoValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/5 p-4 rounded-2xl text-xs font-black italic outline-none focus:border-yellow-400" />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 italic ml-2">Dia do Vencimento</label>
                <input type="text" inputMode="numeric" placeholder="00/00/0000" value={fixoData} onChange={e => setFixoData(maskDate(e.target.value))} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs font-black italic outline-none focus:border-yellow-400" />
                <p className="text-[7px] text-zinc-600 font-bold italic ml-2">*INSIRA O DIA, MÊS E ANO</p>
              </div>
            </div>

            <button onClick={handleAddFixed} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-8 active:scale-95 transition">Confirmar</button>
            <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-widest mt-2">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL TRANSAÇÃO (EXISTENTE) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-center italic">Novo Registro</h2>
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-6">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>
            
            <input type="text" inputMode="numeric" placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-3xl font-black italic outline-none text-center focus:border-yellow-400 mb-6" />
            
            <button onClick={async () => {
                const valorLimpo = parseFloat(valor.replace(/\./g, "").replace(",", "."));
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({ user_id: user?.id, type: tipo, category: tipo === 'saida' ? catSel : 'Receita', amount: valorLimpo });
                notify("Transação registrada!");
                setShowModal(false); setValor(""); loadData();
            }} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mb-3">Confirmar</button>
            <button onClick={() => setShowModal(false)} className="w-full text-zinc-500 font-black text-[9px] uppercase">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
