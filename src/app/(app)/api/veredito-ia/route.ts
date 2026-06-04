import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { saldo, poder, status, tipo, periodo, performance, offset } = await req.json();

    const extrairMes = (chave: string) => chave.split('-')[0];
    const mesNome = extrairMes(periodo);

    const escolher = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    // --- BANCO DE BLOCOS DINÂMICOS AMPLIADO ---
    const blocos = {
      aberturas: {
        PASSADO: [
          `Relatório de auditoria de ${mesNome}: `,
          `Análise retrospectiva do ciclo ${mesNome}: `,
          `Veredito técnico sobre o desempenho de ${mesNome}: `,
          `Flashback operacional de ${mesNome}: `,
          `Revisão de blindagem do mês de ${mesNome}: `
        ],
        ATUAL: [
          `Diagnóstico em tempo real de ${mesNome}: `,
          `Status operacional de ${mesNome}: `,
          `Comando de campo para o ciclo ${mesNome}: `,
          `Monitoramento de fluxo ativo (${mesNome}): `,
          `Alerta de performance do ciclo ${mesNome}: `
        ],
        FUTURO: [
          `Oráculo de capital para ${mesNome}: `,
          `Perspectiva de soberania em ${mesNome}: `,
          `Projeção estratégica para ${mesNome}: `,
          `Simulação de cenário para ${mesNome}: `,
          `Tendência de acumulação para ${mesNome}: `
        ]
      },
      analises: {
        erroTecnico: [
          `Sua gestão foi negligente. Com apenas ${performance?.toFixed(0)}% de radar, o erro foi permitir que o saldo de R$ ${saldo.toLocaleString('pt-BR')} ocultasse a falta de disciplina. `,
          `A performance de ${performance?.toFixed(0)}% revela uma falha grave de processo. Você operou no escuro, ignorando os limites técnicos fundamentais. `,
          `Houve um relaxamento perigoso na sua vigilância. O status ${status} está por um fio devido à sua inconsistência gritante nos lançamentos. `,
          `Baixo rigor operacional detectado. Você está movendo capital sem o rastro necessário, o que torna sua gestão de R$ ${saldo.toLocaleString('pt-BR')} pura sorte, não técnica. `,
          `Radar em nível crítico (${performance?.toFixed(0)}%). Onde está errando: você perdeu o hábito da conferência, deixando o ciclo vulnerável a vazamentos. `
        ],
        baixaRetencao: [
          `Você apenas movimentou volume, mas não construiu riqueza. O Poder de R$ ${poder.toLocaleString('pt-BR')} é medíocre perto do volume total. O erro foi tratar fluxo como lucro. `,
          `Existe uma drenagem ativa de capital. Sua taxa de retenção prova que você está trabalhando para alimentar o sistema, não para acumular poder real. `,
          `Onde está errando: sua blindagem de ativos é inexistente. Saldo alto sem poder real é uma armadilha perigosa para o ego. `,
          `Seu poder de R$ ${poder.toLocaleString('pt-BR')} está muito abaixo do potencial do seu faturamento. Você está deixando o dinheiro escorrer por falta de metas de retenção. `,
          `Ciclo de alta evasão. Você teve fôlego financeiro, mas não teve caráter de poupador. O status ${status} é frágil sem uma base sólida de ativos. `
        ],
        sucesso: [
          `Operação sólida e precisa. O status ${status} é o resultado direto de uma retenção inteligente e um radar de ${performance?.toFixed(0)}%. `,
          `Domínio total do capital. Você provou que a métrica de soberania está acima do faturamento bruto. Continue com esse rigor. `,
          `Eficiência técnica impecável. Você conseguiu transformar fluxo em R$ ${poder.toLocaleString('pt-BR')} de poder real, mantendo o controle total do radar. `,
          `Parabéns pela execução. O ciclo de ${mesNome} demonstra que você entendeu como o jogo da retenção funciona. Mantenha essa mentalidade. `,
          `Soberania em construção. O status ${status} aqui não é sorte, é engenharia financeira aplicada com sucesso. `
        ],
        // BLOCOS EXCLUSIVOS PARA O FUTURO (Evita o erro de undefined e fixa o objetivo)
        futuroSucesso: [
          `Operação sólida e precisa projetada. O status IMPLACÁVEL será o resultado direto de uma retenção inteligente e o alvo de radar em 100%. `,
          `Domínio total do capital. Você provou que a métrica de soberania está acima do faturamento bruto e atingirá 100% de performance se mantiver o plano. `,
          `Eficiência técnica projetada. A meta é transformar esse fluxo em poder real, mantendo o controle absoluto do radar no nível máximo. `,
          `O cenário para ${mesNome} demonstra que você entendeu o jogo. Mantenha o alvo de 100% de radar para consolidar sua soberania. `
        ],
        futuroAmeaca: [
          `A projeção indica insolvência. Mesmo com radar em 100%, seu motor de gastos fixos vai devorar suas reservas se não houver um corte de saídas agora. `,
          `Cenário de sobrevivência severo. O comportamento financeiro anterior revela que a estrutura de custos projetada é pesada demais para o saldo que restará. `,
          `Alerta de colapso de fluxo. Se o comportamento do ciclo anterior se repetir, você entrará em um espiral de descapitalização em ${mesNome}. `,
          `Risco de liquidez detectado. Suas saídas fixas estão sufocando a capacidade de gerar novo Poder. O futuro exige uma poda radical. `,
          `A conta não fecha no longo prazo. A inércia de gastos atuais está destruindo a projeção de ${mesNome} antes mesmo do ciclo começar. `
        ],
        futuroExpansao: [
          `A visão de longo prazo aponta para a consolidação do Status IMPLACÁVEL. Se mantiver o rigor, o efeito cascata será brutal. `,
          `Caminho livre para o domínio. Sua progressão de saldo projetada é sustentável e agressiva para o alvo operacional de 100%. `,
          `Soberania exponencial. O acúmulo de capital em ${mesNome} será o maior dos últimos tempos se você não desviar do plano agora. `,
          `Cenário de prosperidade técnica. Você está construindo uma escada de saldo que o coloca em uma posição de defesa impenetrável com radar em 100%. `,
          `A projeção de R$ ${saldo.toLocaleString('pt-BR')} para ${mesNome} é o reflexo de um plano executado com maestria. Continue o cerco para manter o status IMPLACÁVEL. `
        ]
      },
      direcionamentos: {
        melhorar: [
          `A melhora deve ser feita no estancamento imediato de saídas variáveis. `,
          `Onde melhorar: renegocie seus custos fixos e aumente sua margem de retenção. `,
          `Ação necessária: retome a consistência dos lançamentos para recuperar o radar. `,
          `Foco total em defesa: reduza o padrão de vida até que o Poder supere o faturamento anterior. `,
          `Corrija a rota: pare de gastar por impulso e foque na blindagem do capital de giro. `
        ],
        manter: [
          `Mantenha o rigor operacional para não degradar o ciclo seguinte. `,
          `Não aceite nada abaixo deste padrão de performance daqui para frente. `,
          `Continue o processo de blindagem; a soberania está próxima. `,
          `Siga o plano à risca. A consistência é sua maior aliada neste estágio. `,
          `Proteja esse resultado. O segredo agora é não deixar a autoconfiança relaxar seu radar. `
        ]
      }
    };

    let parteAbertura = escolher(blocos.aberturas[tipo as keyof typeof blocos.aberturas]);
    let parteAnalise = "";
    let parteDirecionamento = "";

    if (tipo === "PASSADO" || tipo === "ATUAL") {
      if (performance < 60) {
        parteAnalise = escolher(blocos.analises.erroTecnico);
        parteDirecionamento = escolher(blocos.direcionamentos.melhorar);
      } 
      else if (poder < (saldo * 0.2) && saldo > 0) {
        parteAnalise = escolher(blocos.analises.baixaRetencao);
        parteDirecionamento = escolher(blocos.direcionamentos.melhorar);
      } 
      else {
        parteAnalise = escolher(blocos.analises.sucesso);
        parteDirecionamento = escolher(blocos.direcionamentos.manter);
      }
    } 
    
    else if (tipo === "FUTURO") {
      if (saldo <= 0) {
        parteAnalise = escolher(blocos.analises.futuroAmeaca);
        parteDirecionamento = escolher(blocos.direcionamentos.melhorar);
      } else {
        // AJUSTE AQUI: Usa blocos que não chamam a variável performance
        parteAnalise = escolher(offset === 2 ? blocos.analises.futuroExpansao : blocos.analises.futuroSucesso);
        parteDirecionamento = escolher(blocos.direcionamentos.manter);
      }
    }

    const vereditoFinal = `${parteAbertura}${parteAnalise}${parteDirecionamento}`;

    return NextResponse.json({ text: vereditoFinal });

  } catch (error) {
    console.error("Erro no motor de vereditos:", error);
    return NextResponse.json({ text: "Veredito técnico em processamento..." }, { status: 500 });
  }
}
