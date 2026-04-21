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
    const historicoFormatado = [...messages, userMsg].slice(-5).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text
    }));

    setMessages(prev => [...prev, userMsg]);
    const promptOriginal = input;
    setInput("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const agora = new Date();
      const mesAtual = agora.getMonth();
      const anoAtual = agora.getFullYear();

      const [trans, metas, sonhos] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user?.id),
        supabase.from("goals").select("*").eq("user_id", user?.id),
        supabase.from("dream_goals").select("*").eq("user_id", user?.id)
      ]);

      const listaObjetivos = sonhos.data?.map(s => `OBJ: ${s.name.toUpperCase()}`).join(", ") || "Nenhum objetivo";
      
      const vereditoPronto = metas.data?.map(meta => {
        const teto = Number(meta.amount) || 0;
        const gasto = trans.data?.filter(t => {
          const d = new Date(t.created_at);
          return t.type === "saida" && 
                 t.category?.toLowerCase() === meta.category?.toLowerCase() &&
                 d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const falta = teto - gasto;
        return `- ${meta.category}: R$ ${gasto.toFixed(2)} / R$ ${teto.toFixed(2)}. ${falta > 0 ? `Resta: R$ ${falta.toFixed(2)}` : `EXCEDEU: R$ ${Math.abs(falta).toFixed(2)}`}`;
      }).join("\n");

      const saldoGeral = trans.data?.reduce((acc, t) => 
        t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0) || 0;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [
            { 
              role: "system", 
              content: `Você é o CÉREBRO v9.7. Mentor Financeiro de Elite.
              
              CONTEXTO:
              - Saldo: R$ ${saldoGeral.toFixed(2)}
              - Objetivos: ${listaObjetivos}
              - Relatório: ${vereditoPronto}

              7 REGRAS DE OURO:
              1. CATEGORIAS DE SAÍDA: Use EXCLUSIVAMENTE: Transporte, Saúde, Assinaturas, Compras, Alimentação, Lazer, Moradia ou Outros. (Relógio = Compras).
              2. CATEGORIAS DE ENTRADA: "OBJ: NOME" ou "Receita".
              3. NÃO FAÇA CONTAS: Use os dados do relatório.
              4. DISCIPLINA: Dê puxão de orelha se houver excesso.
              5. SIGILO: NUNCA mencione JSON ou código.
              6. CURTO E GROSSO: Responda como um Comandante.
              7. IMPACTO: Avalie se o gasto fere o saldo.

              INSTRUÇÃO DE EXECUÇÃO: No fim, gere obrigatoriamente: {"action": "transaction", "type": "saida", "amount": 0, "category": "Nome"}` 
            },
            ...historicoFormatado 
          ],
          temperature: 0.2
        })
      });

      const data = await response.json();
      const fullText = data.choices[0].message.content;
      
      // Captura o JSON e limpa o texto para o usuário
      const jsonMatch = fullText.match(/\{[\s\S]*"action"[\s\S]*\}/);
      let textoParaExibir = fullText.split(/\{|JSON:/)[0].trim();

      if (jsonMatch) {
        try {
          const res = JSON.parse(jsonMatch[0]);
          // Normaliza os nomes das chaves caso a IA erre
          const amount = res.amount || res.quantia || 0;
          const type = res.type || res.tipo || 'saida';
          let category = res.category || res.categoria || 'Outros';

          if (amount > 0) {
            // Inteligência de Categoria Forçada no Código
            if (type === 'saida') {
              const c = category.toLowerCase();
              if (c.includes("compra") || c.includes("relógio") || c.includes("tenis")) category = "Compras";
              else if (c.includes("alimento") || c.includes("lanche") || c.includes("comer")) category = "Alimentação";
              else if (c.includes("uber") || c.includes("gasolina")) category = "Transporte";
              else if (c.includes("saude") || c.includes("remedio")) category = "Saúde";
              else if (c.includes("assinatura") || c.includes("netflix")) category = "Assinaturas";
              else if (c.includes("lazer") || c.includes("cinema")) category = "Lazer";
              else if (c.includes("moradia") || c.includes("aluguel")) category = "Moradia";
              else category = "Outros";
            } else {
              category = category.toUpperCase().includes('OBJ:') ? category.toUpperCase() : 'Receita';
            }

            await supabase.from("transactions").insert({
              user_id: user?.id,
              type: type,
              amount: amount,
              category: category,
              created_at: new Date().toISOString()
            });
          }
        } catch (e) { console.error("Erro no processamento tático."); }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoParaExibir || "Comandante, registro efetuado com sucesso." }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ Erro na base de dados.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-yellow-400">O CÉREBRO</h1>
          <span className="text-[10px] font-black text-zinc-500">MASTER COMMAND v9.7</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] ${
              m.role === 'user' ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-900 border border-white/10 text-zinc-100 italic'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/80">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Relate a missão..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-white"
          />
          <button onClick={processarIA} disabled={loading} className="bg-yellow-400 text-black p-3 rounded-full">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
