"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Bot, ArrowLeft, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

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

      // --- CÁLCULO DE BLINDAGEM NO TYPESCRIPT (O Cérebro não precisa calcular) ---
      const valorInput = parseFloat(promptDigitado.replace(/[^\d.,]/g, "").replace(",", "."));
      const temValor = !isNaN(valorInput);

      const dadosBlindados = metas.data?.map(m => {
        const jaGasto = trans.data?.filter(t => t.category === m.category)
          .reduce((acc, t) => acc + t.amount, 0) || 0;
        
        const novoTotal = jaGasto + (temValor ? valorInput : 0);
        const porc = (novoTotal / m.amount) * 100;

        return {
          categoria: m.category,
          saldo_anterior: jaGasto.toFixed(2),
          novo_saldo_se_confirmar: novoTotal.toFixed(2),
          porcentagem: porc.toFixed(1),
          teto: m.amount.toFixed(2)
        };
      });

      // --- LOGICA DE TEMPERATURA DINÂMICA ---
      const ehGasto = ["gastei", "paguei", "compra", "lança", "valor"].some(p => promptDigitado.toLowerCase().includes(p));
      const tempDinamica = ehGasto ? 0.1 : 0.7;

      // --- CONFIGURAÇÃO GEMINI ---
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      const contexto = `Você é o "Cérebro v6", o mentor financeiro definitivo. 
      Sua missão é relatar gastos com 100% de precisão.

      ### DADOS REAIS DO SISTEMA:
      ${JSON.stringify(dadosBlindados)}

      ### REGRAS RÍGIDAS DE RESPOSTA:
      1. NÃO CALCULE: Use apenas os valores de "novo_saldo_se_confirmar" e "porcentagem" da tabela acima.
      2. O NÚMERO 7: Se o valor começa com 2, você jamais dirá 7. Se falhar nisso, o sistema será corrompido.
      3. TOM DE VOZ (Baseado na Porcentagem):
         - Abaixo de 80%: Elogio sofisticado.
         - 80% a 100%: Alerta: "Atenção, comandante: o limite de teto está próximo."
         - Acima de 100%: Puxão de orelha severo por estourar o limite + 3 dicas rápidas.
      
      4. SAÍDA TÉCNICA: No final da resposta, inclua o JSON: {"action": "insert", "amount": ${valorInput || 0}, "category": "NOME_DA_CATEGORIA"}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contexto + "\n\nUsuário disse: " + promptDigitado }] }],
          generationConfig: { temperature: tempDinamica }
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;

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
        } catch (e) { console.error("Erro JSON", e); }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoLimpo }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "❌ ERRO: O Cérebro detectou uma falha de conexão." }]);
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
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">GEMINI ENGINE v6.0</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Bot size={48} className="text-yellow-400" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-yellow-400/70">Novo motor de inteligência ativado. Sem alucinações.</p>
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

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-yellow-400/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Comando de alta precisão..." 
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
