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
      if (!user) throw new Error("Sessão expirada.");

      const agora = new Date();
      const mesAtual = agora.getMonth();
      const anoAtual = agora.getFullYear();

      const [trans, metas, sonhos] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("dream_goals").select("*").eq("user_id", user.id)
      ]);

      const listaObjetivos = sonhos.data?.length 
        ? sonhos.data.map(s => `OBJ: ${s.name.toUpperCase()}`).join(", ") 
        : "Nenhum objetivo ativo.";
      
      const vereditoPronto = metas.data?.length 
        ? metas.data.map(meta => {
            const teto = Number(meta.amount) || 0;
            const gasto = trans.data?.filter(t => {
              const d = new Date(t.created_at);
              return t.type === "saida" && 
                     t.category?.toLowerCase() === meta.category?.toLowerCase() &&
                     d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
            }).reduce((acc, t) => acc + Number(t.amount), 0) || 0;
            const falta = teto - gasto;
            return `- ${meta.category}: R$ ${gasto.toFixed(2)} / R$ ${teto.toFixed(2)}. ${falta >= 0 ? `Livre: R$ ${falta.toFixed(2)}` : `ESTOURO: R$ ${Math.abs(falta).toFixed(2)}`}`;
          }).join("\n")
        : "Nenhuma meta mensal configurada.";

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
              content: `Você é o CÉREBRO v9.9. Mentor Financeiro de Elite. Persona: Comandante.
              
              DADOS EM TEMPO REAL:
              - Saldo Geral: R$ ${saldoGeral.toFixed(2)}
              - Objetivos: ${listaObjetivos}
              - Relatório de Metas: ${vereditoPronto}

              7 REGRAS DE OURO:
              1. Use apenas categorias oficiais: Transporte, Saúde, Assinaturas, Compras, Alimentação, Lazer, Moradia ou Outros.
              2. Entradas sem objetivo vão para "Receita". Com objetivo: "OBJ: NOME".
              3. Proibido fazer cálculos. Use os dados prontos do Relatório.
              4. Se o usuário exceder o teto de uma meta, seja severo na disciplina.
              5. SIGILO TOTAL: Proibido falar termos técnicos, JSON ou códigos.
              6. Fale como um Comandante: Direto, estratégico e firme.
              7. Sempre termine a análise avaliando o impacto no Saldo Geral.

              3 PROTOCOLOS DE REFINAMENTO:
              1. VALIDAÇÃO: Revise se a categoria escolhida é a mais lógica para o gasto (Ex: Relógio é Compras).
              2. CONSISTÊNCIA: Se não houver metas, exija que o usuário defina uma estratégia urgente.
              3. SOBREVIVÊNCIA: Verifique se este gasto compromete a liquidez imediata para contas essenciais.

              INSTRUÇÃO TÉCNICA DE SAÍDA (OBRIGATÓRIA):
              Para qualquer gasto ou ganho, inclua EXATAMENTE esta linha no final:
              {"action": "transaction", "type": "saida/entrada", "amount": valor, "category": "nome"}
              Nota: Relógio = Compras | Lanche/Mercado = Alimentação | Uber/Gasolina = Transporte.` 
            },
            ...historicoFormatado 
          ],
          temperature: 0.1
        })
      });

      const data = await response.json();
      const fullText = data.choices[0].message.content;
      
      // Captura o JSON e limpa a visualização do usuário
      const jsonMatch = fullText.match(/\{[\s\S]*"action"[\s\S]*\}/);
      let textoParaExibir = fullText.split(/\{|JSON:|comando:|Protocolo:/i)[0].trim();

      if (jsonMatch) {
        try {
          const res = JSON.parse(jsonMatch[0]);
          const valor = Number(res.amount || 0);
          
          if (valor > 0) {
            await supabase.from("transactions").insert({
              user_id: user.id,
              type: res.type === 'entrada' ? 'entrada' : 'saida',
              amount: valor,
              category: res.category || 'Outros',
              created_at: new Date().toISOString()
            });
          }
        } catch (e) { console.error("Erro no Protocolo Oculto."); }
      }
      
      setMessages(prev => [...prev, { role: "bot", text: textoParaExibir || "Ordem executada, Comandante." }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: "bot", text: `❌ STATUS: ${error.message}` }]);
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
          <h1 className="text-xl font-black text-yellow-400 italic uppercase">O CÉREBRO</h1>
          <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">Estrategista v9.9</span>
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
        <div className="flex gap-2 bg-zinc-900 p-2 rounded-[2rem] border border-white/10">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && processarIA()}
            placeholder="Relate a missão, Comandante..." 
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
