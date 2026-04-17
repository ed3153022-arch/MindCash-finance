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

      const valorDetectado = parseFloat(promptOriginal.replace(/[^\d.,]/g, "").replace(",", "."));
      
      const dadosBlindados = metas.data?.map(m => {
        const jaGasto = trans.data?.filter(t => t.category === m.category)
          .reduce((acc, t) => acc + t.amount, 0) || 0;
        return {
          categoria: m.category,
          atual: jaGasto.toFixed(2),
          teto: m.amount.toFixed(2),
          porcentagem: ((jaGasto / m.amount) * 100).toFixed(1)
        };
      });

      let temp = 0.3;
      const lowerInput = promptOriginal.toLowerCase();
      if (lowerInput.includes("veredito") || lowerInput.includes("disciplina")) temp = 0.7;

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
              content: `Você é o CÉREBRO v7. Mentor de Elite.
              
              PERSONA: Use "Mestre", "Comandante", "Veredito". 
              DADOS: ${JSON.stringify(dadosBlindados)}

              REGRAS:
              1. ALERTA 70%: Avise se chegar perto.
              2. ALERTA 100%: Dê bronca se passar.
              3. Se for entrada/ganho ou novo objetivo, dê parabéns.
              4. IDIOMA: Português Brasil.
              5. JAMAIS mostre o JSON ou termos técnicos como "banco de dados" ou "tabela".
              
              FORMATO OBRIGATÓRIO:
              [Seu comentário de mentor aqui]
              {"action": "insert", "type": "saida ou entrada", "amount": ${valorDetectado || 0}, "category": "NOME"}
              
              Nota: O JSON deve ser a última coisa. Não escreva nada depois dele.` 
            },
            { role: "user", content: promptOriginal }
          ],
          temperature: temp
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const fullText = data.choices[0].message.content;

      // --- NOVA LÓGICA DE EXTRAÇÃO DE JSON (MAIS FORTE) ---
      const jsonMatch = fullText.match(/\{.*\}/s);
      let textoLimpo = fullText;

      if (jsonMatch) {
        textoLimpo = fullText.replace(jsonMatch[0], "").trim();
        try {
          const jsonAction = JSON.parse(jsonMatch[0]);
          
          if (jsonAction.action === "insert" && jsonAction.amount > 0) {
            const { error: insertError } = await supabase.from("transactions").insert({
              user_id: user?.id,
              type: jsonAction.type || "saida",
              amount: jsonAction.amount,
              category: jsonAction.category,
              created_at: new Date()
            });
            if (insertError) console.error("Erro Supabase:", insertError);
          } else if (jsonAction.action === "upsert_goal") {
            await supabase.from("goals").upsert({
              user_id: user?.id,
              category: jsonAction.category,
              amount: jsonAction.amount
            });
          }
        } catch (e) {
          console.error("Erro ao ler JSON da IA", e);
        }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ COMANDANTE: ${error.message}` }]);
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
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Elite Finance v7.0</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Aguardando ordens, Comandante.</p>
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
            placeholder="Mande o relatório, Chefe..." 
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
