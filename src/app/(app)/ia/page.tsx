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
    const historicoFormatado = [...messages, userMsg].slice(-7).map(m => ({
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

      const categoriasOficiais = metas.data?.map(m => m.category) || [];
      const listaObjetivos = sonhos.data?.map(s => `OBJ: ${s.name.toUpperCase()}`).join(", ") || "";
      
      // CÁLCULO EXATO DOS VEREDITOS (O CÉREBRO NÃO PRECISA FAZER CONTA)
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

        return `Categoria ${meta.category}: Gasto R$ ${gasto.toFixed(2)} de R$ ${teto.toFixed(2)}. Progresso: ${porcentagem.toFixed(1)}%. ${falta > 0 ? `Falta R$ ${falta.toFixed(2)} para o teto.` : `Excedeu o teto em R$ ${Math.abs(falta).toFixed(2)}.`}`;
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
              content: `Você é o CÉREBRO v8. Mentor Financeiro de Elite. Persona: Comandante.
              IDIOMA: APENAS PORTUGUÊS (BRASIL).
              
              CONTEXTO REAL DO USUÁRIO:
              - Saldo Geral em Caixa: R$ ${saldoGeral.toFixed(2)}
              - Objetivos Disponíveis: ${listaObjetivos}
              - VEREDITO PRONTO (Use estes dados para responder):
              ${vereditoPronto}

              MAPA DE CATEGORIAS OFICIAIS (8):
              1. Transporte: Uber, gasolina, ônibus, oficina.
              2. Saúde: Farmácia, médico, exames.
              3. Assinaturas: Netflix, Spotify, Internet, iCloud.
              4. Compras: Relógio, camiseta, tênis, shopping, eletrônicos.
              5. Alimentação: iFood, restaurante, mercado, lanche.
              6. Lazer: Cinema, viagem, festa, shows.
              7. Moradia: Aluguel, luz, água, reforma.
              8. Outros: Qualquer coisa que não se encaixe acima.

              REGRAS CRÍTICAS:
              1. NÃO FAÇA CONTAS. Use os dados do "VEREDITO PRONTO" acima.
              2. ENTRADAS: Se for para objetivo, use "OBJ: NOME". Se for ganho solto, use "Receita".
              3. RESPOSTA: Seja curto, grosso e estratégico.
              4. JSON (Obrigatório na última linha para o sistema, será ocultado do usuário): {"action": "transaction", "type": "saida/entrada", "amount": 0, "category": "nome"}` 
            },
            ...historicoFormatado 
          ],
          temperature: 0.2
        })
      });

      const data = await response.json();
      const fullText = data.choices[0].message.content;
      const jsonMatch = fullText.match(/\{[\s\S]*?\}/); 
      let textoParaExibir = fullText;

      if (jsonMatch) {
        textoParaExibir = fullText.replace(jsonMatch[0], "").trim();
        try {
          const res = JSON.parse(jsonMatch[0]);
          if (res.action === "transaction") {
            const valorFinal = res.amount || parseFloat(promptOriginal.replace(/[^\d.,]/g, "").replace(",", "."));
            
            let categoriaFinal = 'Outros';
            if (res.type === 'entrada') {
              if (res.category?.toUpperCase().includes('OBJ:')) {
                categoriaFinal = res.category.toUpperCase().trim();
              } else {
                categoriaFinal = 'Receita';
              }
            } else {
              // Mapeamento forçado para as 8 categorias
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

            if (!isNaN(valorFinal) && valorFinal > 0) {
              await supabase.from("transactions").insert({
                user_id: user?.id,
                type: res.type,
                amount: valorFinal,
                category: categoriaFinal,
                created_at: new Date().toISOString()
              });
            }
          }
        } catch (e) { console.warn("Erro JSON:", e); }
      }
      
      const mensagemFinal = textoParaExibir.split('{')[0].trim().replace(/[/\\_]{2,}/g, "");
      setMessages(prev => [...prev, { role: "bot", text: mensagemFinal || "Comandante, ordem executada." }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ COMANDANTE: Falha na base de dados.` }]);
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
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">MASTER COMMAND v8.0</span>
          </div>
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
        <div ref={scrollRef} />
      </div>

      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-md">
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10 focus-within:border-yellow-400/50 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Relate a estratégia, Comandante..." 
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold italic text-white"
          />
          <button onClick={processarIA} disabled={loading} className="bg-yellow-400 text-black p-3 rounded-full hover:scale-95 transition-all">
            {loading ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
