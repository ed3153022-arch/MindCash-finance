"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// Inicialização limpa fora do componente
const genAI = new GoogleGenerativeAI("AIzaSyDmaA8zu3hfePDxq0Bl3Clz2DUN2LHYU2w");

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
      
      const [trans, metas, sonhos] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id),
        supabase.from("goals").select("*").eq("user_id", user?.id),
        supabase.from("dream_goals").select("*").eq("user_id", user?.id)
      ]);

      // CHAMADA SIMPLIFICADA (A versão 0.21.0 cuida do resto)
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

      const contexto = `
        Você é o "Cérebro" de um app financeiro hardcore chamado MindCash. 
        Dados: Transações: ${JSON.stringify(trans.data?.slice(-10))}, Metas: ${JSON.stringify(metas.data)}.
        
        Regras:
        1. Para gastos/ganhos, responda APENAS o JSON: {"action": "insert", "type": "saida" ou "entrada", "amount": valor, "category": "nome"}
        2. Para conversas, seja direto, inteligente e use emojis.
      `;

      // Gerando conteúdo
      const result = await model.generateContent(contexto + "\nUsuário: " + promptDigitado);
      const response = await result.response;
      const text = response.text();

      if (text.includes("{") && text.includes("action")) {
        try {
          const json = JSON.parse(text.match(/\{.*\}/s)?.[0] || "");
          if (json.action === "insert") {
            await supabase.from("transactions").insert({
              user_id: user?.id,
              type: json.type,
              amount: json.amount,
              category: json.category,
              created_at: new Date()
            });
            setMessages(prev => [...prev, { role: "bot", text: `✅ Registrado: ${json.category} - R$ ${json.amount}` }]);
          }
        } catch (e) {
          setMessages(prev => [...prev, { role: "bot", text: text }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "bot", text: text }]);
      }
    } catch (error: any) {
      console.error("Erro completo:", error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "❌ ERRO: " + (error.message || "Falha na IA") 
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-purple-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">IA Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-purple-500 animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">O que você quer que eu processe?</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] ${
              m.role === 'user' 
                ? 'bg-yellow-400 text-black font-bold' 
                : 'bg-zinc-900 border border-white/10 text-zinc-100 italic'
            }`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-purple-500/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Comande o cérebro..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic"
          />
          <button 
            onClick={processarIA} 
            disabled={loading} 
            className="bg-purple-600 text-white p-3 rounded-full"
          >
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
