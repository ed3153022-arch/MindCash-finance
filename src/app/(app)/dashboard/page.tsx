"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

      const [m, t] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).gte("created_at", inicioMes)
      ]);

      setMetas(m.data || []);
      setTransacoes(t.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
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

    if (saídas <= 0) {
      return <circle cx="80" cy="80" r={raio} fill="none" stroke="#1a1a1a" strokeWidth="20" strokeDasharray={`${circunferencia} ${circunferencia}`} />;
    }

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
        <circle 
          key={cat.nome} cx="80" cy="80" r={raio} fill="none" 
          stroke={cat.cor} strokeWidth="20" strokeDasharray={strokeDasharray} 
          strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000" 
        />
      );
    });
  };

  if (loading) return null;

  return (
    <>
      {/* HEADER - SOLTO */}
      <div className="flex flex-col gap-2 px-2 w-full">
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-white">DASHBOARD</h1>
        <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic">Inteligência Financeira</p>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={() => router.push("/metas")} className="bg-zinc-900 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition text-white">LIMITES 🎯</button>
          <button onClick={() => setShowModal(true)} className="bg-yellow-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition">+ Transação</button>
        </div>
      </div>

      {/* CARD SALDO - SOLTO */}
      <div className="bg-[#111] px-12 py-10 rounded-[2.5rem] border border-white/5 w-full">
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Saldo Disponível</p>
        <h2 className="text-4xl font-black italic text-white break-words">R$ {saldo.toLocaleString('pt-BR')}</h2>
      </div>
      
      {/* CARD SAÍDAS - SOLTO */}
      <div className="bg-[#111] px-12 py-8 rounded-[2.5rem] border border-white/5 w-full">
        <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Saídas</p>
        <h2 className="text-3xl font-black italic text-red-500 break-words">R$ {saídas.toLocaleString('pt-BR')}</h2>
      </div>

      {/* CARD ENTRADAS - SOLTO */}
      <div className="bg-[#111] px-12 py-8 rounded-[2.5rem] border border-white/5 w-full">
        <p className="text-green-500 text-[9px] font-black uppercase tracking-widest mb-1 italic">Total Entradas</p>
        <h2 className="text-3xl font-black italic text-green-500 break-words">R$ {entradas.toLocaleString('pt-BR')}</h2>
      </div>

      {/* GRÁFICO DE ROSCA - SOLTO */}
      <div className="bg-[#111] px-12 py-12 rounded-[3rem] border border-white/5 flex flex-col items-center w-full">
        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 self-start italic">Uso do Orçamento</span>
        
        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#1a1a1a" strokeWidth="18" />
            {renderDonutChartSegments()}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-6xl font-black italic text-white leading-none">{porcentagemGeral}%</span>
            <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase italic mt-2">Gasto</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-10 px-4">
          {categoriasAtivas.map(c => (
            <div key={c.nome} className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.cor }} />
              <span className="text-3xl">{c.emoji}</span>
            </div>
          ))}
        </div>

        <p className="text-zinc-500 font-black text-[11px] uppercase italic tracking-tight text-center">
          <span className="text-white text-base">R$ {saídas.toLocaleString('pt-BR')}</span> DE R$ {orcamentoTotal.toLocaleString('pt-BR')}
        </p>
      </div>

      {/* LIMITES POR CATEGORIA - SOLTO */}
      <div className="bg-[#111] px-12 py-10 rounded-[3rem] border border-white/5 space-y-10 w-full">
        <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Limites por Categoria</h3>
        <div className="space-y-10">
          {metas.map(meta => {
            const gastoCat = transacoes
              .filter(t => t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase())
              .reduce((acc, t) => acc + Number(t.amount), 0);
            const progresso = Math.min((gastoCat / Number(meta.amount)) * 100, 100);
            const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === meta.category?.toLowerCase());

            const getProgressColor = (percent: number) => {
              if (percent >= 90) return "bg-red-500";
              if (percent >= 70) return "bg-orange-500";
              return "bg-yellow-400";
            };

            return (
              <div key={meta.id} className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{catInfo?.emoji}</span>
                    <span className="text-xs font-black uppercase italic text-white">{meta.category}</span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-400 italic">
                    R$ {gastoCat.toLocaleString('pt-BR')} / {Number(meta.amount).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-1000 ${getProgressColor(progresso)}`} style={{ width: `${progresso}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATIVIDADE RECENTE - SOLTO */}
      <div className="bg-[#111] px-12 py-10 rounded-[3rem] border border-white/5 space-y-8 w-full">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">Atividade</h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Recentes</span>
        </div>

        <div className="space-y-4">
          {transacoes.length > 0 ? (
            <>
              {transacoes.slice(0, 3).map((t) => {
                const catInfo = MASTER_CATS.find(c => c.nome.toLowerCase() === t.category?.toLowerCase());
                return (
                  <div key={t.id} className="flex justify-between items-center bg-black/20 p-5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{t.type === 'entrada' ? "💰" : (catInfo?.emoji || "💸")}</span>
                      <div>
                        <p className="text-white font-black italic uppercase text-[10px] leading-none">{t.category}</p>
                        <p className="text-zinc-600 text-[8px] font-bold uppercase mt-1">
                          {new Date(t.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-white'}`}>
                      {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR')}
                    </span>
                  </div>
                );
              })}
              <button 
                onClick={() => router.push("/historico")}
                className="w-full py-4 border border-white/5 rounded-2xl text-[9px] font-black uppercase text-zinc-500 hover:text-white transition tracking-widest"
              >
                Ver Fluxo Completo →
              </button>
            </>
          ) : (
            <p className="text-zinc-600 text-center py-6 font-black uppercase text-[10px] italic">Nenhum registro ainda</p>
          )}
        </div>
      </div>

      {/* MODAL DE REGISTRO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl text-white">
            <h2 className="text-2xl font-black italic uppercase text-white mb-6">Novo Registro</h2>
            
            <div className="grid grid-cols-2 gap-2 bg-black p-1 rounded-2xl mb-6 border border-white/5">
              <button onClick={() => setTipo("saida")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "saida" ? "bg-red-500 text-white" : "text-zinc-500"}`}>Saída</button>
              <button onClick={() => setTipo("entrada")} className={`py-3 rounded-xl font-black text-[10px] uppercase transition ${tipo === "entrada" ? "bg-green-500 text-white" : "text-zinc-500"}`}>Entrada</button>
            </div>

            {tipo === "saida" && (
              <div className="grid grid-cols-3 gap-2 mb-6 max-h-[200px] overflow-y-auto pr-1">
                {categoriasAtivas.map(c => (
                  <button key={c.nome} onClick={() => setCatSel(c.nome)} className={`p-3 rounded-xl border transition-all flex flex-col items-center ${catSel === c.nome ? "border-yellow-400 bg-yellow-400/10" : "border-white/5 bg-black/40"}`}>
                    <span className="text-xl mb-1">{c.emoji}</span>
                    <span className="text-[7px] font-black uppercase text-white text-center leading-tight">{c.nome}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1 mb-8">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 italic">Valor (R$)</label>
              <input 
                type="text" inputMode="numeric" placeholder="0,00" value={valor} 
                onChange={(e) => setValor(e.target.value)} 
                className="w-full bg-black border border-white/10 p-5 rounded-2xl text-4xl font-black italic outline-none text-white focus:border-yellow-400 placeholder:opacity-20" 
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={async () => {
                if(!valor || (tipo === 'saida' && !catSel)) return alert("Preencha tudo!");
                const valorLimpo = valor.toString().replace(/\./g, "").replace(",", ".");
                const valorNumerico = parseFloat(valorLimpo);
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from("transactions").insert({
                  user_id: user?.id,
                  type: tipo,
                  category: tipo === 'saida' ? catSel : 'Receita',
                  amount: valorNumerico
                });
                setShowModal(false);
                setValor("");
                loadData();
              }} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition">Confirmar</button>
              <button onClick={() => setShowModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
