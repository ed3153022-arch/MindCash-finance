"use client";

import React, { useEffect, useState, useMemo, useRef } from "react"; 
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, Flame, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging, CheckCircle2, CalendarDays, Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENTE DO CARD DE CICLOS (DINÂMICO COM ALTURA AJUSTÁVEL) ---
function CardCiclosOperacionais() {
  const [selectedCycle, setSelectedCycle] = useState(2); 
  const [sentencaIA, setSentencaIA] = useState("");
  const [isLoadingIA, setIsLoadingIA] = useState(false);
  const [cyclesData, setCyclesData] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [vereditosCache, setVereditosCache] = useState<Record<string, string>>({});

  const contentRef = useRef<HTMLDivElement>(null);
  const [alturaDinamica, setAlturaDinamica] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setAlturaDinamica(contentRef.current.offsetHeight);
    }
  }, [sentencaIA, selectedCycle, loadingDados]);

  useEffect(() => {
    const carregarDadosReais = async () => {
      setLoadingDados(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [resTransacoes, resFixos, resLimites] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
          supabase.from("fixed_expenses").select("*").eq("user_id", user.id),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const lista = resTransacoes.data || [];
        const listaFixos = resFixos.data || [];
        const limites = resLimites.data || [];

        const dataPrimeiraTransacao = lista.length > 0 ? new Date(lista[0].created_at) : new Date();
        const hoje = new Date();
        const mesAtualIdx = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        const saldoGeralAtual = lista.reduce((acc, t) => 
          t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0
        );

        const mesPassadoIdx = mesAtualIdx - 1 < 0 ? 11 : mesAtualIdx - 1;
        const anoPassadoRef = mesAtualIdx - 1 < 0 ? anoAtual - 1 : anoAtual;
        
        const fluxoLiquidoP2 = lista
          .filter(t => new Date(t.created_at).getMonth() === mesPassadoIdx && new Date(t.created_at).getFullYear() === anoPassadoRef)
          .reduce((acc, t) => t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0);

        const nomesMeses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

        const novosCiclos = [-2, -1, 0, 1, 2].map((offset) => {
          const dataRef = new Date(anoAtual, mesAtualIdx + offset, 1);
          const label = nomesMeses[dataRef.getMonth()];
          const anoRef = dataRef.getFullYear();
          const mesRef = dataRef.getMonth();
          const tipo = offset < 0 ? "PASSADO" : offset === 0 ? "ATUAL" : "FUTURO";

          const fimDesteMes = new Date(anoRef, mesRef + 1, 0, 23, 59, 59);
          const contaExistiaNoMes = fimDesteMes >= dataPrimeiraTransacao;

          let saldoCalculado = 0;
          let poderCalculado = 0;
          let performanceCalculada = 0;
          let scoreFinal = 0;

          if (contaExistiaNoMes) {
            if (tipo === "ATUAL") {
              saldoCalculado = saldoGeralAtual;
              poderCalculado = lista.filter(t => t.type === "entrada" && t.category?.startsWith("OBJ:") && new Date(t.created_at).getMonth() === mesAtualIdx && new Date(t.created_at).getFullYear() === anoAtual).reduce((acc, t) => acc + Number(t.amount), 0);
            } else if (tipo === "PASSADO") {
              saldoCalculado = lista.filter(t => new Date(t.created_at) <= fimDesteMes).reduce((acc, t) => t.type === "entrada" ? acc + Number(t.amount) : acc - Number(t.amount), 0);
              poderCalculado = lista.filter(t => t.type === "entrada" && t.category?.startsWith("OBJ:") && new Date(t.created_at).getMonth() === mesRef && new Date(t.created_at).getFullYear() === anoRef).reduce((acc, t) => acc + Number(t.amount), 0);
            } else {
              if (offset === 1) {
                const gastosFixosF1 = listaFixos.filter(f => Number(f.month) === (mesRef + 1) && Number(f.year) === anoRef).reduce((acc, f) => acc + Number(f.amount), 0);
                saldoCalculado = saldoGeralAtual + fluxoLiquidoP2 - gastosFixosF1;
              } else if (offset === 2) {
                const mesF1Idx = mesAtualIdx + 1 > 11 ? (mesAtualIdx + 1) - 12 : mesAtualIdx + 1;
                const anoF1Ref = mesAtualIdx + 1 > 11 ? anoAtual + 1 : anoAtual;
                const gastosFixosF1 = listaFixos.filter(f => Number(f.month) === (mesF1Idx + 1) && Number(f.year) === anoF1Ref).reduce((acc, f) => acc + Number(f.amount), 0);
                const saldoProjetadoF1 = saldoGeralAtual + fluxoLiquidoP2 - gastosFixosF1;
                const gastosFixosF2 = listaFixos.filter(f => Number(f.month) === (mesRef + 1) && Number(f.year) === anoRef).reduce((acc, f) => acc + Number(f.amount), 0);
                saldoCalculado = saldoProjetadoF1 + fluxoLiquidoP2 - gastosFixosF2;
              }
            }

            if (tipo === "FUTURO") {
              performanceCalculada = 100;
              scoreFinal = saldoCalculado > 0 ? 90 : 40;
            } else {
              const transAteData = lista.filter(t => new Date(t.created_at) <= fimDesteMes);
              const entradas = transAteData.filter(t => t.type === "entrada");
              const saídas = transAteData.filter(t => t.type !== "entrada");
              const totalEntradas = entradas.reduce((acc, t) => acc + Number(t.amount), 0);
              const totalSaidas = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
              const taxaRetencao = totalEntradas > 0 ? Math.max(0, ((totalEntradas - totalSaidas) / totalEntradas) * 100) : 0;

              const metrics = {
                consistencia: Math.min(100, (new Set(transAteData.map(t => new Date(t.created_at).toDateString())).size / 15) * 100),
                precisao: Math.min(100, (transAteData.filter(t => t.category && t.category !== "Outros").length / (transAteData.length || 1)) * 100),
                previsao: limites.length > 0 ? Math.max(0, 100 - (limites.filter(lim => saídas.filter(t => t.category === lim.category).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) > lim.limit_amount).length * 20)) : Math.min(100, taxaRetencao),
                disciplina: Math.min(100, taxaRetencao),
                evolucao: Math.min(100, taxaRetencao),
                engajamento: Math.min(100, (transAteData.length / 10) * 100)
              };

              performanceCalculada = Object.values(metrics).reduce((a, b) => a + b, 0) / 6;
              const financialHealth = (taxaRetencao * 0.7) + (Math.min(100, (saldoCalculado / 5000) * 100) * 0.3);
              scoreFinal = (financialHealth * 0.7) + (performanceCalculada * 0.3);
            }
          }

          let diag = { label: "CRÍTICO", color: "text-red-500" };
          if (scoreFinal >= 85) diag = { label: "IMPLACÁVEL", color: "text-cyan-400" };
          else if (scoreFinal >= 65) diag = { label: "DOMINANTE", color: "text-green-400" };
          else if (scoreFinal >= 45) diag = { label: "ESTÁVEL", color: "text-yellow-400" };

          return {
            label, ano: anoRef, tipo, ativo: contaExistiaNoMes,
            saldo: saldoCalculado, poder: poderCalculado,
            performance: performanceCalculada,
            diagnostico: diag,
            status: !contaExistiaNoMes ? "INATIVO" : tipo === "PASSADO" ? "CONCLUÍDO" : tipo === "ATUAL" ? "EM CURSO" : "PROJEÇÃO"
          };
        });

        setCyclesData(novosCiclos);
      } catch (error) {
        console.error("Erro na integração:", error);
      } finally {
        setLoadingDados(false);
      }
    };
    carregarDadosReais();
  }, []);

  const activeCycle = cyclesData[selectedCycle];
  const maxSaldo = useMemo(() => Math.max(...cyclesData.map(c => c.saldo), 1), [cyclesData]);

  useEffect(() => {
    if (!activeCycle || loadingDados || !activeCycle.ativo) return;
    const periodoChave = `${activeCycle.label}-${activeCycle.ano}`;
    if (vereditosCache[periodoChave]) {
      setSentencaIA(vereditosCache[periodoChave]);
      setIsLoadingIA(false);
      return;
    }
    const fetchVeredito = async () => {
      setIsLoadingIA(true); 
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const res = await fetch('/api/veredito-ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            saldo: activeCycle.saldo, 
            poder: activeCycle.poder, 
            status: activeCycle.diagnostico.label, 
            tipo: activeCycle.tipo, 
            periodo: periodoChave,
            user_id: user.id 
          }),
        });
        const data = await res.json();
        setVereditosCache(prev => ({ ...prev, [periodoChave]: data.text }));
        setSentencaIA(data.text);
      } catch (error) {
        console.error("Erro:", error);
        setSentencaIA("Veredito em processamento...");
      } finally {
        setIsLoadingIA(false);
      }
    };
    fetchVeredito();
  }, [selectedCycle, activeCycle, loadingDados]);

  if (loadingDados || !activeCycle) {
    return <div className="p-10 text-center animate-pulse text-zinc-500 uppercase text-[10px]">Sincronizando Ciclos...</div>;
  }

  return (
    <section 
      className="bg-[#050505] flex items-center justify-center rounded-[2.5rem] border border-white/5 overflow-hidden text-white uppercase tracking-tighter transition-all duration-500 ease-in-out"
      style={{ minHeight: alturaDinamica > 0 ? `${alturaDinamica + 48}px` : "auto" }}
    >
      <div ref={contentRef} className="w-[87%] flex flex-col py-8">
        <div className="flex items-center gap-2 mb-8 text-zinc-600">
          <CalendarDays size={14} />
          <span className="text-[9px] font-black tracking-[0.2em]">Cronograma de Ciclos</span>
        </div>

        <div className="flex justify-between items-end h-32 mb-10 px-2 border-b border-white/5 pb-4">
          {cyclesData.map((cycle, idx) => {
            const barHeight = cycle.ativo ? Math.max(15, (cycle.saldo / maxSaldo) * 100) : 0;
            return (
              <button key={idx} onClick={() => cycle.ativo && setSelectedCycle(idx)} disabled={!cycle.ativo} className={`flex flex-col items-center gap-3 outline-none flex-1 group ${!cycle.ativo && "opacity-20 cursor-not-allowed"}`}>
                <div className="relative w-full flex justify-center items-end h-24">
                  <motion.div initial={false} animate={{ height: `${barHeight}%` }} className={`w-8 rounded-t-sm transition-all duration-300 ${cycle.tipo === "FUTURO" ? "bg-zinc-800" : "bg-yellow-500"} ${selectedCycle === idx ? "opacity-100 shadow-[0_0_15_rgba(250,204,21,0.4)] scale-x-110" : "opacity-20"}`} />
                </div>
                <span className={`text-[8px] font-black ${selectedCycle === idx ? "text-white" : "text-zinc-700"}`}>{cycle.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selectedCycle} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3, ease: "easeOut" }} className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-1">Saldo do Período</p>
                <h4 className="text-4xl font-black italic tracking-tighter leading-none">R$ {activeCycle.saldo.toLocaleString('pt-BR')}</h4>
              </div>
              <div className="text-right flex flex-col gap-1">
                <div>
                  <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-0.5">Diagnóstico</p>
                  <p className={`text-[12px] font-black italic leading-none ${activeCycle.diagnostico.color}`}>
                    {activeCycle.diagnostico.label}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-[8px] font-black text-zinc-500 tracking-widest mb-0.5">Status</p>
                  <span className={`text-[10px] font-black italic uppercase leading-none ${activeCycle.tipo === "PASSADO" ? "text-green-400" : "text-yellow-500"}`}>
                    {activeCycle.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2 flex items-center gap-1">Poder Total <Info size={8} /></p>
                <p className="text-lg font-black italic leading-none">R$ {activeCycle.poder.toLocaleString('pt-BR')}</p>
                <p className="text-[5.5px] text-zinc-600 font-bold leading-tight mt-2 italic">Trabalho convertido em riqueza.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-500 mb-2">Performance Radar</p>
                <p className="text-lg font-black italic leading-none">{activeCycle.performance.toFixed(1)}<span className="text-yellow-500 text-[10px]">%</span></p>
                <p className={`text-[5.5px] font-bold leading-tight mt-2 italic ${activeCycle.tipo === "FUTURO" ? "text-cyan-500/70" : "text-zinc-600"}`}>
                  {activeCycle.tipo === "FUTURO" ? "* Alvo operacional definido." : "Eficiência técnica do ciclo."}
                </p>
              </div>
            </div>

            <div className={`p-5 rounded-[2.5rem] border transition-all duration-500 ${isLoadingIA ? "animate-pulse border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : activeCycle.tipo === "FUTURO" ? "bg-zinc-900/40 border-white/5" : "bg-yellow-500/5 border-yellow-500/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit size={12} className={isLoadingIA ? "text-yellow-500" : activeCycle.tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"} />
                <span className={`text-[8px] font-black tracking-widest ${activeCycle.tipo === "FUTURO" ? "text-zinc-500" : "text-yellow-500"}`}>
                  {isLoadingIA ? "Sincronizando..." : "Veredito da Inteligência"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium min-h-[40px]">
                {!activeCycle.ativo ? "Nenhum dado histórico." : isLoadingIA ? "A IA está processando seu novo veredito..." : sentencaIA}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// --- PÁGINA PRINCIPAL (VEREDITO) ---
export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [financialHealth, setFinancialHealth] = useState(0); 
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        const [transRes, limitesRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);
        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        const saídas = rawData.filter(t => t.type?.toLowerCase() === 'withdrawal' || t.type?.toLowerCase() === 'saida' || t.type?.toLowerCase() === 'saída');
        const entradas = rawData.filter(t => t.type?.toLowerCase() === 'deposit' || t.type?.toLowerCase() === 'entrada');
        const totalSaidasHistorico = saídas.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const totalEntradasHistorico = entradas.reduce((acc, t) => acc + Number(t.amount || 0), 0);
        const saldoAtual = totalEntradasHistorico - totalSaidasHistorico;
        const catPoder = ["investimentos", "reserva", "aportes", "poupança", "investimento"];
        const catPrazer = ["lazer", "restaurante", "shopping", "viagem", "ifood", "prazer"];
        const volPoder = rawData.filter(t => catPoder.includes(t.category?.toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const volPrazer = saídas.filter(t => catPrazer.includes(t.category?.toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const divisorSaidas = totalSaidasHistorico || 1;
        const volManutencao = Math.max(0, totalSaidasHistorico - volPoder - volPrazer);
        setPowerAllocation({
          manutencao: Math.round((volManutencao / divisorSaidas) * 100),
          prazer: Math.round((volPrazer / divisorSaidas) * 100),
          poder: Math.round((volPoder / divisorSaidas) * 100)
        });
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(new Date().getDate() - 30);
        const ultimos30Dias = saídas.filter(t => new Date(t.created_at) >= trintaDiasAtras);
        const gastoMensal = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const gastoDiario = gastoMensal / 30;
        const diasRestantes = gastoDiario > 0 ? Math.floor(saldoAtual / gastoDiario) : (saldoAtual > 0 ? 999 : 0);
        setBurnData({ dias: Math.max(0, diasRestantes), percentual: Math.min(100, (diasRestantes / 180) * 100) });
        const taxaRetencao = totalEntradasHistorico > 0 ? Math.max(0, ((totalEntradasHistorico - totalSaidasHistorico) / totalEntradasHistorico) * 100) : (saldoAtual > 0 ? 100 : 0);
        const scoreAutonomia = Math.min(100, (diasRestantes / 120) * 100);
        setFinancialHealth((taxaRetencao * 0.6) + (scoreAutonomia * 0.4));
        const registrosUnicos = new Set(rawData.map(t => new Date(t.created_at).toDateString())).size;
        let previsaoScore = 0;
        if (limites.length > 0) {
          const categoriasComExcesso = limites.filter(lim => {
            const gastoCat = saídas.filter(t => t.category === lim.category).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
            return gastoCat > lim.limit_amount;
          }).length;
          previsaoScore = Math.max(0, 100 - (categoriasComExcesso * 20));
        } else {
          previsaoScore = Math.min(100, Math.round(taxaRetencao * 0.8));
        }
        setMetrics({
          consistencia: Math.min(100, Math.round((registrosUnicos / 15) * 100)),
          precisao: Math.min(100, Math.round((rawData.filter(t => t.category && t.category !== "Outros").length / (rawData.length || 1)) * 100)),
          previsao: previsaoScore, 
          disciplina: Math.min(100, Math.max(0, Math.round(taxaRetencao))),
          evolucao: Math.min(100, Math.max(0, Math.round(taxaRetencao))),
          engajamento: Math.min(100, Math.round((rawData.length / 10) * 100))
        });
      } catch (e) { console.error("Erro:", e); } finally { setLoading(false); }
    }
    fetchVereditoData();
  }, [router]);

  const avgScore = useMemo(() => {
    const hygieneScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
    return (financialHealth * 0.7) + (hygieneScore * 0.3);
  }, [financialHealth, metrics]);

  const status = useMemo(() => {
    if (avgScore >= 85) return { label: "IMPLACÁVEL", color: "text-cyan-400", bg: "bg-cyan-500/10", desc: "Capital blindado. Sua estrutura de retenção é impenetrável." };
    if (avgScore >= 65) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10", desc: "Controle absoluto sobre o fluxo. Patrimônio em expansão." };
    if (avgScore >= 45) return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Zona de segurança. O equilíbrio entre gastos e ganhos está mantido." };
    return { label: "CRÍTICO", color: "text-red-500", bg: "bg-red-500/10", desc: "Vazamento de capital detectado. O sistema requer intervenção imediata." };
  }, [avgScore]);

  // --- LÓGICA DE ALERTA DE VULNERABILIDADE REINTRODUZIDA ---
  const vulnerability = useMemo(() => {
    const metricEntries = Object.entries(metrics);
    const allFull = metricEntries.every(([_, val]) => val >= 90);
    
    if (allFull) return { 
      label: "PERFORMANCE MÁXIMA", 
      msg: "Protocolo Soberano ativo. A sincronia entre fluxo e retenção atingiu o ápice operacional.", 
      isSafe: true 
    };

    const lowest = metricEntries.reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    
    const tips: Record<string, { label: string, msgs: string[] }> = {
      consistencia: { 
        label: "FLUXO IRREGULAR", 
        msgs: [
          "Padrão de registro descontínuo. Você precisa registrar suas movimentações com maior frequência para que o sistema consiga estabilizar sua visão estratégica.",
          "Frequência de dados insuficiente. O hábito de lançar seus gastos diariamente é o que garante a precisão do veredito final sobre o seu capital.",
          "Lacuna operacional detectada. Aumentar a regularidade dos seus registros elimina os espaços vazios que distorcem o seu diagnóstico real."
        ] 
      },
      precisao: { 
        label: "PONTO CEGO", 
        msgs: [
          "Rastro de capital não identificado. Você pode detalhar melhor suas despesas em vez de usar 'Outros', pois o acúmulo de gastos sem nome oculta o destino real do seu dinheiro.",
          "Identidade financeira oculta. Ao categorizar cada transação de forma específica, você permite que o sistema identifique onde sua eficiência está sendo drenada.",
          "Ruído na identificação de gastos. O hábito de nomear corretamente cada saída elimina as sombras que impedem o mapeamento dos seus hábitos de consumo."
        ] 
      },
      previsao: { 
        label: "FALTA DE ALVO", 
        msgs: [
          "Navegação sem coordenadas. Você deve definir limites de gastos por categoria, pois sem alvos claros, sua capacidade de defesa antecipada é anulada.",
          "Falta de parâmetro preditivo. Estabelecer metas mensais permite que o sistema antecipe riscos antes mesmo de você fechar o mês no vermelho.",
          "Projeção operacional estática. O planejamento do seu futuro financeiro só ganha tração quando você estipula exatamente o quanto pretende permitir de saída em cada setor."
        ] 
      },
      disciplina: { 
        label: "CONSUMO ELEVADO", 
        msgs: [
          "Vazamento de capital detectado. O volume de saídas variáveis está alto demais; você pode reduzir gastos supérfluos para recuperar sua segurança operacional.",
          "Taxa de retenção em declínio. Ao controlar melhor o consumo imediato, você fortalece sua blindagem patrimonial e garante que sobre mais capital ao final do ciclo.",
          "Drenagem de recursos identificada. Sua capacidade de segurar dinheiro caiu; reavalie suas saídas para que sua margem de lucro pessoal volte a crescer."
        ] 
      },
      evolucao: { 
        label: "ESTAGNAÇÃO", 
        msgs: [
          "Patrimônio em modo estático. Você pode direcionar mais recursos para ativos e investimentos, pois o baixo volume de aportes interrompe sua escalada de status.",
          "Aceleração de capital interrompida. Sem o hábito de investir estrategicamente, sua dominância financeira permanece paralisada e sem crescimento real.",
          "Falta de expansão patrimonial. O sistema detectou que seu dinheiro não está trabalhando por você; aumente seus aportes para evoluir sua posição atual."
        ] 
      },
      engajamento: { 
        label: "BAIXA VIGILÂNCIA", 
        msgs: [
          "Vigilância em nível crítico. Você deve interagir mais com as ferramentas de análise, pois a falta de acompanhamento reduz a autoridade dos dados processados.",
          "Monitoramento tático insuficiente. O sistema requer sua presença frequente para refinar a inteligência e entregar um diagnóstico em tempo real mais preciso.",
          "Desconexão operacional detectada. Ao acessar e revisar seus dados com constância, você mantém o controle absoluto sobre o motor financeiro da sua conta."
        ] 
      }
    };

    const tip = tips[lowest[0]] || tips.consistencia;
    // Seleciona uma mensagem aleatória das opções disponíveis para a métrica mais baixa
    const randomMsg = tip.msgs[Math.floor(Math.random() * tip.msgs.length)];

    return { 
      label: tip.label, 
      msg: randomMsg, 
      isSafe: false 
    };
  }, [metrics]);
  
  const renderRadar = () => {
    const labels = ["CONSISTÊNCIA", "PRECISÃO", "PREVISÃO", "DISCIPLINA", "EVOLUÇÃO", "ENGAJAMENTO"];
    const pts = [metrics.consistencia, metrics.precisao, metrics.previsao, metrics.disciplina, metrics.evolucao, metrics.engajamento];
    const cx = 100, cy = 100, radius = 70;
    const points = pts.map((val, i) => {
      const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      return `${cx + (val / 100) * radius * Math.cos(a)},${cy + (val / 100) * radius * Math.sin(a)}`;
    }).join(" ");
    return (
      <svg viewBox="0 0 200 200" className="w-full h-80 overflow-visible drop-shadow-[0_0_15px_rgba(250,204,21,0.2)]">
        {[0.2, 0.4, 0.6, 0.8, 1].map((p) => (
          <polygon key={p} points={Array.from({length: 6}).map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            return `${cx + p * radius * Math.cos(a)},${cy + p * radius * Math.sin(a)}`;
          }).join(" ")} fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
        ))}
        <polygon points={points} fill="rgba(250, 204, 21, 0.3)" stroke="#facc15" strokeWidth="2.5" />
        {labels.map((label, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
          return <text key={i} x={cx + (radius + 20) * Math.cos(a)} y={cy + (radius + 20) * Math.sin(a)} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#71717a" className="uppercase tracking-widest">{label}</text>;
        })}
      </svg>
    );
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="text-yellow-400 animate-spin" size={40} /></div>;

  return (
    <div className="bg-black text-white font-sans uppercase tracking-tighter">
      <div className="max-w-md mx-auto bg-black pb-20">
        
        <header className="flex justify-between items-center border-b border-white/10 pb-6 px-4 mb-10">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        <div className="flex flex-col gap-6 px-4">
          
          <section className="bg-[#050505] min-h-[100px] flex items-center justify-center rounded-[2.5rem] border border-white/5">
            <div className="w-[87%] flex flex-col">
              <div className="flex items-center gap-2 mb-5 px-1">
                <Trophy className="text-zinc-600" size={12} />
                <span className="text-[9px] font-black text-zinc-600 tracking-[0.2em]">CONQUISTAS DE PERFORMANCE</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'mur', name: "MURALHA", icon: <Shield size={18}/>, active: metrics.disciplina > 80, color: "text-blue-500" },
                  { id: 'sen', name: "SENTINELA", icon: <ShieldCheck size={18}/>, active: metrics.consistencia > 70 && metrics.precisao > 70, color: "text-cyan-500" },
                  { id: 'sob', name: "SOBERANO", icon: <Crown size={18}/>, active: avgScore > 75, color: "text-orange-500" },
                  { id: 'imp', name: "IMPULSO", icon: <Flame size={18}/>, active: metrics.engajamento > 60 || metrics.evolucao > 70, color: "text-red-500" }
                ].map(s => (
                  <div key={s.id} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-500 ${s.active ? 'border-white/10 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-transparent opacity-10'}`}>
                    <div className={s.active ? s.color : 'text-zinc-800'}>{s.icon}</div>
                    <span className="text-[8px] font-black mt-2 tracking-wider">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`min-h-[140px] flex items-center justify-center rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
            <div className="w-[87%] relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className={status.color} size={20} />
                <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">DIAGNÓSTICO ATIVO</span>
              </div>
              <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
              <p className="text-[11px] text-zinc-400 font-medium normal-case leading-relaxed">{status.desc}</p>
            </div>
            <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
          </section>
        
          <section className="bg-[#111] rounded-[1.5rem] border border-white/5 h-[190px] flex items-center justify-center relative overflow-hidden">
            <div className="w-[87%] flex flex-col items-start">
              <div className="flex items-center gap-2 mb-6">
                <BatteryCharging className="text-zinc-500" size={14} />
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] italic">
                  Distribuição de Poder
                </p>
              </div>
              <div className="w-full flex items-end justify-between gap-4">
                {[
                  { label: "MANUTENÇÃO", val: powerAllocation.manutencao, color: "bg-zinc-800" },
                  { label: "PRAZER", val: powerAllocation.prazer, color: "bg-orange-500/40" },
                  { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500" }
                ].map((b) => (
                  <div key={b.label} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-white/5 rounded-lg relative overflow-hidden flex flex-col justify-end h-[100px] mb-2">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${b.val}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`w-full ${b.color} shadow-[0_4px_10px_rgba(0,0,0,0.3)]`} 
                      />
                    </div>
                    <p className="text-[10px] font-black italic text-white leading-none">{b.val}%</p>
                    <p className="text-[7px] text-zinc-500 font-black uppercase mt-1 tracking-tighter">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
      
          {/* CARD: AUTONOMIA */}
          <section className="bg-[#050505] min-h-[114px] flex items-center justify-center rounded-[3rem] border border-white/5 relative overflow-hidden">
            <div className="w-[87%] flex flex-col py-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hourglass className="text-yellow-500" size={14} />
                    <span className="text-[9px] font-black text-zinc-500 tracking-widest">AUTONOMIA</span>
                  </div>
                  <h3 className="text-3xl font-black italic">
                    {burnData.dias > 365 ? "+365" : burnData.dias} <span className="text-zinc-500 text-sm">DIAS</span>
                  </h3>
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${burnData.dias > 60 ? 'bg-cyan-500' : 'bg-red-500'}`} style={{ width: `${burnData.percentual}%` }} />
              </div>
            </div>
          </section>

          {/* SEÇÃO UNIFICADA: RADAR + VULNERABILIDADE */}
          <section className="bg-[#050505] min-h-[520px] flex items-center justify-center rounded-[3rem] border border-white/5 transition-all duration-300">
            <div className="w-[87%] flex flex-col py-10 h-full">
              <div className="flex justify-center mb-10">
                {renderRadar()}
              </div>

              <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8 mb-8">
                {Object.entries(metrics).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-[7px] text-zinc-500 font-black mb-1">{key.toUpperCase()}</p>
                    <p className="text-xl font-black italic">{val}<span className="text-yellow-500 text-[10px]">%</span></p>
                  </div>
                ))}
              </div>

              <div className={`w-full border p-6 rounded-[2.5rem] flex items-start gap-5 transition-all duration-500 ${vulnerability.isSafe ? 'bg-cyan-950/20 border-cyan-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                <div className={`p-4 rounded-2xl flex-shrink-0 ${vulnerability.isSafe ? 'bg-cyan-500/20' : 'bg-red-500/20'}`}>
                  {vulnerability.isSafe ? <CheckCircle2 className="text-cyan-400" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
                </div>
                <div className="flex flex-col justify-center min-h-[56px]">
                  <p className={`text-[10px] font-black tracking-[0.2em] mb-1.5 ${vulnerability.isSafe ? 'text-cyan-400' : 'text-red-500'}`}>
                    {vulnerability.label}
                  </p>
                  <p className="text-[11px] text-zinc-400 normal-case leading-snug font-medium">
                    {vulnerability.msg}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <CardCiclosOperacionais />
        </div>
      </div>
    </div>
  );
}
