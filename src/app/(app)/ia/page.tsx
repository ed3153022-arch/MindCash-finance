"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation"; // Corrigido aqui

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
        supabase.from("transactions").select("*").eq("user_id", user?.id).order('created_at', { ascending: false }).limit(100),
        supabase.from("goals").select("*").eq("user_id", user?.id)
      ]);

      const contexto = `Você é o "Cérebro", mentor financeiro de precisão cirúrgica.

      ### CONCEITO DE OPERAÇÃO:
      Você gerencia LIMITES DE TETO (Orçamentos). O valor definido nas metas é o LIMITE MÁXIMO que o usuário pode gastar. Nunca use a palavra "Meta" para despesas. Use "Limite de Teto" ou "Orçamento".

      ### ESPECIFICAÇÃO DE CATEGORIAS (ESTRITO):
      - 🚗 **Transporte**: Uber, 99, táxi, combustível, pedágio, manutenção de veículo, estacionamento.
      - 💊 **Saúde**: Farmácia, remédios, consultas, exames, academia, suplementos, dentista, terapia.
      - 💳 **Assinaturas**: Netflix, Spotify, iCloud, Google One, GamePass, jornais, cursos mensais.
      - 🛍 **Compras**: Roupas, calçados, eletrônicos (celular, PC), móveis, perfumes, presentes.
      - ⚡️ **Outros**: Tarifas bancárias, impostos, multas, ou gastos não categorizáveis.
      - 🍔 **Alimentação**: Mercado, restaurantes, iFood, padaria, café, lanches rápidos, balas e doces.
      - 🎬 **Lazer**: Cinema, shows, festas, viagens, hobbies, barzinhos, jogos.
      - 🏠 **Moradia**: Aluguel, condomínio, luz, água, gás, internet, materiais de limpeza/reforma.

      ### ALGORITMO DE CÁLCULO DE PORCENTAGEM (PASSO A PASSO):
      1. Pegue o valor (V) da nova transação.
      2. Filtre no Histórico todos os gastos da mesma categoria (C) do mês atual.
      3. Some todos esses valores (H).
      4. Calcule o Gasto Total Acumulado (G = V + H).
      5. Localize o Limite de Teto (L) para a categoria (C).
      6. Calcule a Porcentagem: P = (G / L) * 100. (Ex: 20,2%).

      ### GESTÃO DE LIMITE E RESPOSTA:
      - **Abaixo de 80%**: "Feito, mestre! [Categoria] de R$ [Valor] registrada. Você consumiu [P]% do seu limite de teto."
      - **80% a 100%**: Alerta de proximidade. "Atenção, comandante: você atingiu [P]% do seu limite. O muro está próximo."
      - **Acima de 100% (Estouro)**: Puxão de orelha sério por furar o teto + 3 passos práticos para economizar.

      ### DADOS:
      Histórico: ${JSON.stringify(trans.data)}
      Limites: ${JSON.stringify(metas.data)}

      SAÍDA TÉCNICA (INVISÍVEL): No final, inclua apenas o objeto: {"action": "insert", "type": "saida", "amount": valor, "category": "nome"}`;

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
            ...messages.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: "user", content: promptDigitado }
          ],
          temperature: 0.5 
        })
      });

      const data = await response.json();
      const text = data.choices[0].message.content;

      const textoLimpo = text.replace(/json/gi, "").replace(/\{.*\}/s, "").trim();
      const jsonMatch = text.match(/\{.*\}/s);

      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[0]);
          if (json.action === "insert" && json.amount > 0) {
            await supabase.from("transactions").insert({
              user_id: user?.id,
              type: json.type,
              amount: json.amount,
              category: json.category,
              created_at: new Date()
            });
            setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
          } else {
            setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
          }
        } catch (e) {
          setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: "❌ ERRO: " + error.message }]);
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
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-zinc-400">MindCash Mentor v2.1</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Diz aí, mestre. Qual a boa de hoje?</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${
              m.role === 'user' 
              ? 'bg-yellow-400 text-black font-bold shadow-yellow-400/5' 
              : 'bg-zinc-900 border border-white/10 text-zinc-100 italic font-medium'
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
            placeholder="Comande o cérebro..." 
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
