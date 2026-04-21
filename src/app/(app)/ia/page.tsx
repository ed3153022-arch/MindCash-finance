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

      const listaObjetivos = sonhos.data?.map(s => `OBJ: ${s.name.toUpperCase()}`).join(", ") || "Nenhum objetivo definido";
      
      const vereditoPronto = metas.data?.map(meta => {
        const teto = Number(meta.amount) || 0;
        const gasto = trans.data?.filter(t => {
          const d = new Date(t.created_at);
          return t.type === "saida" && 
                 t.category?.toLowerCase() === meta.category?.toLowerCase() &&
                 d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
        const porcentagem = teto > 0 ? (gasto / teto) * 100 : 0;
        const falta = teto - gasto;
        return `- ${meta.category}: Gasto R$ ${gasto.toFixed(2)} de R$ ${teto.toFixed(2)} (${porcentagem.toFixed(1)}%). ${falta > 0 ? `Restam R$ ${falta.toFixed(2)}` : `EXCEDEU R$ ${Math.abs(falta).toFixed(2)}`}`;
      }).join("\n");

      const saldoGeral = trans.data?.reduce((acc, t) => 
        t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0) || 0;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://mindcash.vercel.app', 
          'X-Title': 'MindCash'
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [
            { 
              role: "system", 
              content: `Você é o CÉREBRO v9.5. Mentor Financeiro de Elite.
              PERSONA: Autoritário, focado em resultados, militar.
              
              SITUAÇÃO ATUAL:
              - Saldo: R$ ${saldoGeral.toFixed(2)}
              - Objetivos: ${listaObjetivos}
              - Relatório de Categorias:
              ${vereditoPronto}

              7 REGRAS DE OURO DO COMANDANTE:
              1. CATEGORIAS DE SAÍDA: Use apenas: Transporte, Saúde, Assinaturas, Compras, Alimentação, Lazer, Moradia ou Outros. Não invente novas categorias.
              2. CATEGORIAS DE ENTRADA: Se houver objetivo claro, use "OBJ: NOME". Se não houver, use "Receita".
              3. NÃO FAÇA CONTAS: Utilize os dados do relatório acima para dar seus vereditos.
              4. DISCIPLINA: Se houver excesso de gastos (excedeu o teto), dê um puxão de orelha severo.
              5. SIGILO ABSOLUTO: Nunca mencione JSON, código, chaves ou termos de programação.
              6. CURTO E GROSSO: Responda de forma estratégica, direta e sem enrolação.
              7. ANÁLISE DE IMPACTO: Sempre avalie se o novo gasto compromete o saldo geral ou os objetivos.

              PROTOCOLO DE SISTEMA (Invisível ao usuário): 
              Gere sempre um JSON técnico ao final de cada transação no formato: {"action": "transaction", "type": "saida/entrada", "amount": 0, "category": "nome"}` 
            },
            ...historicoFormatado 
          ],
          temperature: 0.2
        })
      });

      const data = await response.json();
      const fullText = data.choices[0].message.content;
      
      // Captura o JSON para execução mas impede que ele chegue na tela
      const jsonMatch = fullText.match(/\{"action":\s*"transaction"[\s\S]*?\}/);
      let textoParaExibir = fullText;

      if (jsonMatch) {
        // Remove o JSON e qualquer menção técnica próxima a ele
        textoParaExibir = fullText.split('{')[0].trim();
        try {
          const res = JSON.parse(jsonMatch[0]);
          if (res.action === "transaction" && res.amount > 0) {
            let categoriaFinal = 'Outros';
            if (res.type === 'entrada') {
              categoriaFinal = res.category?.toUpperCase().includes('OBJ:') ? res.category.toUpperCase() : 'Receita';
            } else {
              const c = res.category?.toLowerCase() || "";
              if (c.includes("transporte")) categoriaFinal = "Transporte";
              else if (c.includes("saúde") || c.includes("saude")) categoriaFinal = "Saúde";
              else if (c.includes("assinatura")) categoriaFinal = "Assinaturas";
              else if (c.includes("compra")) categoriaFinal = "Compras";
              else if (c.includes("alimenta")) categoriaFinal = "Alimentação";
              else if (c.includes("lazer")) categoriaFinal = "Lazer";
              else if (c.includes("moradia")) categoriaFinal = "Moradia";
              else categoriaFinal = "Outros";
            }

            await supabase.from("transactions").insert({
              user_id: user?.id,
              type: res.type,
              amount: res.amount,
              category: categoriaFinal,
              created_at: new Date().toISOString()
            });
          }
        } catch (e) { console.error("Falha no Protocolo Oculto."); }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoParaExibir || "Missão cumprida, Comandante. O registro foi efetuado." }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ COMANDANTE: Erro na rede de inteligência.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-full border border-white/5">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-yellow-400">O CÉREBRO</h1>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MASTER COMMAND v9.5</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] shadow-xl ${
              m.role === 'user' ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-900 border border-white/10 text-zinc-100 italic'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 p-4 rounded-[1.5rem] animate-pulse text-zinc-500 text-xs uppercase font-black">
              Analisando estratégia...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Relate a missão, Comandante..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white"
          />
          <button onClick={processarIA} disabled={loading} className="bg-yellow-400 text-black p-3 rounded-full">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
