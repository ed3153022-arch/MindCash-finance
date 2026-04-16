"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// CHAVE DA OPENAI (ou DeepSeek)
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

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

      // --- CÁLCULO EXTERNO INFALÍVEL ---
      const valorInput = parseFloat(promptDigitado.replace(/[^\d.,]/g, "").replace(",", "."));
      const temValor = !isNaN(valorInput);

      // Pegamos os dados reais e já fazemos a soma aqui no TypeScript
      const dadosBlindados = metas.data?.map(m => {
        const jaGasto = trans.data?.filter(t => t.category === m.category)
          .reduce((acc, t) => acc + t.amount, 0) || 0;
        const novoTotal = jaGasto + (temValor ? valorInput : 0);
        return {
          cat: m.category,
          atual: jaGasto.toFixed(2),
          final: novoTotal.toFixed(2),
          porc: ((novoTotal / m.amount) * 100).toFixed(1),
          teto: m.amount.toFixed(2)
        };
      });

      // --- CHAMADA PARA API (OPENAI OU DEEPSEEK) ---
      // Para DeepSeek use: https://api.deepseek.com/chat/completions
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Ou "deepseek-chat" se mudar a URL
          messages: [
            { 
              role: "system", 
              content: `Você é o Cérebro v7. Mentor financeiro.
              REGRAS: 
              1. NUNCA mencione o número 7 se o dado começar com 2.
              2. Use EXATAMENTE os valores de 'final' e 'porc' da tabela abaixo.
              3. Tom de voz: <80% elogio, 80-100% alerta, >100% puxão de orelha.
              
              TABELA ATUAL: ${JSON.stringify(dadosBlindados)}` 
            },
            { role: "user", content: promptDigitado }
          ],
          temperature: 0 // Precisão total
        })
      });

      const data = await response.json();
      const text = data.choices[0].message.content;

      // ... Lógica de limpar texto e salvar no Supabase (Action: insert) ...
      // Para economizar espaço, manteremos a lógica de extração de JSON que você já usa.
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

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "❌ Erro no motor de inteligência." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-black italic text-yellow-400 uppercase">O CÉREBRO</h1>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Powered by OpenAI / DeepSeek</span>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-900 border border-white/10'}`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-black">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-full border border-white/10">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Comando de precisão..." 
            className="flex-1 bg-transparent px-4 text-sm outline-none"
          />
          <button onClick={processarIA} className="bg-yellow-400 text-black p-3 rounded-full">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
