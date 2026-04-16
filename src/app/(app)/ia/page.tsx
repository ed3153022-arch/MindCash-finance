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

      // --- LÓGICA DE RESET: CÁLCULO FEITO PELO SISTEMA (INFALÍVEL) ---
      const resumoProcessado = metas.data?.map(m => {
        const totalGasto = trans.data
          ?.filter(t => t.category === m.category)
          .reduce((acc, t) => acc + t.amount, 0) || 0;
        
        return {
          categoria: m.category,
          saldo_atual: totalGasto.toFixed(2),
          teto_maximo: m.amount.toFixed(2),
          porcentagem_atual: ((totalGasto / m.amount) * 100).toFixed(1)
        };
      });

      // --- TEMPERATURA DINÂMICA (0.2 para números, 0.8 para papo furado) ---
      const temNumeros = /\d/.test(promptDigitado);
      const temGasto = ["gastei", "pagou", "custou", "compra", "lança"].some(p => promptDigitado.toLowerCase().includes(p));
      const temperaturaDinamica = temGasto ? 0.2 : temNumeros ? 0.3 : 0.8;

      const contexto = `Você é o "Cérebro v3", mentor financeiro de elite. 
      ESTE É UM RESET: Esqueça conversas anteriores. Baseie-se APENAS nestes dados:

      DADOS DO SISTEMA (VALORES REAIS):
      ${JSON.stringify(resumoProcessado)}

      ### REGRAS DE OURO:
      1. FIDELIDADE: Se o sistema diz que o saldo é 2885.50, você JAMAIS dirá 7885.50. 
      2. CÁLCULO: Se o usuário adicionar um gasto novo (X), some X ao "saldo_atual" da categoria e recalcule a %.
      3. GESTÃO DE TETO:
         - < 80%: Elogio curto e elegante.
         - 80% a 100%: Alerta amarelo: "Atenção, o limite de teto está próximo."
         - > 100%: Puxão de orelha severo + 3 dicas de economia.
      4. CATEGORIAS ACEITAS: Transporte, Saúde, Assinaturas, Compras, Outros, Alimentação, Lazer, Moradia.

      ESTILO: Direto, sofisticado e sem mostrar fórmulas matemáticas.

      SAÍDA TÉCNICA: {"action": "insert" ou "none", "amount": 0, "category": ""}`;

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
            // Enviamos apenas as últimas 2 mensagens para manter o contexto limpo após o reset
            ...messages.slice(-2).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: "user", content: promptDigitado }
          ],
          temperature: temperaturaDinamica
        })
      });

      const data = await response.json();
      const text = data.choices[0].message.content;

      // Limpeza da resposta e processamento do JSON
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
          setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
        } catch (e) {
          setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: "❌ ERRO DE CONEXÃO: Reinicie o Cérebro." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5 hover:border-yellow-400/50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_#facc15]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">RESET MODE v3.0</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Sistema resetado. Aguardando novos dados.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${
              m.role === 'user' 
              ? 'bg-yellow-400 text-black font-bold' 
              : 'bg-zinc-900 border border-white/10 text-zinc-100 italic font-medium'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-yellow-400/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Inicie o novo ciclo..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white"
          />
          <button 
            onClick={processarIA} 
            disabled={loading} 
            className="bg-yellow-400 text-black p-3 rounded-full hover:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
