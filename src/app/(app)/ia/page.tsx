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
    setMessages(prev => [...prev, userMsg]);
    const promptOriginal = input;
    setInput("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [trans, metas] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id),
        supabase.from("goals").select("*").eq("user_id", user?.id)
      ]);

      // --- MOTOR DE CÁLCULO PRÉVIO (SUBSTITUÍDO: DADOS MASTIGADOS DO DASHBOARD) ---
      const listaCategorias = metas.data?.map(m => m.category).join(", ") || "Geral";
      const resumoFinanceiro = metas.data?.map(m => {
        const teto = Number(m.amount) || 0;
        // Pega o gasto real que já está consolidado no banco para o Dashboard
        const gastoJaCalculado = trans.data?.filter(t => t.category === m.category && t.type === 'saida')
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0) || 0;
        const porcentagem = teto > 0 ? (gastoJaCalculado / teto) * 100 : 0;

        return {
          categoria: m.category,
          gasto_real: gastoJaCalculado.toFixed(2),
          limite_teto: teto.toFixed(2),
          status: `${porcentagem.toFixed(1)}% usado`,
          alerta: porcentagem >= 100
        };
      });

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
              CATEGORIAS VÁLIDAS: ${listaCategorias}.
              
              CONTEXTO ATUAL (USE ESTES NÚMEROS): ${JSON.stringify(resumoFinanceiro)}

              REGRAS:
              1. Se o usuário relatar gasto/ganho, confirme e envie JSON de 'transaction'.
              2. Se o usuário pedir análise/veredito, use JSON de 'chat'.
              3. Se uma categoria estiver com Alerta=true, dê uma bronca severa.
              4. Mapeie itens específicos (ex: Roupa) para a categoria correta (ex: Compras).
              
              JSON (Sempre na última linha):
              - {"action": "transaction", "type": "saida/entrada", "amount": 0, "category": "nome da categoria"}
              - {"action": "chat"}` 
            },
            { role: "user", content: promptOriginal }
          ],
          temperature: 0.1 // Temperatura baixa para evitar invenções de nomes
        })
      });

      const data = await response.json();
      const fullText = data.choices[0].message.content;
      
      const jsonMatch = fullText.match(/\{[\s\S]*?\}/); 
      let textoParaExibir = fullText;

      if (jsonMatch) {
        textoParaExibir = fullText.replace(/```json|```/g, "").replace(jsonMatch[0], "").trim();
        
        try {
          const res = JSON.parse(jsonMatch[0]);
          
          // --- EXECUÇÃO BLINDADA (SUBSTITUÍDO: TRAVA DE RECEITA E CATEGORIA) ---
          if (res.action === "transaction") {
            const valorLimpo = res.amount || parseFloat(promptOriginal.replace(/[^\d.,]/g, "").replace(",", "."));
            
            const categoriaFinal = res.type === 'entrada' 
              ? 'Receita' 
              : (res.category && res.category !== 'escolha da lista' ? res.category : 'Outros');

            await supabase.from("transactions").insert({
              user_id: user?.id,
              type: res.type,
              amount: valorLimpo,
              category: categoriaFinal,
              created_at: new Date()
            });
          }
        } catch (e) {
          console.warn("Falha silenciosa na execução do comando:", e);
        }
      }
      
      const mensagemFinal = textoParaExibir.split('{')[0].trim().replace(/[/\\_]{2,}/g, "");
      setMessages(prev => [...prev, { role: "bot", text: mensagemFinal || "Comandante, missão cumprida." }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ COMANDANTE: Falha na comunicação com a base. Tente novamente.` }]);
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
