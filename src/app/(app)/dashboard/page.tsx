"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Plus, Target, ChevronDown, Check } from "lucide-react";

// Definição rigorosa das categorias para evitar erros de digitação
const CATEGORIAS_MASTER = [
  { id: "alimentacao", nome: "Alimentação", emoji: "🍔", cor: "#FF007A" },
  { id: "moradia", nome: "Moradia", emoji: "🏠", cor: "#FF4D00" },
  { id: "transporte", nome: "Transporte", emoji: "🚗", cor: "#00E5FF" },
  { id: "lazer", nome: "Lazer", emoji: "🎬", cor: "#39FF14" },
  { id: "saude", nome: "Saúde", emoji: "💊", cor: "#FFB800" },
  { id: "outros", nome: "Outros", emoji: "⚡", cor: "#7B61FF" },
];

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Estados da Página
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  
  // Estados do Novo Registro
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [categoriaSel, setCategoriaSel] = useState("");
  const [valor, setValor] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const agora = new Date();
      const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

      const [metasRes, transRes] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id).gte("created_at", primeiroDia)
      ]);

      setMetas(metasRes.data || []);
      setTransacoes(transRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  // Cálculos de Saldo
  const totalEntradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const totalSaidas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldoDisponivel = totalEntradas - totalSaidas;
  const limiteTotalMetas = metas.reduce((acc, m) => acc + Number(m.target_amount), 0);
  const porcentagemGeral = limiteTotalMetas > 0 ? Math.round((totalSaidas / limiteTotalMetas) * 100) : 0;

  // Filtrar categorias que possuem metas cadastradas
  const categoriasComMeta = CATEGORIAS_MASTER.filter(cat => 
    metas.some(m => m.category.toLowerCase() === cat.nome.toLowerCase())
  );

  async function handleAddTransaction() {
    if (!valor || (tipo === "saida" && !categoriaSel)) return alert("Preencha todos os campos");

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("transactions").insert({
      user_id: user?.id,
      type: tipo,
      category: tipo === "entrada" ? "Receita" : categoriaSel,
      amount: parseFloat(valor.replace(",", ".")),
      description: tipo === "entrada" ? "Entrada de Saldo" : `Gasto em ${categoriaSel}`
    });

    if (!error) {
      setIsModalOpen(false);
      setValor("");
      setCategoriaSel("");
      loadData();
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-400"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      
      {/* Título e Botões Superiores */}
      <header className="mb-6">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-1">DASHBOARD</h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-6">Inteligência Financeira</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => router.push("/metas")}
            className="flex items-center justify-center gap-2 bg-zinc-900/50 border border-zinc-800 h-14 rounded-xl font-bold text-xs uppercase hover:bg-zinc-800 transition-all"
          >
            Metas 📈
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-yellow-400 text-black h-14 rounded-xl font-black text-xs uppercase hover:bg-yellow-500 transition-all"
          >
            + Transação
          </button>
        </div>
      </header>

      {/* Cards de Saldo */}
      <section className="space-y-2 mb-8">
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saldo Disponível</span>
          <div className="text-3xl font-black italic mt-1">
            R$ {saldoDisponivel.toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
            <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest">Total Saídas</span>
            <div className="text-xl font-black italic text-red-500 mt-1">R$ {totalSaidas.toLocaleString('pt-BR')}</div>
          </div>
          <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/50">
            <span className="text-[10px] font-bold text-green-500/80 uppercase tracking-widest">Total Entradas</span>
            <div className="text-xl font-black italic text-green-500 mt-1">R$ {totalEntradas.toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </section>

      {/* Gráfico de Rosca Estilizado */}
      <section className="bg-zinc-900/60 p-6 rounded-[40px] border border-zinc-800 flex flex-col items-center">
        <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8 self-start">Uso do Orçamento</h2>
        
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Círculo de Fundo (Track) */}
            <circle cx="112" cy="112" r="90" stroke="#1a1a1a" strokeWidth="22" fill="transparent" />
            
            {/* Arco de Progresso Real */}
            <circle 
              cx="112" cy="112" r="90" 
              stroke={categoriasComMeta[0]?.cor || "#FF007A"} 
              strokeWidth="24" 
              fill="transparent" 
              strokeDasharray={565.48}
              strokeDashoffset={565.48 - (565.48 * Math.min(porcentagemGeral, 100)) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black italic leading-none">{porcentagemGeral}%</span>
            <span className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Gasto</span>
          </div>
        </div>

        {/* Legenda Dinâmica (Só mostra o que tem meta) */}
        <div className="grid grid-cols-3 gap-4 mt-10 w-full">
          {categoriasComMeta.map(cat => (
            <div key={cat.id} className="flex flex-col items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} />
              <span className="text-xl">{cat.emoji}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Transação (Otimizado) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-md rounded-[32px] p-6 border border-zinc-800 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic uppercase italic">Novo Registro</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[10px] font-bold text-zinc-500 uppercase">Fechar X</button>
            </div>

            {/* Selector Tipo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black rounded-2xl mb-6">
              <button 
                onClick={() => setTipo("saida")}
                className={`h-12 rounded-xl font-bold text-xs uppercase transition-all ${tipo === 'saida' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-zinc-500'}`}
              >
                Saída
              </button>
              <button 
                onClick={() => setTipo("entrada")}
                className={`h-12 rounded-xl font-bold text-xs uppercase transition-all ${tipo === 'entrada' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-zinc-500'}`}
              >
                Entrada
              </button>
            </div>

            {/* Categorias (Exibidas como Botões) */}
            {tipo === "saida" && (
              <div className="mb-6">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3">Selecione a Categoria</p>
                <div className="grid grid-cols-3 gap-2">
                  {categoriasComMeta.length > 0 ? (
                    categoriasComMeta.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoriaSel(cat.nome)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${categoriaSel === cat.nome ? 'border-yellow-400 bg-yellow-400/10' : 'border-zinc-800 bg-black/40'}`}
                      >
                        <span className="text-2xl mb-1">{cat.emoji}</span>
                        <span className="text-[9px] font-bold uppercase truncate w-full text-center">{cat.nome}</span>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 p-4 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-[10px] uppercase font-bold">
                      Nenhuma meta cadastrada
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Campo Valor */}
            <div className="mb-8">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Valor (R$)</p>
              <input 
                type="number"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-black border border-zinc-800 h-16 rounded-2xl px-6 text-2xl font-black italic focus:border-yellow-400 outline-none transition-all"
              />
            </div>

            <button 
              onClick={handleAddTransaction}
              className="w-full bg-yellow-400 text-black h-16 rounded-2xl font-black text-xs uppercase shadow-xl shadow-yellow-400/10 active:scale-95 transition-all"
            >
              Confirmar Registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
