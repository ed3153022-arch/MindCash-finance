"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HistoricoPage() {
  const router = useRouter();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setTransacoes(data || []);
      setLoading(false);
    }
    loadAll();
  }, [router]);

  if (loading) return null;

  return (
    <div className="w-full space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end w-full">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">EXTRATO</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Histórico Completo</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-5 py-3 bg-zinc-900 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white active:scale-95 transition"
        >
          Voltar
        </button>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <div className="bg-[#111] px-6 py-8 rounded-[2.5rem] border border-white/5 w-full">
        <div className="space-y-6">
          {transacoes.length > 0 ? transacoes.map((t) => (
            <div key={t.id} className="flex justify-between items-center border-b border-white/5 pb-5 last:border-0 last:pb-0">
              <div className="space-y-1">
                {/* CATEGORIA EM DESTAQUE */}
                <p className="text-white font-black italic uppercase text-sm leading-none">
                  {t.category}
                </p>
                {/* DATA ABAIXO */}
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-wider">
                  {new Date(t.created_at).toLocaleDateString('pt-BR')} às {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* VALOR COM CORES CORRIGIDAS */}
              <div className="text-right">
                <span className={`text-lg font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                  {t.type === 'entrada' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )) : (
            <p className="text-zinc-600 text-center py-10 font-black uppercase text-[10px] italic">Nenhum registro encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}

