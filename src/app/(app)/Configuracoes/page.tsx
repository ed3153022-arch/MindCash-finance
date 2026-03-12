"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados das configurações
  const [notificacoes, setNotificacoes] = useState(true);
  const [ocultarSaldos, setOcultarSaldos] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    }
    getUser();
  }, [router]);

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 w-full md:col-span-2">
      {/* HEADER DA PÁGINA */}
      <div className="flex justify-between items-end w-full px-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase leading-none tracking-tighter text-white">AJUSTES</h1>
          <p className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase italic px-1">Perfil e App</p>
        </div>
        <button 
          onClick={() => router.push("/dashboard")} 
          className="px-6 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-[9px] font-black uppercase text-white tracking-widest active:scale-95 transition"
        >
          Voltar
        </button>
      </div>

      {/* CARD DE CONFIGURAÇÕES - Com pt-20 para não cortar o título */}
      <div className="bg-[#111] px-10 pt-20 pb-10 rounded-[1.5rem] border border-white/5 w-full">
        
        {/* INFO DO USUÁRIO */}
        <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-10">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl font-black text-black italic">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest italic">Conta Ativa</p>
            <h3 className="text-xl font-black italic uppercase text-white leading-none mt-1">{user?.email?.split('@')[0]}</h3>
            <p className="text-zinc-600 text-[10px] font-bold mt-1">{user?.email}</p>
          </div>
        </div>

        {/* SEÇÃO DE PREFERÊNCIAS */}
        <div className="space-y-8">
          <div className="space-y-6">
            <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Preferências</h4>
            
            {/* Toggle Notificações */}
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-white font-black italic uppercase text-xs">Notificações Push</span>
              <button 
                onClick={() => setNotificacoes(!notificacoes)}
                className={`w-12 h-6 rounded-full transition-all relative ${notificacoes ? 'bg-yellow-400' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${notificacoes ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Toggle Ocultar Saldo */}
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <span className="text-white font-black italic uppercase text-xs">Ocultar Saldos</span>
              <button 
                onClick={() => setOcultarSaldos(!ocultarSaldos)}
                className={`w-12 h-6 rounded-full transition-all relative ${ocultarSaldos ? 'bg-yellow-400' : 'bg-zinc-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${ocultarSaldos ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* AÇÕES DA CONTA */}
          <div className="pt-10 space-y-4">
            <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Segurança</h4>
            <button className="w-full py-5 bg-zinc-900 border border-white/5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition">
              Alterar Senha
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-black uppercase text-[10px] tracking-widest active:scale-95 transition"
            >
              Sair do MindCash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

