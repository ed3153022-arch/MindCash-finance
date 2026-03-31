"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Hourglass, Zap, X, Trash2, Calendar } from "lucide-react";

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
  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [ignoredExpenses, setIgnoredExpenses] = useState<string[]>([]);
  const [showFixedModal, setShowFixedModal] = useState(false);
  
  const [newFixed, setNewFixed] = useState({ name: '', amount: '', due_date: '' });

  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

      const [m, t, f] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", inicioMes)
          .order("created_at", { ascending: false }),
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id).order("due_day", { ascending: true })
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
      setFixedExpenses(f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const maskDate = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d+?)$/, "$1");
  };

  async function handleAddFixed() {
    if(!newFixed.name || !newFixed.amount || !newFixed.due_date) return alert("Preencha tudo!");
    
    const [d, m, y] = newFixed.due_date.split("/");
    const dataVencimento = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (isNaN(dataVencimento.getTime())) return alert("Data inválida!");

    const valorLimpo = newFixed.amount.toString().replace(/\./g, "").replace(",", ".");
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("fixed_expenses").insert({
      user_id: user?.id,
      name: newFixed.name.toUpperCase(),
      amount: parseFloat(valorLimpo),
      due_day: parseInt(d),
      full_due_date: dataVencimento.toISOString()
    });

    if(!error) { 
      setShowFixedModal(false); 
      setNewFixed({name:'', amount:'', due_date:''}); 
      loadData(); 
    }
  }

  async function handleDeleteFixed(id: string) {
    if(!confirm("Remover sentença fixa?")) return;
    await supabase.from("fixed_expenses").delete().eq("id", id);
    loadData();
  }

  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  const categoriasAtivas = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  const renderDonutChartSegments = () => {
    const raio = 70;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;
    if (saídas <= 0) return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1a1a1a" strokeWidth="20" />;

    return categoriasAtivas.map((cat) => {
      const gastoCat = transacoes
        .filter(t => t.type === "saida" && t.category?.toLowerCase() === cat.nome.toLowerCase())
        .reduce((acc, t) => acc + Number(t.amount), 0);
      if (gastoCat <= 0) return null;
      const percentual = gastoCat / saídas;
      const strokeDasharray = `${percentual * circunferencia} ${circunferencia}`;
      const strokeDashoffset = -acumulado * circunferencia;
      acumulado += percentual;
      return (
        <circle key={cat.nome} cx="80" cy="80" r={raio} fill="none" stroke={cat.cor} strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      );
    });
  };

  if (loading) return null;

  return (
    <>
      {/* NOTIFICAÇÕES */}
      <div className="fixed top-6 left-4 right-4 z-[110] space-y-3 pointer-events-none">
        {fixedExpenses.map((expense) => {
          if (ignoredExpenses.includes(expense.id)) return null;
          const hoje = new Date();
          hoje.setHours(0,0,0,0);
          const dataVenc = expense.full_due_date ? new Date(expense.full_due_date) : new Date(hoje.getFullYear(), hoje.getMonth(), expense.due_day);
          dataVenc.setHours(0,0,0,0);

          const diffTempo = dataVenc.getTime() - hoje.getTime();
          const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
          const venceHoje = diffDias === 0;
          const faltaPouco = diffDias <= 3 && diffDias > 0;

          if (!venceHoje && !faltaPouco) return null;

          return (
            <div key={expense.id} className={`pointer-events-auto p-4 rounded-[2rem] border backdrop-blur-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 relative ${venceHoje ? "bg-red-500/20 border-red-500/50" : "bg-zinc-900/90 border-white/10"}`}>
              <button onClick={() => setIgnoredExpenses([...ignoredExpenses, expense.id])} className="absolute top-4 right-4 text-zinc-500"><X size={14}/></button>
              <div className={`p-3 rounded-2xl ${venceHoje ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-yellow-400"}`}>
                {venceHoje ? <AlertTriangle size={18} className="text-white" /> : <Hourglass size={18} className="text-black" />}
              </div>
              <div className="flex-1 pr-6">
                <p className={`text-[8px] font-black tracking-widest ${venceHoje ? "text-red-500" : "text-yellow-400"}`}>{venceHoje ? "BLOQUEIO IMINENTE" : "SENTENÇA PRÓXIMA"}</p>
                <p className="text-xs font-black text-white italic leading-tight uppercase">{expense.name} | R$ {Number(expense.amount).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 w-full md:col-span-2">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-white">DASHBOARD</h1>
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Inteligência Financeira</p>
        <div className="grid grid-cols-2 gap-3 mt-4 md:max-w-sm">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition text-white">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition">+ Nova Transação</button>
        </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full md:col-span-2">
        <div className="px-2"> 
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
          <h2 className="text-4xl font-black italic text-white break-words">R$ {saldo.toLocaleString('pt-BR')}</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2 w-full">
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full">
            <div className="px-2">
              <p className="text-green-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Entradas</p>
              <h2 className="text-3xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</h2>
            </div>
          </div>
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full">
            <div className="px-2">
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Saídas</p>
              <h2 className="text-3xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</h2>
            </div>
          </div>
      </div>

      <div className="bg-[#111] pt-10 pb-8 px-8 rounded-[1.5rem] border border-white/5 w-full md:col-span-2 relative">
        <button onClick={() => setShowFixedModal(true)} className="absolute top-8 right-8 bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition flex items-center gap-2">
          <Zap size={12} fill="black" /> ADICIONAR
        </button>
        <div className="px-2 mb-8">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Gastos Fixos</h3>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Veredito Mensal</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
          {fixedExpenses.map(expense => (
            <div key={expense.id} className="bg-black/40 border border-white/5 p-5 rounded-[1.8rem] flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-zinc-900 border border-white/5 px-2 py-2 rounded-xl">
                  <span className="text-[8px] font-black text-zinc-700">//</span>
                  <span className="text-xs font-black text-yellow-400 italic">
                    {expense.full_due_date ? new Date(expense.full_due_date).toLocaleDateString('pt-BR', {day: '2-digit'}) : expense.due_day.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[8px] font-black text-zinc-700">//</span>
                </div>
                <div>
                  <p className="text-white font-black italic uppercase text-[10px] leading-none mb-1">{expense.name}</p>
                  <p className="text-zinc-600 text-[8px] font-bold uppercase mt-1">Sentença Fixa</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-black italic text-white">R$ {Number(expense.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <button onClick={() => handleDeleteFixed(expense.id)} className="text-zinc-800 hover:text-red-500 transition"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 flex flex-col items-center w-full">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 self-start italic px-2">Uso do Orçamento</span>
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={70} fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {renderDonutChartSegments()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic text-white leading-none">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic mt-2">Gasto</span>
          </div>
        </div>
      </div>

      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-10 w-full">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter px-2">Limites por Categoria</h3>
        <div className="space-y-10 px-2">
          {metas.map(meta => {
            const gastoCat = transacoes.filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase()).reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / Number(meta.amount)) * 100, 100);
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());
            return (
              <div key={meta.id} className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase italic text-white">{catInfo?.emoji} {meta.category}</span>
                  <span className="text-[10px] font-black text-zinc-400">R$ {gastoCat.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-1000 ${progresso >= 90 ? "bg-red-500" : "bg-yellow-400"}`} style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATIVIDADE RECENTE COM O BOTÃO DE VOLTA */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-8 w-full md:col-span-2">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Atividade</h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Recentes</span>
        </div>
        <div className="space-y-4 px-2">
          {transacoes.slice(0, 4).map((t) => {
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === t.category?.toLowerCase());
            return (
              <div key={t.id} className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{t.type === 'entrada' ? "💰" : (catInfo?.emoji || "💸")}</span>
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
          {/* BOTÃO REINTEGRADO ABAIXO */}
          <button onClick={() => router.push("/historico")} className="w-full py-5 mt-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-white tracking-[0.2em]">
            Ver atividade Completa →
          </button>
        </div>
      </div>

      {/* MODAL GASTO FIXO */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[120] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[1.5rem] pt-12 pb-8 px-8 border border-white/10 shadow-2xl text-white italic">
            <h2 className="text-2xl font-black italic uppercase text-yellow-400 mb-6 px-2 tracking-tighter">Nova Sentença Fixa</h2>
            <div className="space-y-5 mb-8 px-2">
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-1 italic tracking-widest mb-1 block">Identificação</label>
                <input placeholder="NOME DO GASTO" value={newFixed.name} onChange={(e)=>setNewFixed({...newFixed, name: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs font-black italic outline-none focus:border-yellow-400 uppercase" />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-1 italic tracking-widest mb-1 block">Valor</label>
                <input placeholder="0,00" inputMode="decimal" value={newFixed.amount} onChange={(e)=>setNewFixed({...newFixed, amount: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs font-black italic outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-1 italic tracking-widest mb-1 block">Vencimento (Dia/Mês/Ano)</label>
                <input placeholder="00/00/0000" inputMode="numeric" value={newFixed.due_date} onChange={(e)=>setNewFixed({...newFixed, due_date: maskDate(e.target.value)})} className="w-full bg-black border border-white/10 p-4 rounded-2xl text-xs font-black italic outline-none focus:border-yellow-400 text-white" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleAddFixed} className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Confirmar Sentença</button>
              <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANSAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[1.5rem] pt-12 pb-8 px-8 border border-white/10 shadow-2xl text-white">
            <h2 className="text-2xl font-black italic uppercase text-white mb-6 px-2">Novo Registro</h2>
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-6 border border-white/5">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>
            {tipo === "saida" && (
              <div className="grid grid-cols-3 gap-2 mb-6 max-h-[180px] overflow-y-auto pr-1">
                {MASTER_CATS.filter(c => metas.some(m => m.category.toLowerCase() === c.nome.toLowerCase())).map(c => (
                  <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-3 rounded-xl border transition-all flex flex-col items-center ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black/40"}`}>
                    <span className="text-xl mb-1">{c.emoji}</span>
                    <span className="text-[7px] font-black uppercase text-white text-center">{c.nome}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-1 mb-8 px-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 italic">Valor (R$)</label>
              <input type="text" inputMode="numeric" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-4xl font-black italic outline-none text-white focus:border-yellow-400" />
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                if(!valor || (tipo === 'saida' && !catSel)) return alert("Preencha tudo!");
                const valorLimpo = valor.toString().replace(/\./g, "").replace(",", ".");
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({ user_id: user?.id, type: tipo, category: tipo === 'saida' ? catSel : 'Receita', amount: parseFloat(valorLimpo) });
                setShowModal(false); setValor(""); loadData();
              }} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition">Confirmar</button>
              <button onClick={() => setShowModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
