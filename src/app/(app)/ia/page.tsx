"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export default function AIAnalyticsPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function processarIA() {
    if (!input.trim()) return;
    setLoading(true);
    
    const userMsg = { role: "user", text: input };

    // --- PEÇA 1: HISTÓRICO PARA ACABAR COM A AMNÉSIA ---
    const historicoFormatado = [...messages, userMsg].slice(-7).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text
    }));

    setMessages(prev => [...prev, userMsg]);
    const promptOriginal = input;
    setInput("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const agora = new Date();
      const mesAtual = agora.getMonth();
      const anoAtual = agora.getFullYear();

      // --- PEÇA 2: BUSCA DE METAS E OBJETIVOS ---
      const [trans, metas, sonhos] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id),
        supabase.from("goals").select("*").eq("user_id", user?.id),
        supabase.from("dream_goals").select("*").eq("user_id", user?.id)
      ]);

      // Criamos um array real para validação técnica
      const categoriasOficiais = metas.data?.map(m => m.category) || [];
      const listaCategorias = categoriasOficiais.join(", ") || "Geral";
      const listaObjetivos = sonhos.data?.map(s => `OBJ: ${s.name.toUpperCase()}`).join(", ") || "";
      
      const resumoFinanceiro = metas.data?.map(meta => {
        const teto = Number(meta.amount) || 0;
        const gastoJaCalculado = trans.data?.filter(t => {
          const d = new Date(t.created_at);
          return t.type === "saida" && 
                 t.category?.toLowerCase() === meta.category?.toLowerCase() &&
                 d.getMonth() === mesAtual && 
                 d.getFullYear() === anoAtual;
        }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;

        return {
          categoria: meta.category,
          gasto_real: `R$ ${gastoJaCalculado.toFixed(2)}`,
          limite_teto: `R$ ${teto.toFixed(2)}`
        };
      });

      const saldoGeral = trans.data?.reduce((acc, t) => 
        t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0) || 0;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://mindcash.vercel.app', 
          'X-Title': 'MindCash'
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [
            { 
              role: "system", 
              content: `Você é o CÉREBRO v7. Mentor Financeiro de Elite.
              PERSONA: Autoridade máxima. Use "Mestre", "Comandante".
              IDIOMA: APENAS PORTUGUÊS (BRASIL).
              
              CONTEXTO ATUAL:
              - Saldo: R$ ${saldoGeral.toFixed(2)}
              - Categorias: ${listaCategorias}
              - OBJETIVOS: ${listaObjetivos}

              REGRAS:
              1. Você NÃO ensina a fazer. Você EXECUTA a transação via JSON.
              2. Entrada para objetivo: category deve ser "OBJ: NOME" (com espaço e maiúsculo).
              3. Se for saída comum, use OBRIGATORIAMENTE uma das categorias da lista acima. Se não houver, use "Outros".
              4. Não peça informações já ditas no histórico.
              
              JSON (Sempre na última linha):
              {"action": "transaction", "type": "saida/entrada", "amount": 0, "category": "nome"}` 
            },
            ...historicoFormatado
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      const fullText = data.choices[0].message.content;
      const jsonMatch = fullText.match(/\{[\s\S]*?\}/); 
      let textoParaExibir = fullText;

      if (jsonMatch) {
        textoParaExibir = fullText.split('{')[0].trim().replace(/```json|```/g, "");
        
        try {
          const res = JSON.parse(jsonMatch[0]);
          
          if (res.action === "transaction") {
            const valorFinal = res.amount > 0 ? res.amount : parseFloat(promptOriginal.replace(/[^\d.,]/g, "").replace(",", "."));
            
            let categoriaFinal = 'Outros';
            
            if (res.type === 'entrada') {
              if (res.category && res.category.toUpperCase().includes('OBJ:')) {
                const nomeLimpo = res.category.replace(/OBJ:\s*/i, "").trim().toUpperCase();
                categoriaFinal = `OBJ: ${nomeLimpo}`;
              } else {
                categoriaFinal = 'Receita';
              }
            } else {
              // --- TRAVA DE SEGURANÇA: NÃO INVENTAR CATEGORIA ---
              const existeNaLista = categoriasOficiais.some(cat => 
                cat.toLowerCase() === res.category?.toLowerCase()
              );
              categoriaFinal = existeNaLista ? res.category : 'Outros';
            }

            await supabase.from("transactions").insert({
              user_id: user?.id,
              type: res.type,
              amount: valorFinal,
              category: categoriaFinal,
              created_at: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn("Falha na execução técnica:", e);
        }
      }
      
      const mensagemFinal = textoParaExibir.replace(/[/\\_]{2,}/g, "");
      setMessages(prev => [...prev, { role: "bot", text: mensagemFinal || "Comandante, missão cumprida." }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ COMANDANTE: Falha na base. Tente novamente.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5 hover:border-yellow-400/50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_#facc15]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MASTER COMMAND v7.8</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Aguardando ordens estratégicas.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${
              m.role === 'user' ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-900 border border-white/10 text-zinc-100 italic font-medium'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-yellow-400/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Relate a estratégia, Comandante..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white"
          />
          <button onClick={processarIA} disabled={loading} className="bg-yellow-400 text-black p-3 rounded-full hover:scale-95 transition-all">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
