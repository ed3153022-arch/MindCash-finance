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
  
  const [tipo, setTipo] = useState<"saida" | "entrada">("saida");
  const [catSel, setCatSel] = useState("");
  const [valor, setValor] = useState("");
  
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

  const maskMoney = (v: string) => {
    v = v.replace(/\D/g, "");
    if (!v) return "";
    return (Number(v) / 100).toFixed(2).replace(".", ",");
  };

  const maskDate = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length >= 5) return v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
    if (v.length >= 3) return v.replace(/(\d{2})(\d{2})/, "$1/$2");
    return v;
  };

  async function handleAddFixed() {
    try {
      if (!fixoNome.trim() || !fixoValor || fixoData.length < 10) {
        notify("Preencha tudo!", "error");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numericAmount = parseFloat(fixoValor.replace(",", "."));
      const cleanDateStr = fixoData.replace(/\//g, "");

      const { error: dbError } = await supabase.from("fixed_expenses").insert({
        user_id: user.id,
        name: fixoNome.trim(),
        amount: numericAmount,
        due_date: cleanDateStr
      });

      if (dbError) throw dbError;

      notify("Salvo com sucesso!", "success");
      setShowFixedModal(false);
      setFixoNome(""); setFixoValor(""); setFixoData("");
      loadData();
    } catch (e) {
      console.error(e);
      notify("Erro ao salvar", "error");
    }
  }

  async function deleteFixed(id: string) {
    const { error } = await supabase.from("fixed_expenses").delete().eq("id", id);
    if (!error) {
      notify("Removido");
      loadData();
    }
  }

  const saídas = transacoes.filter(t => t.type === "saida").reduce((acc, t) => acc + Number(t.amount), 0);
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((acc, t) => acc + Number(t.amount), 0);
  const saldo = entradas - saídas;

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white relative bg-black min-h-screen">
      
      {/* ALERTAS ESTILO MOBILE */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-l-4 font-black italic uppercase text-[10px] tracking-widest shadow-2xl transition-all ${n.type === 'success' ? 'bg-[#111] border-green-500' : 'bg-[#111] border-red-500'}`}>
            <Bell size={14} className={n.type === 'success' ? 'text-green-500' : 'text-red-500'} />
            {n.msg}
          </div>
        ))}
      </div>

      <h1 className="text-5xl font-black italic uppercase tracking-tighter">DASHBOARD</h1>

      {/* GASTOS FIXOS */}
      <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black italic uppercase">Gastos Fixos</h3>
          <button onClick={() => setShowFixedModal(true)} className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase">
            <Zap size={12} fill="black" /> ADICIONAR
          </button>
        </div>
        
        <div className="space-y-3">
          {gastosFixos.map(gasto => (
            <div key={gasto.id} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 px-2 py-1 rounded-lg border border-yellow-400/20 text-yellow-400 text-[9px] font-black italic">
                  {gasto.due_date}
                </div>
                <p className="text-[10px] font-black uppercase italic">{gasto.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-black italic">R$ {Number(gasto.amount).toLocaleString('pt-BR')}</p>
                <button onClick={() => deleteFixed(gasto.id)} className="text-zinc-700 hover:text-red-500">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL GASTO FIXO - AJUSTADO PARA MOBILE */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10">
            <h2 className="text-2xl font-black italic uppercase mb-8 text-yellow-400">Nova Sentença Fixa</h2>
            
            <div className="space-y-6">
              <input type="text" placeholder="NOME DO GASTO" value={fixoNome} onChange={e => setFixoNome(e.target.value.toUpperCase())} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white" />
              
              <input type="text" inputMode="numeric" placeholder="VALOR (0,00)" value={fixoValor} onChange={e => setFixoValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white" />
              
              <input type="text" inputMode="numeric" placeholder="00/00/0000" value={fixoData} onChange={e => setFixoData(maskDate(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[11px] font-black italic text-white" />
            </div>

            <button onClick={handleAddFixed} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] mt-10 active:scale-95 transition-all">
              Confirmar
            </button>
            <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase mt-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
