"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// CHAVE DE API DO GEMINI
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

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
    const promptDigitado = input;
    setInput("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [trans, metas] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id),
        supabase.from("goals").select("*").eq("user_id", user?.id)
      ]);

      const valorInput = parseFloat(promptDigitado.replace(/[^\d.,]/g, "").replace(",", "."));
      const temValor = !isNaN(valorInput);

      const dadosBlindados = metas.data?.map(m => {
        const jaGasto = trans.data?.filter(t => t.category === m.category)
          .reduce((acc, t) => acc + t.amount, 0) || 0;
        const novoTotal = jaGasto + (temValor ? valorInput : 0);
        return {
          categoria: m.category,
          saldo_atual: jaGasto.toFixed(2),
          novo_saldo: novoTotal.toFixed(2),
          porcentagem: ((novoTotal / m.amount) * 100).toFixed(1),
          teto: m.amount.toFixed(2)
        };
      });

      // CHAMADA PARA O GEMINI (Ajustada para evitar erros de bloqueio)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Você é o Cérebro Financeiro.
                DADOS: ${JSON.stringify(dadosBlindados)}
                REGRAS: 
                1. Use o "novo_saldo" e "porcentagem" dos dados. 
                2. Se começa com 2, não diga 7.
                3. Responda de forma motivadora com base na porcentagem.
                4. Finalize com JSON: {"action": "insert", "amount": ${valorInput || 0}, "category": "nome"}
                
                USUÁRIO: ${promptDigitado}`
              }]
            }],
            generationConfig: { temperature: 0.2 }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro na API");
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

      const textoLimpo = text.replace(/\{.*\}/s, "").trim();
      const jsonMatch = text.match(/\{.*\}/s);

      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        if (json.action === "insert" && json.amount > 0) {
          await supabase.from("transactions").insert({
            user_id: user?.id,
            type: "saida",
            amount: json.amount,
            category: json.category,
            created_at: new Date()
          });
        }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);

    } catch (error: any) {
      console.error("ERRO DETALHADO:", error);
      setMessages(prev => [...prev, { role: "bot", text: `❌ FALHA NO CÉREBRO: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  // O Return (Interface) permanece o mesmo do código anterior
  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5 hover:border-yellow-400/50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-zinc-400">GEMINI ENGINE v6.2</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Aguardando ordem, mestre.</p>
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
            placeholder="Digite o gasto..." 
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
