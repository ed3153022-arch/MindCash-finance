"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  X, 
  PlusCircle, 
  Sliders,
  Target,
  Settings,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase"; 

interface Investimento {
  id: string;
  ticker: string;
  preco_unitario: number;
  quantidade: number;
  valor_total: number;
  categoria: string;
  created_at: string;
}

interface Meta {
  id: string;
  periodo: "SEMANA" | "MÊS" | "ANO";
  valor_alvo: number;
  qtd_aportes_alvo: number | null;
  valor_minimo_configurado: number | null;
  status: "ATIVA" | "CONCLUIDA" | "EXPIRADA";
  created_at: string;
  vencimento: string;
}

export default function InvestimentosPage() {
  // Estados de controle dos Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMetaDrawerOpen, setIsMetaDrawerOpen] = useState(false);

  // Estados de dados vindos do Supabase
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]); // Guarda até as 3 metas ativas juntas
  const [loading, setLoading] = useState(true);

  // Estado para controlar qual meta do carrossel está visível (0 = SEMANA, 1 = MÊS, 2 = ANO)
  const [indiceCarrossel, setIndiceCarrossel] = useState(1); // Começa focado no MÊS por padrão
  const periodosOrdem: ("SEMANA" | "MÊS" | "ANO")[] = ["SEMANA", "MÊS", "ANO"];

  // ESTADOS FORMULÁRIO DE APORTE
  const [ticker, setTicker] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [categoria, setCategoria] = useState("AÇÕES BRASIL");

  // ESTADOS FORMULÁRIO DE METAS
  const [periodoMeta, setPeriodoMeta] = useState<"SEMANA" | "MÊS" | "ANO" | null>(null);
  const [valorAlvo, setValorAlvo] = useState("");
  const [qtdAportesMeta, setQtdAportesMeta] = useState("");
  const [valorMinimoAporte, setValorMinimoAporte] = useState("");

  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [perfilAlvo, setPerfilAlvo] = useState<"CONSERVADOR" | "MODERADO" | "ARROJADO">("MODERADO");
  const [perfilSelecionado, setPerfilSelecionado] = useState<"CONSERVADOR" | "MODERADO" | "ARROJADO">("MODERADO");

  // FUNÇÃO REUTILIZÁVEL PARA CARREGAR E CHECAR EXPIRAÇÕES
  async function carregarDados() {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: invData, error: invError } = await supabase
        .from("investimentos")
        .select("id, ticker, preco_unitario, quantidade, valor_total, categoria, created_at")
        .order("created_at", { ascending: false });

      if (invError) throw invError;
      if (invData) setInvestimentos(invData);

      const { data: metasData, error: metasError } = await supabase
        .from("metas")
        .select("*")
        .eq("status", "ATIVA");

      if (metasError) throw metasError;

      if (metasData) {
        const agora = new Date();
        const metasValidas: Meta[] = [];

        for (const meta of metasData) {
          if (agora > new Date(meta.vencimento)) {
            await supabase.from("metas").update({ status: "EXPIRADA" }).eq("id", meta.id);
          } else {
            metasValidas.push(meta);
          }
        }
        setMetas(metasValidas);
      }

      if (user?.id) {
        const { data: perfilData } = await supabase
          .from("perfis_usuarios")
          .select("perfil_alvo")
          .eq("user_id", user.id)
          .maybeSingle();

        const perfilSalvo = perfilData?.perfil_alvo as "CONSERVADOR" | "MODERADO" | "ARROJADO" | undefined;
        setPerfilAlvo(perfilSalvo || "MODERADO");
        setPerfilSelecionado(perfilSalvo || "MODERADO");
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Supabase:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // CÁLCULO DO PORTFÓLIO TOTAL
  const patrimonioTotal = investimentos.reduce((acc, inv) => acc + (inv.valor_total || 0), 0);

  const pesoCategoria = (categoria: string) => {
    if (categoria === "RENDA FIXA") return 1.0;
    if (categoria === "AÇÕES BRASIL" || categoria === "FII") return 2.0;
    return 3.0;
  };

  const riscoTotal = investimentos.reduce(
    (acc, inv) => acc + ((inv.valor_total || 0) * pesoCategoria(inv.categoria)),
    0
  );

  const scoreGlobal = patrimonioTotal > 0 ? riscoTotal / patrimonioTotal : 0;
  const perfilReal = scoreGlobal <= 1.6 ? "CONSERVADOR" : scoreGlobal <= 2.4 ? "MODERADO" : "ARROJADO";
  const perfilRank = { CONSERVADOR: 1, MODERADO: 2, ARROJADO: 3 };
  const perfilRealRank = perfilRank[perfilReal];
  const perfilAlvoRank = perfilRank[perfilAlvo];

  const categoriasAgrupadas = investimentos.reduce((acc, inv) => {
    const categoriaKey = inv.categoria;
    const valor = (typeof inv.valor_total === 'number' && inv.valor_total > 0)
      ? inv.valor_total
      : ((inv.preco_unitario || 0) * (inv.quantidade || 0));
    acc[categoriaKey] = (acc[categoriaKey] || 0) + valor;
    return acc;
  }, {} as Record<string, number>);

  const categoriasOrdenadas = Object.entries(categoriasAgrupadas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([categoria, total]) => ({
      categoria,
      label:
        categoria === "INTERNACIONAL"
          ? "OFFSHORE"
          : categoria === "AÇÕES BRASIL"
          ? "VARIÁVEL"
          : categoria === "FII"
          ? "IMOBILIÁRIO"
          : categoria === "CRIPTOMOEDAS"
          ? "CRIPTO"
          : categoria,
      percentual: patrimonioTotal ? (total / patrimonioTotal) * 100 : 0,
    }));

  const ativosAgrupados = investimentos.reduce((acc, inv) => {
    const tickerKey = inv.ticker.toUpperCase();
    if (!acc[tickerKey]) {
      acc[tickerKey] = { valor_total: 0, categoria: inv.categoria };
    }
    acc[tickerKey].valor_total += (typeof inv.valor_total === 'number' && inv.valor_total > 0)
      ? inv.valor_total
      : ((inv.preco_unitario || 0) * (inv.quantidade || 0));
    return acc;
  }, {} as Record<string, { valor_total: number; categoria: string }>);

  const topAtivos = Object.entries(ativosAgrupados)
    .map(([ticker, info]) => {
      const share = patrimonioTotal ? info.valor_total / patrimonioTotal : 0;
      const diff = (share - 0.15) * 100;
      return {
        ticker,
        categoria: info.categoria,
        valor_total: info.valor_total,
        share,
        variation: diff,
      };
    })
    .sort((a, b) => b.valor_total - a.valor_total)
    .slice(0, 3);

  const liberdadeTarget = 350000;
  const progressoLiberdadePct = Math.min((patrimonioTotal / liberdadeTarget) * 100, 100);
  const anosParaLiberdade = Math.max(1, Math.ceil(14 * (1 - progressoLiberdadePct / 100)));
  const dataEstimativa = new Date();
  dataEstimativa.setFullYear(dataEstimativa.getFullYear() + anosParaLiberdade);
  const dataEstimativaTexto = dataEstimativa
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .toUpperCase();

  const alertaTaticoConfig = {
    texto: "✅ SISTEMA EM EQUILÍBRIO: SEU PERFIL REAL ESTÁ ALINHADO COM SEU PLANO ESTRATÉGICO.",
    estilo: "border-cyan-500/20 text-cyan-400",
  } as { texto: string; estilo: string };

  if (perfilRealRank > perfilAlvoRank) {
    alertaTaticoConfig.texto =
      "⚠️ EXPOSIÇÃO ALTA: SEU PERFIL REAL ESTÁ MAIS AGRESSIVO DO QUE O PLANEJADO. PRIORIZE SEUS PRÓXIMOS APORTES EM RENDA FIXA para reequilibrar o sistema.";
    alertaTaticoConfig.estilo = "border-red-600/20 text-red-500";
  } else if (perfilRealRank < perfilAlvoRank) {
    alertaTaticoConfig.texto =
      "⚠️ CALIBRAÇÃO DE RISCO: CARTEIRA MUITO DEFENSIVA PARA O SEU ALVO. CONSIDERE APORTAR EM AÇÕES BRASIL OU CRIPTOMOEDAS.";
    alertaTaticoConfig.estilo = "border-cyan-500/20 text-cyan-400";
  }

  // Identifica se o período selecionado no Drawer já tem um plano ativo para disparar o Alerta Vermelho
  const jaPossuiMetaDessePeriodo = metas.some(m => m.periodo === periodoMeta);

  // Formatações reativas dos inputs de aportes
  const precoNum = parseFloat(precoUnitario.replace(",", ".")) || 0;
  const qtdNum = parseFloat(quantidade.replace(",", ".")) || 0;
  const valorTotalCalculado = precoNum * qtdNum;

  // Validações
  const isFormValid = ticker.trim() !== "" && precoNum > 0 && qtdNum > 0;
  const isMetaFormValid = periodoMeta !== null && valorAlvo.trim() !== "" && parseFloat(valorAlvo.replace(",", ".")) > 0;

  // CONFIRMAR APORTE
  const handleConfirmarAporte = async () => {
    if (!isFormValid) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("investimentos")
        .insert([{
          user_id: user?.id || null,
          ticker: ticker.toUpperCase().trim(),
          preco_unitario: precoNum,
          quantidade: qtdNum,
          categoria: categoria
        }])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setInvestimentos([data[0], ...investimentos]);
        handleCloseDrawer();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CONFIRMAR OU RESETAR META INDEPENDENTE POR CICLO
  const handleConfirmarMeta = async () => {
    if (!isMetaFormValid || !periodoMeta) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const agora = new Date();
      let dataVencimento = new Date();

      if (periodoMeta === "SEMANA") {
        dataVencimento.setDate(agora.getDate() + 7);
      } else if (periodoMeta === "MÊS") {
        dataVencimento.setMonth(agora.getMonth() + 1);
      } else if (periodoMeta === "ANO") {
        dataVencimento.setFullYear(agora.getFullYear() + 1);
      }

      // Desativa e reseta unicamente a meta antiga do período correspondente
      await supabase
        .from("metas")
        .update({ status: "EXPIRADA" })
        .eq("status", "ATIVA")
        .eq("periodo", periodoMeta);

      const { error } = await supabase
        .from("metas")
        .insert([{
          user_id: user?.id || null,
          periodo: periodoMeta,
          valor_alvo: parseFloat(valorAlvo.replace(",", ".")),
          qtd_aportes_alvo: qtdAportesMeta ? parseInt(qtdAportesMeta) : null,
          valor_minimo_configurado: valorMinimoAporte ? parseFloat(valorMinimoAporte.replace(",", ".")) : null,
          status: "ATIVA",
          vencimento: dataVencimento.toISOString()
        }]);

      if (error) throw error;
      
      await carregarDados();
      handleCloseMetaDrawer();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTicker("");
    setPrecoUnitario("");
    setQuantidade("");
  };

  const handleCloseMetaDrawer = () => {
    setIsMetaDrawerOpen(false);
    setPeriodoMeta(null);
    setValorAlvo("");
    setQtdAportesMeta("");
    setValorMinimoAporte("");
  };

  const handleOpenPerfilDrawer = () => {
    setPerfilSelecionado(perfilAlvo);
    setIsPerfilDrawerOpen(true);
  };

  const handleClosePerfilDrawer = () => {
    setIsPerfilDrawerOpen(false);
    setPerfilSelecionado(perfilAlvo);
  };

  const handleConfirmarPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { error } = await supabase
        .from("perfis_usuarios")
        .upsert(
          [{ user_id: user.id, perfil_alvo: perfilSelecionado }],
          { onConflict: "user_id" }
        );

      if (error) throw error;
      setPerfilAlvo(perfilSelecionado);
      handleClosePerfilDrawer();
    } catch (err) {
      console.error("Erro ao salvar perfil de usuário:", err);
    }
  };

  // ==========================================
  // FUNÇÃO RENDERIZADORA DOS CARDS INDIVIDUAIS DO CARROSSEL
  // ==========================================
  const renderCardMetaPorPeriodo = (p: "SEMANA" | "MÊS" | "ANO") => {
    const metaDaVez = metas.find(m => m.periodo === p);

    if (!metaDaVez) {
      return (
        <div className="w-full shrink-0 px-1">
          <div className="bg-[#050505] p-6 rounded-[2.5rem] border border-dashed border-white/10 text-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Target className="text-zinc-700" size={20} />
              <p className="text-[10px] font-black tracking-widest text-zinc-500">[ SEM ALVO PARA {p} ]</p>
              <p className="text-[8px] text-zinc-600 font-bold max-w-[200px] leading-tight">
                DESLIZE OU ABRA O MENU SUPERIOR PARA REGISTRAR DIRECIONAMENTOS TÁTICOS NESTE CICLO.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const aportesNoPeriodo = investimentos.filter(inv => {
      const dataInv = new Date(inv.created_at);
      const dataInicioMeta = new Date(metaDaVez.created_at);
      const dataFimMeta = new Date(metaDaVez.vencimento);
      return dataInv >= dataInicioMeta && dataInv <= dataFimMeta;
    });

    const totalAportadoMeta = aportesNoPeriodo.reduce((acc, inv) => {
      const aporte = (typeof inv.valor_total === 'number' && inv.valor_total > 0)
        ? inv.valor_total
        : ((inv.preco_unitario || 0) * (inv.quantidade || 0));
      return acc + aporte;
    }, 0);
    const qtdAportesRealizados = aportesNoPeriodo.length;
    const progressoDinheiroPct = Math.min((totalAportadoMeta / metaDaVez.valor_alvo) * 100, 100);
    const isMetaConcluida = totalAportadoMeta >= metaDaVez.valor_alvo;

    let stringContadorAportes = "";
    let stringSugestaoAporte = "";
    let metaEstouradaPorFrequencia = false;

    if (metaDaVez.qtd_aportes_alvo) {
      const alvoQtd = metaDaVez.qtd_aportes_alvo;
      if (qtdAportesRealizados > alvoQtd && totalAportadoMeta < metaDaVez.valor_alvo) {
        metaEstouradaPorFrequencia = true;
        stringContadorAportes = "APORTES NÃO BATIDOS";
        stringSugestaoAporte = "ALVO INCOMPLETO (FAÇA APORTES EXTRAS)";
      } else {
        stringContadorAportes = `APORTES: ${qtdAportesRealizados} DE ${alvoQtd} REALIZADOS`;
        const tirosRestantes = alvoQtd - qtdAportesRealizados;
        const dinheiroRestante = Math.max(metaDaVez.valor_alvo - totalAportadoMeta, 0);

        if (dinheiroRestante === 0) {
          stringSugestaoAporte = "ALVO ALCANÇADO!";
        } else if (tirosRestantes <= 0) {
          stringSugestaoAporte = "FORA DO RITMO. COLOQUE VALORES EXTRAS";
        } else {
          const sugestaoItem = dinheiroRestante / tirosRestantes;
          stringSugestaoAporte = `SUGESTÃO: R$ ${sugestaoItem.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / APORTE`;
        }
      }
    } else {
      stringContadorAportes = `APORTADO: R$ ${totalAportadoMeta.toLocaleString("pt-BR")}`;
      const faltante = Math.max(metaDaVez.valor_alvo - totalAportadoMeta, 0);
      stringSugestaoAporte = faltante > 0 ? `RESTAM R$ ${faltante.toLocaleString("pt-BR")}` : "META CONCLUÍDA!";
    }

    return (
      <div className="w-full shrink-0 px-1">
        <div className="bg-[#050505] p-6 rounded-[3rem] relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className={isMetaConcluida ? "text-green-400" : "text-yellow-500"} size={14} />
                <span className="text-[9px] font-black text-zinc-500 tracking-widest">
                  {isMetaConcluida ? "OBJETIVO COMPLETO" : `ALVO DO ${metaDaVez.periodo}`}
                </span>
              </div>
              <h3 className="text-4xl font-black italic">
                {Math.round(progressoDinheiroPct)} 
                <span className={`text-sm italic ml-1 ${isMetaConcluida ? 'text-green-400' : 'text-zinc-500'}`}>% ALVO</span>
              </h3>
            </div>
            <div className={`px-3 py-1 rounded-full ${isMetaConcluida ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <span className={`text-[8px] font-black ${isMetaConcluida ? 'text-green-400' : 'text-yellow-500'}`}>
                {isMetaConcluida ? "[ CONQUISTADO ]" : `META: R$ ${metaDaVez.valor_alvo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
              </span>
            </div>
          </div>

          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isMetaConcluida ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_10px_#eab308]'}`}
              style={{ width: `${progressoDinheiroPct}%` }}
            />
          </div>

          <div className="flex justify-between items-center mt-3">
            <p className={`text-[8px] font-bold tracking-wider ${metaEstouradaPorFrequencia ? 'text-red-500 font-black' : 'text-zinc-500'}`}>
              {stringContadorAportes}
            </p>
            <p className={`text-[8px] font-bold tracking-wider ${metaEstouradaPorFrequencia ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {stringSugestaoAporte}
            </p>
          </div>
          <p className="text-[7px] text-zinc-600 mt-2 font-bold">
            EXPIRAÇÃO DA ESTRATÉGIA: {new Date(metaDaVez.vencimento).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter min-h-screen pb-24 relative overflow-x-hidden">
      <div className="max-w-md mx-auto px-4 pt-8">
        
        {/* HEADER DINÂMICO */}
        <header className="flex justify-between items-end border-b border-white/10 pb-6 mb-8">
          <div>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mb-2">PORTFÓLIO TOTAL</p>
            <h1 className="text-5xl font-black italic text-white leading-none">
              {loading ? (
                <span className="text-2xl text-zinc-700 animate-pulse">CARREGANDO...</span>
              ) : (
                `R$ ${patrimonioTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              )}
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-cyan-400 text-xs font-black">+R$ 2.410</span>
            <span className="text-[8px] text-zinc-600 font-bold">ESTE MÊS</span>
          </div>
        </header>

        <div className="flex flex-col gap-6">

          {/* DUPLA DE BOTÕES DE AÇÃO */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsMetaDrawerOpen(true)}
              className="bg-[#050505] hover:bg-zinc-950 active:scale-[0.99] transition-all py-5 rounded-3xl border border-white/5 flex items-center justify-center gap-2.5 group"
            >
              <Sliders className="text-zinc-500 group-hover:text-cyan-400 transition-colors" size={14} />
              <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">
                [ METAS ]
              </span>
            </button>

            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-[#050505] hover:bg-zinc-950 active:scale-[0.99] transition-all py-5 rounded-3xl border border-dashed border-white/10 flex items-center justify-center gap-2 group"
            >
              <Plus className="text-zinc-500 group-hover:text-yellow-400 group-hover:rotate-90 transition-transform duration-300" size={14} />
              <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">
                [ REGISTRAR ]
              </span>
            </button>
          </div>

          {/* SELETOR DE ABAS DO CARROSSEL (VEICULAÇÃO DE FOCO) */}
          <div className="flex justify-center gap-4 mt-2">
            {periodosOrdem.map((p, index) => (
              <button
                key={p}
                onClick={() => setIndiceCarrossel(index)}
                className={`text-[9px] font-black tracking-widest transition-all ${
                  indiceCarrossel === index ? "text-yellow-400 scale-110" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* ÁREA DO CARROSSEL DESLIZANTE GESTUAL */}
          {loading ? (
            <div className="h-28 bg-[#050505] rounded-[3rem] animate-pulse border border-white/5" />
          ) : (
            <div className="w-full overflow-hidden">
              <motion.div
                className="flex w-full"
                animate={{ x: `-${indiceCarrossel * 100}%` }}
                transition={{ type: "spring", damping: 30, stiffness: 250 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -40 && indiceCarrossel < 2) {
                    setIndiceCarrossel(indiceCarrossel + 1);
                  } else if (info.offset.x > 40 && indiceCarrossel > 0) {
                    setIndiceCarrossel(indiceCarrossel - 1);
                  }
                }}
              >
                {renderCardMetaPorPeriodo("SEMANA")}
                {renderCardMetaPorPeriodo("MÊS")}
                {renderCardMetaPorPeriodo("ANO")}
              </motion.div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mt-6 lg:gap-6 lg:grid-cols-3">
            {/* COLUNA ESQUERDA - CONTEÚDO PRINCIPAL (Desktop: col-span-2) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Grid de Categorias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoriasOrdenadas.map((cat, index) => (
                  <div
                    key={cat.categoria}
                    className={`bg-[#050505] rounded-[2.5rem] border border-white/10 p-4 ${
                      index === 0 ? "text-cyan-400" : "text-fuchsia-400"
                    }`}
                  >
                    <p className="text-[8px] font-black tracking-[0.4em]">{cat.label}</p>
                    <p className="text-3xl font-black tracking-tight mt-3">{Math.round(cat.percentual)}%</p>
                  </div>
                ))}
              </div>

              {/* Card Principais Ativos */}
              <div className="bg-[#050505] rounded-[3rem] p-5 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[8px] text-zinc-500 font-black tracking-[0.4em]">PRINCIPAIS ATIVOS</p>
                  <span className="text-[8px] text-zinc-400">{topAtivos.length} ITEMS</span>
                </div>
                <div className="space-y-4">
                  {topAtivos.map((ativo) => {
                    const statusLabel = ativo.variation >= 0 ? `▲ ${ativo.variation.toFixed(1)}%` : `▼ ${Math.abs(ativo.variation).toFixed(1)}%`;
                    const categoryLabel =
                      ativo.categoria === "AÇÕES BRASIL"
                        ? "VARIÁVEL"
                        : ativo.categoria === "INTERNACIONAL"
                        ? "OFFSHORE"
                        : ativo.categoria === "CRIPTOMOEDAS"
                        ? "CRIPTOMO"
                        : ativo.categoria;

                    return (
                      <div key={ativo.ticker} className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-sm font-black">{ativo.ticker}</p>
                          <p className="text-[7px] whitespace-nowrap text-zinc-500 uppercase tracking-[0.4em] mt-1">{categoryLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black">R$ {ativo.valor_total.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                          <p className={`text-[8px] font-black mt-1 ${ativo.variation >= 0 ? "text-emerald-400" : "text-red-500"}`}>
                            {statusLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - SIDEBAR TÁTICA (Desktop: col-span-1) */}
            <div className="space-y-4">
              {/* Grid Perfil + Liberdade (empilhado em desktop) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="bg-[#050505] rounded-[3rem] p-5 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-black tracking-[0.4em]">PERFIL DE EXPOSIÇÃO</p>
                      <p className="text-[9px] text-zinc-400 font-black tracking-[0.3em] mt-1">TERMÔMETRO DE RISCO</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenPerfilDrawer}
                      className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                      <Settings size={16} className="text-zinc-400" />
                    </button>
                  </div>
                  <div className="relative overflow-hidden">
                    <div className="flex justify-center">
                      <svg viewBox="0 0 220 110" className="w-full max-w-[220px]">
                        <path
                          d="M20 100 A90 90 0 0 1 200 100"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M20 100 A90 90 0 0 1 200 100"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="283"
                          strokeDashoffset={Math.max(0, 283 - (scoreGlobal / 3) * 283)}
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-x-0 top-[40%] flex flex-col items-center">
                      <span className="text-[9px] text-zinc-500 font-black tracking-widest mb-1">PERFIL REAL</span>
                      <span className="text-4xl font-black tracking-tight">{perfilReal}</span>
                      <span className="text-[10px] text-cyan-400 font-black tracking-[0.3em] mt-1">{scoreGlobal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[8px] text-zinc-500">
                    <div className="space-y-1">
                      <p className="font-black tracking-widest">SCORE GLOBAL</p>
                      <p className="text-white">{scoreGlobal.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-black tracking-widest">PERFIL ALVO</p>
                      <p className="text-yellow-400">{perfilAlvo}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#050505] rounded-[3rem] p-5 border border-white/10">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-black tracking-[0.4em]">LIBERDADE FINANCEIRA</p>
                      <h2 className="text-4xl font-black tracking-tight">{anosParaLiberdade} ANOS</h2>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-3">
                    <div
                      className="h-full bg-yellow-400 shadow-[0_0_10px_#eab308]"
                      style={{ width: `${progressoLiberdadePct}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    <span>{Math.round(progressoLiberdadePct)}% ALVO</span>
                    <span className="text-right">DATA ESTIMADA: {dataEstimativaTexto}</span>
                  </div>
                </div>
              </div>

              {/* Card Sugestão Tática */}
              <div className="bg-[#050505] rounded-[3rem] p-5 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-[8px] text-zinc-500 font-black tracking-[0.4em]">SUGESTÃO TÁTICA</p>
                    <p className="text-[10px] font-black">CONSULTOR AUTOMÁTICO</p>
                  </div>
                  <ArrowUpRight size={18} className="text-zinc-300" />
                </div>
                <div className={`rounded-3xl border px-3 py-3 text-[9px] font-black ${alertaTaticoConfig.estilo} border-white/10`}>
                  {alertaTaticoConfig.texto}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER INTERATIVO PARA CONFIGURAÇÃO DE METAS */}
      <AnimatePresence>
        {isMetaDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseMetaDrawer}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a0a0c] border-t border-white/10 rounded-t-[2.5rem] z-50 px-6 pt-5 pb-10"
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Sliders className="text-cyan-400" size={16} />
                  <h2 className="text-sm font-black tracking-widest italic">REGISTRAR META</h2>
                </div>
                <button 
                  onClick={handleCloseMetaDrawer}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X size={14} className="text-zinc-400 hover:text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">SELECIONE O PERÍODO</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["SEMANA", "MÊS", "ANO"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriodoMeta(p)}
                        className={`py-3 rounded-xl text-[9px] font-black tracking-widest border transition-all ${
                          periodoMeta === p
                            ? "bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                            : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        [ {p} ]
                      </button>
                    ))}
                  </div>
                </div>

                {/* ALERTA CRÍTICO ATIVADO NA COR VERMELHA */}
                <AnimatePresence>
                  {jaPossuiMetaDessePeriodo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-950/20 border border-red-900/50 rounded-xl p-3 text-center"
                    >
                      <p className="text-[8px] font-black text-red-500 tracking-wider">
                        ⚠️ ATENÇÃO: VOCÊ JÁ POSSUI UMA META ATIVA PARA O CICLO {periodoMeta}. AO CONFIRMAR, O PROGRESSO ANTERIOR SERÁ RESETADO.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">VALOR A SER BATIDO (R$)</label>
                  <input 
                    type="text" 
                    value={valorAlvo}
                    onChange={(e) => setValorAlvo(e.target.value)}
                    placeholder="0,00" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black italic text-white focus:outline-none focus:border-white/20 placeholder:text-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">QUANTOS APORTES A SER BATIDO (OPCIONAL)</label>
                  <input 
                    type="text" 
                    value={qtdAportesMeta}
                    onChange={(e) => setQtdAportesMeta(e.target.value)}
                    placeholder="EX: 4" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black italic text-white focus:outline-none focus:border-white/20 placeholder:text-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">VALOR MÍNIMO DO APORTE (R$) (OPCIONAL)</label>
                  <input 
                    type="text" 
                    value={valorMinimoAporte}
                    onChange={(e) => setValorMinimoAporte(e.target.value)}
                    placeholder="0,00" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black italic text-white focus:outline-none focus:border-white/20 placeholder:text-zinc-700 transition-colors"
                  />
                </div>

                <button 
                  disabled={!isMetaFormValid}
                  onClick={handleConfirmarMeta}
                  className={`w-full text-[10px] font-black tracking-[0.2em] py-4 rounded-2xl mt-4 transition-all ${
                    isMetaFormValid 
                      ? jaPossuiMetaDessePeriodo 
                        ? "bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]" 
                        : "bg-yellow-400 text-black hover:bg-yellow-300 active:scale-[0.98]" 
                      : "bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {isMetaFormValid 
                    ? jaPossuiMetaDessePeriodo 
                      ? `[ RESTARTAR CICLO DA ${periodoMeta} ]` 
                      : "[ FIXAR NOVOS ALVOS ]" 
                    : "[ PREENCHA OS CAMPOS OBRIGATÓRIOS ]"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER DE PERFIL DE RISCO */}
      <AnimatePresence>
        {isPerfilDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePerfilDrawer}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a0a0c] border-t border-white/10 rounded-t-[2.5rem] z-50 px-6 pt-5 pb-10"
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="text-cyan-400" size={16} />
                  <h2 className="text-sm font-black tracking-widest italic">AJUSTAR PERFIL PLANEJADO</h2>
                </div>
                <button
                  onClick={handleClosePerfilDrawer}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X size={14} className="text-zinc-400 hover:text-white" />
                </button>
              </div>

              <div className="space-y-4">
                {(["CONSERVADOR", "MODERADO", "ARROJADO"] as const).map((perfil) => (
                  <button
                    key={perfil}
                    type="button"
                    onClick={() => setPerfilSelecionado(perfil)}
                    className={`w-full rounded-2xl py-4 text-[10px] font-black tracking-[0.2em] uppercase transition-all ${
                      perfilSelecionado === perfil
                        ? "bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.25)]"
                        : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    [ {perfil} ]
                  </button>
                ))}

                <button
                  onClick={handleConfirmarPerfil}
                  className="w-full bg-cyan-400 text-black text-[10px] font-black tracking-[0.2em] py-4 rounded-2xl transition-all hover:bg-cyan-300 active:scale-[0.98]"
                >
                  [ SALVAR PERFIL PLANEJADO ]
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DRAWER DE APORTES */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a0a0c] border-t border-white/10 rounded-t-[2.5rem] z-50 px-6 pt-5 pb-10"
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <PlusCircle className="text-yellow-400" size={16} />
                  <h2 className="text-sm font-black tracking-widest italic">NOVO LOG DE OPERAÇÃO</h2>
                </div>
                <button 
                  onClick={handleCloseDrawer}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                >
                  <X size={14} className="text-zinc-400 hover:text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">TICKER / CÓDIGO DO ATIVO</label>
                  <input 
                    type="text" 
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="EX: PETR4, BTC, IVVB11" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black italic text-white focus:outline-none focus:border-white/20 placeholder:text-zinc-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">CLASSE DO ATIVO</label>
                  <select 
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black text-white focus:outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="RENDA FIXA">RENDA FIXA</option>
                    <option value="AÇÕES BRASIL">AÇÕES BRASIL</option>
                    <option value="FII">FUNDOS IMOBILIÁRIOS (FII)</option>
                    <option value="INTERNACIONAL">INTERNACIONAL</option>
                    <option value="CRIPTOMOEDAS">CRIPTOMOEDAS</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">PREÇO UNITÁRIO (R$)</label>
                    <input 
                      type="text" 
                      value={precoUnitario}
                      onChange={(e) => setPrecoUnitario(e.target.value)}
                      placeholder="0,00" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black italic text-white focus:outline-none focus:border-white/20 placeholder:text-zinc-700 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 tracking-wider block mb-2">QUANTIDADE</label>
                    <input 
                      type="text" 
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      placeholder="0.00" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-black italic text-white focus:outline-none focus:border-white/20 placeholder:text-zinc-700 transition-colors"
                    />
                  </div>
                </div>

                <button 
                  disabled={!isFormValid}
                  onClick={handleConfirmarAporte}
                  className={`w-full text-[10px] font-black tracking-[0.2em] py-4 rounded-2xl mt-4 transition-all ${
                    isFormValid 
                      ? "bg-yellow-400 text-black hover:bg-yellow-300 active:scale-[0.98]" 
                      : "bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {isFormValid 
                    ? `[ CONFIRMAR APORTE - R$ ${valorTotalCalculado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ]` 
                    : "[ PREENCHA OS CAMPOS ]"
                  }
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

