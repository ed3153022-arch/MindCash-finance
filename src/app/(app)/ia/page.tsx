"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

// CHAVE ATUALIZADA
const genAI = new GoogleGenerativeAI("AIzaSyD5ht7k6UV-nLEiP_t5IAFlnTNyf-Z2zmU");

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

      // CONFIGURAÇÃO REFORÇADA: models/ + apiVersion v1
      const model = genAI.getGenerativeModel(
        { model: "models/gemini-1.5-flash" },
        { apiVersion: "v1" }
      );

      const contexto = `
        Você é o "Cérebro" de um app financeiro hardcore. 
        Dados atuais do usuário:
        - Transações recentes: ${JSON.stringify(trans.data?.slice(-10))}
        - Metas: ${JSON.stringify(metas.data)}
        - Sonhos: ${JSON.stringify(sonhos.data)}

        Regras de Resposta:
        1. Se o usuário informar um gasto ou ganho, responda estritamente com este JSON: 
           {"action": "insert", "type": "saida" ou "entrada", "amount": valor_numerico, "category": "nome_categoria"}
        2. Se for uma pergunta ou conversa, seja inteligente, direto e use emojis.
        Categorias: Alimentação, Moradia, Transporte, Lazer, Saúde, Educação, Assinaturas, Compras.
      `;

      const result = await model.generateContent([contexto, promptDigitado]);
      const response = await result.response;
      const text = response.text();

      // Lógica de inserção automática se a IA retornar JSON
      if (text.includes("{")) {
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
            setMessages(prev => [...prev, { role: "bot", text: `✅ Entendido! Registrei seu/sua ${json.type} de R$ ${json.amount} em ${json.category}.` }]);
          }
        } catch (e) {
          setMessages(prev => [...prev, { role: "bot", text: text }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "bot", text: text }]);
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "❌ ERRO DE CONEXÃO: " + (error.message || "Falha na comunicação com o Google.") 
      }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-purple-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">IA Conectada</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-purple-500 animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Diga o que gastou ou peça um veredito financeiro</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] ${
              m.role === 'user' 
                ? 'bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/10' 
                : 'bg-zinc-900 border border-white/10 text-zinc-100 italic'
            }`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-purple-500/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Digite algo para a IA..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic placeholder:text-zinc-700"
          />
          <button 
            onClick={processarIA} 
            disabled={loading} 
            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-500 disabled:opacity-50 transition-all"
          >
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
