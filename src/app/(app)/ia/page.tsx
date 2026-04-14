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
      
      // BUSCA TUDO: Transações, Metas Mensais e Objetivos de Vida (Sonhos)
      const [trans, metas, sonhos] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id).order('created_at', { ascending: false }).limit(20),
        supabase.from("goals").select("*").eq("user_id", user?.id),
        supabase.from("dream_goals").select("*").eq("user_id", user?.id)
      ]);

      // --- NOVA PERSONALIDADE E CONTEXTO ---
      const contexto = `Você é o "Cérebro", mentor financeiro pessoal e hardcore do MindCash. 
      Sua missão é ser o guardião do dinheiro do usuário.

      DADOS REAIS:
      - Transações: ${JSON.stringify(trans.data)}
      - Metas Mensais: ${JSON.stringify(metas.data)}
      - Objetivos de Vida (Sonhos): ${JSON.stringify(sonhos.data)}

      PERSONALIDADE E REGRAS:
      1. HUMANO E DIRETO: Fale como um mentor próximo. Use termos como "mestre", "chefe", "bora lá".
      2. AGRESSIVIDADE/MOTIVAÇÃO: Se o usuário gastou muito ou está longe das metas, seja firme. Se ele completou algo (como a Bike), comemore muito!
      3. PRECISÃO NOS SONHOS: Analise os SONHOS. Se o usuário perguntar da "Viagem" ou "Bike", calcule o progresso baseado nas transações e dê a % real.
      4. CATEGORIAS FIXAS: Use APENAS 🚗 Transporte, 💊 Saúde, 💳 Assinaturas, 🛍 Compras, ⚡️ Outros, 🍔 Alimentação, 🎮 Lazer, 🏠 Moradia.
      5. LIMPEZA: PROIBIDO usar asteriscos (*). Texto limpo e legível.
      6. FORMATO DE REGISTRO: Se for para salvar algo, responda APENAS o JSON: {"action": "insert", "type": "saida", "amount": valor, "category": "nome"}.`;

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
            ...messages.slice(-4).map(m => ({ 
              role: m.role === 'user' ? 'user' : 'assistant', 
              content: m.text 
            })),
            { role: "user", content: promptDigitado }
          ],
          temperature: 0.7 // Equilíbrio entre precisão e fala humana
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Erro na Groq");

      const text = data.choices[0].message.content;

      // Lógica de processar JSON para inserção automática
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

            const emojis: any = {
              "Transporte": "🚗", "Saúde": "💊", "Assinaturas": "💳", 
              "Compras": "🛍", "Outros": "⚡️", "Alimentação": "🍔", 
              "Lazer": "🎮", "Moradia": "🏠"
            };
            const emoji = emojis[json.category] || "✅";

            setMessages(prev => [...prev, { role: "bot", text: `${emoji} Feito, chefe! Registrei ${json.category} de R$ ${json.amount}. Vamos focar no que importa agora?` }]);
          }
        } catch (e) {
          setMessages(prev => [...prev, { role: "bot", text: text.replace(/\*/g, '') }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "bot", text: text.replace(/\*/g, '') }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: "❌ ERRO: " + error.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header Amarelo Neon */}
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5 hover:border-yellow-400/50 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_#facc15]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-zinc-400">MindCash Engine</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Diz aí, mestre. Como estão as contas hoje?</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${
              m.role === 'user' 
              ? 'bg-yellow-400 text-black font-bold shadow-yellow-400/5' 
              : 'bg-zinc-900 border border-white/10 text-zinc-100 italic font-medium'
            }`}>
              <p className="text-sm">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area Neon */}
      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-yellow-400/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Diz aí pro Cérebro..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white placeholder:text-zinc-600"
          />
          <button 
            onClick={processarIA} 
            disabled={loading} 
            className="bg-yellow-400 text-black p-3 rounded-full hover:scale-95 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
          >
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
