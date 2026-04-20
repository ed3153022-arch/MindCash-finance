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

      const [trans, metas, sonhos] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id),
        supabase.from("goals").select("*").eq("user_id", user?.id),
        supabase.from("dream_goals").select("*").eq("user_id", user?.id)
      ]);

      const categoriasOficiais = metas.data?.map(m => m.category) || [];
      const listaCategorias = categoriasOficiais.join(", ") || "Geral";
      const listaObjetivos = sonhos.data?.map(s => `OBJ: ${s.name.toUpperCase()}`).join(", ") || "";
      
      const resumoFinanceiro = metas.data?.map(meta => {
        const gastoJaCalculado = trans.data?.filter(t => {
          const d = new Date(t.created_at);
          return t.type === "saida" && t.category?.toLowerCase() === meta.category?.toLowerCase() &&
                 d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        return { categoria: meta.category, gasto: gastoJaCalculado, limite: meta.amount };
      });

      const saldoGeral = trans.data?.reduce((acc, t) => t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0) || 0;

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
              content: `Você é o CÉREBRO v7. Mentor Financeiro de Elite. Persona: Comandante.
              
              CONTEXTO REAL (NÃO INVENTE):
              - Saldo Atual: R$ ${saldoGeral.toFixed(2)}
              - Categorias Permitidas: ${listaCategorias}
              - Objetivos Permitidos: ${listaObjetivos}
              - Resumo por Categoria: ${JSON.stringify(resumoFinanceiro)}

              REGRAS:
              1. Transações: Identifique valor e categoria. Se for entrada SEM objetivo específico, use categoria "Receita".
              2. Vereditos: Se o usuário pedir "veredito", analise os gastos vs limites do contexto e dê um conselho estratégico curto.
              3. NÃO invente novos objetivos ou saldos negativos.
              
              JSON (Última linha): {"action": "transaction/chat", "type": "saida/entrada", "amount": 0, "category": "nome"}` 
            },
            ...historicoFormatado
          ],
          temperature: 0.2
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
            // Prioriza o valor do JSON, se for 0 busca no texto
            const valorFinal = (res.amount && res.amount > 0) ? res.amount : parseFloat(promptOriginal.replace(/[^\d.,]/g, "").replace(",", "."));
            
            let categoriaFinal = 'Outros';
            if (res.type === 'entrada') {
              if (res.category && res.category.toUpperCase().includes('OBJ:')) {
                const nomeLimpo = res.category.replace(/OBJ:\s*/i, "").trim().toUpperCase();
                categoriaFinal = `OBJ: ${nomeLimpo}`;
              } else {
                categoriaFinal = 'Receita'; // Correção Erro 5
              }
            } else {
              const existe = categoriasOficiais.some(c => c.toLowerCase() === res.category?.toLowerCase());
              categoriaFinal = existe ? res.category : 'Outros';
            }

            if (!isNaN(valorFinal) && valorFinal > 0) {
              await supabase.from("transactions").insert({
                user_id: user?.id,
                type: res.type,
                amount: valorFinal,
                category: categoriaFinal,
                created_at: new Date().toISOString()
              });
            }
          }
        } catch (e) { console.warn(e); }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoParaExibir || "Comandante, missão cumprida." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ COMANDANTE: Falha na base.` }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MASTER COMMAND v7.8</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${m.role === 'user' ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-900 border border-white/10 text-zinc-100 italic'}`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Relate a estratégia, Comandante..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white"
          />
          <button onClick={processarIA} disabled={loading} className="bg-yellow-400 text-black p-3 rounded-full">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
