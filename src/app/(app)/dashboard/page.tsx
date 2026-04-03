"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Zap, X, Bell } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: 'success' | 'error'}[]>([]);
  
  const [gastosFixos, setGastosFixos] = useState<any[]>([]);
  const [fixoNome, setFixoNome] = useState("");
  const [fixoValor, setFixoValor] = useState("");
  const [fixoData, setFixoData] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("fixed_expenses").select("*").eq("user_id", user.id).order("due_day", { ascending: true });
        setGastosFixos(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  };

  // ESTA FUNÇÃO FOI CORRIGIDA PARA EXIBIR AS BARRAS SEM QUEBRAR O APP
  const formatDisplayDate = (d: any) => {
    if (!d || typeof d !== 'string' || d.length < 8) return d || ""; 
    // Transforma 03042026 em 03/04/2026
    return d.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
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

  async function handleAddFixed() {
    try {
      if (!fixoNome || !fixoValor || fixoData.length < 10) {
        notify("Preencha todos os campos", "error");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const valorNumerico = parseFloat(fixoValor.replace(",", "."));
      const dataLimpa = fixoData.replace(/\D/g, ""); 

      const { error: dbError } = await supabase.from("fixed_expenses").insert({
        user_id: user.id,
        name: fixoNome.trim().toUpperCase(),
        amount: valorNumerico,
        due_day: dataLimpa 
      });

      if (dbError) throw dbError;

      notify("Salvo com sucesso!", "success");
      setShowFixedModal(false);
      setFixoNome(""); setFixoValor(""); setFixoData("");
      loadData();
    } catch (e: any) {
      notify("Erro ao salvar", "error");
    }
  }

  if (loading) return <div className="bg-black min-h-screen" />;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto p-4 pb-24 text-white bg-black min-h-screen font-sans">
      
      {/* NOTIFICAÇÕES */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-l-4 font-black italic uppercase text-[10px] shadow-2xl ${n.type === 'success' ? 'bg-[#111] border-green-500' : 'bg-[#111] border-red-500'}`}>
            <Bell size={14} className={n.type === 'success' ? 'text-green-500' : 'text-red-500'} />
            {n.msg}
          </div>
        ))}
      </div>

      {/* LISTA GASTOS FIXOS */}
      <div className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-black italic uppercase">Gastos Fixos</h3>
          <button onClick={() => setShowFixedModal(true)} className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-black text-[9px] uppercase flex items-center gap-1 shadow-lg shadow-yellow-400/20">
            <Zap size={12} fill="black" /> ADICIONAR
          </button>
        </div>
        
        <div className="space-y-3">
          {gastosFixos.map((gasto, index) => (
            <div key={gasto.id || index} className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 px-2 py-1 rounded-lg border border-yellow-400/20 text-yellow-400 text-[9px] font-black italic">
                  {/* AQUI A DATA APARECE COM BARRAS AGORA */}
                  {formatDisplayDate(gasto.due_day)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase italic leading-none">{gasto.name}</p>
                  <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-1 italic">Sentença Fixa</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xs font-black italic">R$ {Number(gasto.amount || 0).toLocaleString('pt-BR')}</p>
                <button onClick={async () => { await supabase.from("fixed_expenses").delete().eq("id", gasto.id); loadData(); }} className="text-zinc-700 hover:text-red-500">
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-sm rounded-[2rem] p-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-8 text-yellow-400">Nova Sentença Fixa</h2>
            <div className="space-y-6">
              <input type="text" placeholder="NOME DO GASTO" value={fixoNome} onChange={e => setFixoNome(e.target.value)} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none focus:border-yellow-400" />
              <input type="text" inputMode="numeric" placeholder="VALOR (0,00)" value={fixoValor} onChange={e => setFixoValor(maskMoney(e.target.value))} className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none focus:border-yellow-400" />
              <input type="text" inputMode="numeric" placeholder="00/00/0000" value={fixoData} onChange={e => setFixoData(maskDate(e.target.value))} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[11px] font-black italic text-white outline-none focus:border-yellow-400" />
            </div>
            <button onClick={handleAddFixed} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase text-[10px] mt-10 active:scale-95 transition-all">Confirmar</button>
            <button onClick={() => setShowFixedModal(false)} className="w-full py-4 text-zinc-500 font-black text-[9px] uppercase mt-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
