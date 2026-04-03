"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Zap, Trash2 } from "lucide-react";

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
  const [gastosFixos, setGastosFixos] = useState<any[]>([]);
  
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");

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
        supabase.from("fixed_expenses").select("*").eq("user_id", user.id)
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
      setGastosFixos(f.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;
  const orcamentoTotal = metas.reduce((acc, m) => acc + Number(m.amount), 0) || 1;
  const porcentagemGeral = Math.min(Math.round((saídas / orcamentoTotal) * 100), 100);

  // IMPORTANTE: Aqui pegamos as categorias que estão nos LIMITES (Metas)
  const categoriasDosLimites = MASTER_CATS.filter(cat => 
    metas.some(m => m.category?.toLowerCase() === cat.nome.toLowerCase())
  );

  const renderDonutChartSegments = () => {
    const raio = 70;
    const circunferencia = 2 * Math.PI * raio;
    let acumulado = 0;
    if (saídas <= 0) return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1a1a1a" strokeWidth="20" />;

    return categoriasDosLimites.map((cat) => {
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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white">
      
      {/* HEADER */}
      <div className="flex flex-col gap-2 w-full">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">DASHBOARD</h1>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            <Plus size={14} strokeWidth={3} /> NOVA TRANSAÇÃO
          </button>
        </div>
      </div>

      {/* CARD SALDO */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic">R$ {saldo.toLocaleString('pt-BR')}</h2>
      </div>
      
      {/* ENTRADAS / SAÍDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
            <p className="text-green-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Entradas</p>
            <h2 className="text-3xl font-black italic text-green-500">R$ {entradas.toLocaleString('pt-BR')}</h2>
          </div>
          <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5">
            <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Saídas</p>
            <h2 className="text-3xl font-black italic text-red-500">R$ {saídas.toLocaleString('pt-BR')}</h2>
          </div>
      </div>

      {/* GASTOS FIXOS (Conforme as fotos) */}
      <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Gastos Fixos</h3>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest italic">Veredito Mensal</p>
          </div>
          <button className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-1 shadow-lg shadow-yellow-400/20">
            <Zap size={12} fill="black" /> Adicionar
          </button>
        </div>
        
        {gastosFixos.map(gasto => (
          <div key={gasto.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-800 text-[8px] font-black p-1 rounded-md text-yellow-400">31032026</div>
              <div>
                <p className="text-[10px] font-black uppercase italic">{gasto.name}</p>
                <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest">Sentença Fixa</p>
              </div>
            </div>
            <p className="text-xs font-black italic">R$ {Number(gasto.amount).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

      {/* USO DO ORÇAMENTO (GRÁFICO) */}
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
        
        {/* LEGENDA CORRIGIDA: Mostra todos que têm LIMITES */}
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

      {/* LIMITES POR CATEGORIA */}
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
                  <div className={`h-full transition-all duration-1000 ${excedeu ? "bg-red-500" : "bg-yellow-400"}`} style={{ width: `${progresso}%` }} />
                </div>
                {excedeu && <div className="w-full h-[2px] bg-red-500/50 shadow-[0_0_8px_#ef4444]" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ATIVIDADE RECENTE */}
      <div className="bg-[#111] pt-12 pb-8 px-8 rounded-[1.5rem] border border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Atividade</h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Recentes</span>
        </div>
        <div className="space-y-3">
          {transacoes.slice(0, 3).map((t) => {
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
          <button onClick={() => router.push("/historico")} className="w-full py-4 mt-2 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em]">
            Ver atividade Completa →
          </button>
        </div>
      </div>

      {/* MODAL TRANSAÇÃO (Simplified) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[1.5rem] p-8 border border-white/10 shadow-2xl">
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

            <input type="text" inputMode="decimal" placeholder="R$ 0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-3xl font-black italic outline-none text-center focus:border-yellow-400 mb-6" />
            
            <button onClick={async () => {
                const valorLimpo = valor.replace(/\./g, "").replace(",", ".");
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({ user_id: user?.id, type: tipo, category: tipo === 'saida' ? catSel : 'Receita', amount: parseFloat(valorLimpo) });
                setShowModal(false); setValor(""); loadData();
            }} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest mb-3">Confirmar</button>
            <button onClick={() => setShowModal(false)} className="w-full text-zinc-500 font-black text-[9px] uppercase">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
