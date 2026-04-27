"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, Flame, BrainCircuit, 
  Loader2, AlertTriangle, Trophy, Crown, Shield, Hourglass,
  BatteryCharging, CheckCircle2, CalendarDays
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VereditoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState(1); // 0: Passado, 1: Atual, 2: Futuro
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [financialHealth, setFinancialHealth] = useState(0); 
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  // Dados Estáticos para o Card de Ciclos
  const cyclesData = [
    { 
      label: "CICLO ANTERIOR", 
      status: "ENCERRADO", 
      valor: "R$ 4.820,00", 
      detalhe: "Operação finalizada com 18% de retenção líquida. O capital foi direcionado corretamente para as zonas de poder.",
      cor: "bg-zinc-700" 
    },
    { 
      label: "CICLO ATUAL", 
      status: "EM CURSO", 
      valor: "R$ 2.450,00", 
      detalhe: "Você consumiu 45% do teto operacional projetado. Mantenha o ritmo de lançamentos para evitar pontos cegos antes do fechamento.",
      cor: "bg-yellow-500" 
    },
    { 
      label: "PRÓXIMO CICLO", 
      status: "PROJEÇÃO", 
      valor: "R$ 3.120,00", 
      detalhe: "Custo fixo estimado com base em suas metas. O sistema prevê uma oportunidade de aporte 10% maior se a disciplina for mantida.",
      cor: "bg-zinc-900 border border-dashed border-zinc-700" 
    }
  ];

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
        const agora = new Date();

        const saídas = rawData.filter(t => 
          t.type?.toLowerCase() === 'withdrawal' || t.type?.toLowerCase() === 'saida' || t.type?.toLowerCase() === 'saída'
        );
        const entradas = rawData.filter(t => 
          t.type?.toLowerCase() === 'deposit' || t.type?.toLowerCase() === 'entrada'
        );
        
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
        trintaDiasAtras.setDate(agora.getDate() - 30);
        const ultimos30Dias = saídas.filter(t => new Date(t.created_at) >= trintaDiasAtras);
        const gastoMensal = ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
        const gastoDiario = gastoMensal / 30;

        const diasRestantes = gastoDiario > 0 ? Math.floor(saldoAtual / gastoDiario) : (saldoAtual > 0 ? 999 : 0);
        setBurnData({ dias: Math.max(0, diasRestantes), percentual: Math.min(100, (diasRestantes / 180) * 100) });

        const taxaRetencao = totalEntradasHistorico > 0 
          ? Math.max(0, ((totalEntradasHistorico - totalSaidasHistorico) / totalEntradasHistorico) * 100)
          : (saldoAtual > 0 ? 100 : 0);
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

  const vulnerability = useMemo(() => {
    const metricEntries = Object.entries(metrics);
    const allFull = metricEntries.every(([_, val]) => val >= 90);
    
    if (allFull) {
      const congrats = [
        "Protocolo Soberano ativo. A sincronia entre fluxo e retenção atingiu o ápice operacional.",
        "Eficiência de nível IMPLACÁVEL. Todas as vertentes do seu capital operam em blindagem total.",
        "Estrutura financeira inabalável. O sistema não detectou vulnerabilidades em seu ecossistema."
      ];
      return { label: "PERFORMANCE MÁXIMA", msg: congrats[Math.floor(Math.random() * congrats.length)], isSafe: true };
    }

    const lowest = metricEntries.reduce((prev, curr) => prev[1] < curr[1] ? prev : curr);
    const tips: Record<string, { label: string, msgs: string[] }> = {
      consistencia: { label: "FLUXO IRREGULAR", msgs: ["Padrão de registro descontínuo. Você precisa registrar suas movimentações com maior frequência para que o sistema consiga estabilizar sua visão estratégica.", "Frequência de dados insuficiente. O hábito de lançar seus gastos diariamente é o que garante a precisão do veredito final sobre o seu capital."] },
      precisao: { label: "PONTO CEGO", msgs: ["Rastro de capital não identificado. Você pode detalhar melhor suas despesas em vez de usar 'Outros', pois o acúmulo de gastos sem nome oculta o destino real do seu dinheiro.", "Identidade financeira oculta. Ao categorizar cada transação de forma específica, você permite que o sistema identifique onde sua eficiência está sendo drenada."] },
      previsao: { label: "FALTA DE ALVO", msgs: ["Navegação sem coordenadas. Você deve definir limites de gastos por categoria, pois sem alvos claros, sua capacidade de defesa antecipada é anulada.", "Falta de parâmetro preditivo. Estabelecer metas mensais permite que o sistema antecipe riscos antes mesmo de você fechar o mês no vermelho."] },
      disciplina: { label: "CONSUMO ELEVADO", msgs: ["Vazamento de capital detectado. O volume de saídas variáveis está alto demais; você pode reduzir gastos supérfluos para recuperar sua segurança operacional.", "Taxa de retenção em declínio. Ao controlar melhor o consumo imediato, você fortalece sua blindagem patrimonial."] },
      evolucao: { label: "ESTAGNAÇÃO", msgs: ["Patrimônio em modo estático. Você pode direcionar mais recursos para ativos e investimentos, pois o baixo volume de aportes interrompe sua escalada de status.", "Aceleração de capital interrompida. Sem o hábito de investir estrategicamente, sua dominância financeira permanece paralisada."] },
      engajamento: { label: "BAIXA VIGILÂNCIA", msgs: ["Vigilância em nível crítico. Você deve interagir mais com as ferramentas de análise, pois a falta de acompanhamento reduz a autoridade dos dados processados.", "Monitoramento tático insuficiente. O sistema requer sua presença frequente para refinar a inteligência."] }
    };

    const tip = tips[lowest[0]] || tips.consistencia;
    return { label: tip.label, msg: tip.msgs[Math.floor(Math.random() * tip.msgs.length)], isSafe: false };
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
      <div className="max-w-md mx-auto space-y-10 bg-black pb-20">
        
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6 p-4">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.4em] mt-2">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* CONQUISTAS */}
        <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5 mx-4">
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
        </section>

        {/* STATUS */}
        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden mx-4`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className={status.color} size={20} />
              <span className="text-[10px] font-bold text-zinc-500 tracking-[0.3em]">DIAGNÓSTICO ATIVO</span>
            </div>
            <h2 className={`text-6xl font-black italic mb-4 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium normal-case leading-relaxed">{status.desc}</p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        {/* DISTRIBUIÇÃO */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden mx-4">
          <div className="flex items-center gap-2 mb-6">
            <BatteryCharging className="text-zinc-500" size={14} />
            <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-32 gap-3 mb-6">
            {[
              { label: "MANUTENÇÃO", val: powerAllocation.manutencao, color: "bg-zinc-800", desc: "CONTAS E ESSENCIAIS" },
              { label: "PRAZER", val: powerAllocation.prazer, color: "bg-orange-500/40", desc: "ESTILO DE VIDA" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500", desc: "DINHEIRO TRABALHANDO" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-white/5 rounded-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100px' }}>
                  <div className={`w-full ${b.color} transition-all duration-1000`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[10px] font-black italic">{b.val}%</p>
                <div className="text-center">
                   <p className="text-[7px] text-white font-bold uppercase tracking-tighter">{b.label}</p>
                   <p className="text-[5px] text-zinc-500 font-black uppercase mt-1 leading-tight border-t border-white/10 pt-1">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AUTONOMIA */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden mx-4">
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
        </section>

        {/* RADAR */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 mx-4">
          <div className="flex justify-center mb-10">{renderRadar()}</div>
          <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key}>
                <p className="text-[7px] text-zinc-500 font-black mb-1">{key.toUpperCase()}</p>
                <p className="text-xl font-black italic">{val}<span className="text-yellow-500 text-[10px]">%</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* ALERTA / VULNERABILIDADE */}
        <section className={`border p-6 rounded-[2.5rem] flex items-center gap-5 mx-4 transition-all duration-500 ${vulnerability.isSafe ? 'bg-cyan-950/20 border-cyan-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
           <div className={`p-4 rounded-2xl ${vulnerability.isSafe ? 'bg-cyan-500/20' : 'bg-red-500/20'}`}>
              {vulnerability.isSafe ? <CheckCircle2 className="text-cyan-400" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
           </div>
           <div>
              <p className={`text-[10px] font-black tracking-[0.2em] mb-1 ${vulnerability.isSafe ? 'text-cyan-400' : 'text-red-500'}`}>
                {vulnerability.label}
              </p>
              <p className="text-[11px] text-zinc-400 normal-case leading-tight">{vulnerability.msg}</p>
           </div>
        </section>

        {/* NOVO CARD: CICLOS OPERACIONAIS (ESTÁTICO PARA TESTE) */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 mx-4 mb-10">
          <div className="flex items-center gap-2 mb-8 px-1">
            <CalendarDays className="text-zinc-600" size={14} />
            <span className="text-[9px] font-black text-zinc-600 tracking-[0.2em] uppercase">Cronograma de Ciclos</span>
          </div>

          {/* Seletor de Barras (Estilo Timeline) */}
          <div className="flex justify-between items-end h-24 mb-10 px-4">
            {cyclesData.map((cycle, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedCycle(idx)}
                className="flex flex-col items-center gap-4 transition-all duration-300 outline-none"
              >
                <div 
                  className={`w-14 rounded-xl transition-all duration-500 ${cycle.cor} ${selectedCycle === idx ? 'h-20 opacity-100 shadow-[0_0_20px_rgba(250,204,21,0.2)] scale-110' : 'h-12 opacity-20 hover:opacity-40'}`} 
                />
                <span className={`text-[8px] font-black tracking-widest ${selectedCycle === idx ? 'text-white' : 'text-zinc-700'}`}>
                  {idx === 0 ? 'PASSADO' : idx === 1 ? 'ATUAL' : 'FUTURO'}
                </span>
              </button>
            ))}
          </div>

          {/* Painel de Detalhes Dinâmico */}
          <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-yellow-500 tracking-[0.2em] mb-2">
                  {cyclesData[selectedCycle].label}
                </p>
                <h4 className="text-4xl font-black italic tracking-tighter">
                  {cyclesData[selectedCycle].valor}
                </h4>
              </div>
              <div className="bg-zinc-800/50 px-3 py-1 rounded-full border border-white/5">
                <span className="text-[8px] font-black text-zinc-400 tracking-widest italic uppercase">
                  {cyclesData[selectedCycle].status}
                </span>
              </div>
            </div>
            
            <div className="border-t border-white/5 pt-5">
              <p className="text-[11px] text-zinc-400 normal-case leading-relaxed font-medium">
                {cyclesData[selectedCycle].detalhe}
              </p>
            </div>
            
            {/* Elemento Visual de Fundo */}
            <Zap className="absolute -right-6 -bottom-6 text-white/5 rotate-12" size={100} />
          </div>
        </section>

      </div>
    </div>
  );
}
