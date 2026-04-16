"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

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

      // --- CÁLCULO EXTERNO (FORA DA IA) ---
      const valorInput = parseFloat(promptDigitado.replace(/[^\d.,]/g, "").replace(",", "."));
      const temValorValido = !isNaN(valorInput);

      const dadosDoBanco = metas.data?.map(m => {
        const acumuladoNoBanco = trans.data?.filter(t => t.category === m.category)
          .reduce((acc, t) => acc + t.amount, 0) || 0;
        
        // Aqui o TypeScript resolve o erro do 7 antes da IA ver
        const totalFinalCalculado = acumuladoNoBanco + (temValorValido ? valorInput : 0);
        const porcentagemCalculada = (totalFinalCalculado / m.amount) * 100;

        return {
          cat: m.category,
          saldo_anterior: acumuladoNoBanco.toFixed(2),
          resultado_final: totalFinalCalculado.toFixed(2),
          porcentagem: porcentagemCalculada.toFixed(1),
          limite: m.amount.toFixed(2)
        };
      });

      const contexto = `Você é o Cérebro v5 (Nível de Segurança Máxima).
      
      ### TABELA DE VERDADE ABSOLUTA (NÃO QUESTIONE):
      ${JSON.stringify(dadosDoBanco)}

      ### REGRAS OBRIGATÓRIAS:
      1. IGNORE O PASSADO: Não use nenhum número que você disse em conversas anteriores.
      2. ZERO CÁLCULO: Se o usuário informar um valor, você DEVE apenas ler o "resultado_final" correspondente na tabela acima.
      3. PROIBIÇÃO DO DÍGITO 7: Se o "resultado_final" começa com 2, você está terminantemente proibido de escrever 7.
      4. ALERTA DE TETO: Use o campo "porcentagem" para decidir o tom da resposta (elogio, alerta ou puxão de orelha).

      RESPOSTA EM PORTUGUÊS: Direta e sofisticada.
      JSON TÉCNICO: {"action": "insert", "amount": ${valorInput || 0}, "category": "nome"}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: contexto },
            // ZERAR HISTÓRICO: Enviamos APENAS a mensagem atual para matar o vício do "7"
            { role: "user", content: promptDigitado }
          ],
          temperature: 0.1 // Precisão cirúrgica
        })
      });

      const data = await response.json();
      const text = data.choices[0].message.content;

      const textoLimpo = text.replace(/\{.*\}/s, "").trim();
      const jsonMatch = text.match(/\{.*\}/s);

      if (jsonMatch) {
        try {
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
        } catch (e) {}
      }
      setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Reiniciando sistema de precisão..." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header com indicador de V5 */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5 hover:border-yellow-400/50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">SECURITY V5.0 - ANTI-HALLUCINATION</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Memória limpa. Sistema de precisão ativado.</p>
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
            placeholder="Comando de precisão..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white placeholder:text-zinc-600"
          />
          <button onClick={processarIA} disabled={loading} className="bg-yellow-400 text-black p-3 rounded-full hover:scale-95 transition-all">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
