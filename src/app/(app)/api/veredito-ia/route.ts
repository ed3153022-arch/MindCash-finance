import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Recebe os dados do frontend
    const { saldo, poder, status, tipo, periodo } = await req.json();

    // 2. Validação básica de segurança
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("ERRO: NEXT_PUBLIC_OPENROUTER_API_KEY não configurada.");
      return NextResponse.json(
        { text: "Erro de configuração no servidor." },
        { status: 500 }
      );
    }

    // 3. Cálculo da taxa de retenção para enriquecer o contexto da IA
    const taxaRetencao = ((poder / saldo) * 100).toFixed(1);

    // 4. Chamada oficial para o OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://mindcash.finance", // Identificação para o OpenRouter
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content: `Você é o "Veredito", a inteligência analítica e direta do app MindCash. 
            Sua missão é dar uma sentença sobre a saúde financeira do usuário baseada nos números fornecidos.
            
            REGRAS CRÍTICAS:
            - Seja extremamente direto. Máximo 140 caracteres.
            - Não use saudações (Olá, Parabéns, Sinto muito). Comece direto na análise.
            - Se a Taxa de Retenção for < 15%: Seja duro e crítico. O usuário está falhando na blindagem.
            - Se a Taxa de Retenção for > 25%: Reconheça a dominância, mas exija consistência.
            - Use vocabulário técnico: Poder Real, Blindagem, Retenção, Capital, Ciclo, Medíocre, Dominante.
            - Idioma: Português Brasileiro.`
          },
          {
            role: "user",
            content: `Ciclo: ${periodo}. Saldo: R$ ${saldo}. Poder: R$ ${poder}. Retenção: ${taxaRetencao}%. Status: ${status}. Tipo: ${tipo}.`
          }
        ],
        temperature: 0.3, // Menos criatividade, mais precisão analítica
        max_tokens: 100,
      }),
    });

    const data = await response.json();

    // Tratamento de erro na resposta da API
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Resposta inválida da IA");
    }

    const sentenca = data.choices[0].message.content.trim();

    return NextResponse.json({ text: sentenca });

  } catch (error) {
    console.error("Erro na API Route do Veredito:", error);
    return NextResponse.json(
      { text: "Análise técnica indisponível. Reavalie os dados manualmente." },
      { status: 500 }
    );
  }
}
