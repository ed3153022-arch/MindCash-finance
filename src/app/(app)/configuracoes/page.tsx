"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Zap, ShieldCheck, Trophy, Crown, Shield, Hourglass, 
  BatteryCharging, Loader2, AlertTriangle, BrainCircuit, 
  Flame, Download, Share2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function VereditoPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null); // Referência para o PDF
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [burnData, setBurnData] = useState({ dias: 0, percentual: 0 });
  const [powerAllocation, setPowerAllocation] = useState({ manutencao: 0, prazer: 0, poder: 0 });
  const [metrics, setMetrics] = useState({
    consistencia: 0, precisao: 0, previsao: 0, disciplina: 0, engajamento: 0, evolucao: 0
  });

  // --- FUNÇÃO DE EXPORTAR PDF ---
  const exportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: "#000000",
        scale: 2, // Alta qualidade
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VEREDITO-${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    async function fetchVereditoData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }

        const [transRes, limitesRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", user.id).order('created_at', { ascending: false }),
          supabase.from("category_limits").select("*").eq("user_id", user.id)
        ]);

        const rawData = transRes.data || [];
        const limites = limitesRes.data || [];
        const agora = new Date();

        const saídas = rawData.filter(t => t.type === 'withdrawal');
        const saldoAtual = rawData.reduce((acc, t) => t.type === 'deposit' ? acc + Number(t.amount) : acc - Math.abs(Number(t.amount)), 0);
        
        // Lógica de Poder
        const totalGeral = rawData.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) || 1;
        const volPoder = rawData.filter(t => ["Investimentos", "Reserva", "Aportes"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volPrazer = saídas.filter(t => ["Lazer", "Restaurante", "Shopping", "Viagem"].includes(t.category)).reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
        const volManutencao = Math.max(0, totalGeral - volPoder - volPrazer);

        setPowerAllocation({
          manutencao: Math.round((volManutencao / totalGeral) * 100),
          prazer: Math.round((volPrazer / totalGeral) * 100),
          poder: Math.round((volPoder / totalGeral) * 100)
        });

        // Lógica de Burn Rate
        const ultimos30Dias = saídas.filter(t => (agora.getTime() - new Date(t.created_at).getTime()) / (1000 * 3600 * 24) <= 30);
        const gastoDiarioMedio = (ultimos30Dias.reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0) / 30) || 1;
        const diasRestantes = Math.floor(saldoAtual / gastoDiarioMedio);
        setBurnData({ dias: Math.max(0, diasRestantes), percentual: Math.min(100, (diasRestantes / 30) * 100) });

        setMetrics({
          consistencia: 88, precisao: 92, previsao: 75, disciplina: 80, evolucao: 65, engajamento: 95
        });

      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchVereditoData();
  }, [router]);

  const avgScore = (Object.values(metrics).reduce((a, b) => a + b, 0)) / 6;
  const status = useMemo(() => {
    if (avgScore >= 80) return { label: "DOMINANTE", color: "text-green-400", bg: "bg-green-500/10", desc: "Controle superior detectado." };
    return { label: "ESTÁVEL", color: "text-yellow-400", bg: "bg-yellow-500/10", desc: "Equilíbrio em manutenção." };
  }, [avgScore]);

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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="text-yellow-400 animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans uppercase tracking-tighter">
      {/* BOTÃO DE AÇÃO FIXO NO TOPO */}
      <div className="max-w-xl mx-auto flex justify-end gap-3 mb-4 sticky top-4 z-50">
        <button 
          onClick={exportPDF}
          disabled={isExporting}
          className="bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black hover:bg-yellow-500 transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {isExporting ? "GERANDO SENTENÇA..." : "EXPORTAR PDF"}
        </button>
      </div>

      <div ref={printRef} className="max-w-xl mx-auto space-y-10 pt-4 bg-black p-4 rounded-3xl">
        
        {/* CABEÇALHO */}
        <header className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-6xl font-black italic text-white leading-none">VEREDITO</h1>
            <p className="text-[10px] text-yellow-500/80 font-bold tracking-[0.4em] mt-2 italic">SENTENÇA DO CAPITAL</p>
          </div>
          <Zap className="text-yellow-400 fill-yellow-400" size={24} />
        </header>

        {/* 1. SELOS */}
        <section className="bg-[#050505] p-6 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="text-zinc-600" size={12} />
            <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase italic">Conquistas de Performance</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'mur', name: "MURALHA", icon: <Shield size={18}/>, active: metrics.disciplina > 75, color: "text-blue-500" },
              { id: 'sen', name: "SENTINELA", icon: <ShieldCheck size={18}/>, active: true, color: "text-cyan-500" },
              { id: 'sob', name: "SOBERANO", icon: <Crown size={18}/>, active: false, color: "text-orange-500" },
              { id: 'imp', name: "IMPULSO", icon: <Flame size={18}/>, active: true, color: "text-red-500" }
            ].map(s => (
              <div key={s.id} className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${s.active ? 'border-white/10 bg-white/5 opacity-100' : 'border-transparent opacity-10'}`}>
                <div className={s.active ? s.color : 'text-zinc-800'}>{s.icon}</div>
                <span className="text-[8px] font-black mt-2 tracking-wider">{s.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. ALOCAÇÃO DE PODER */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <BatteryCharging className="text-zinc-500" size={14} />
            <span className="text-[9px] font-black text-zinc-500 tracking-widest uppercase italic">Distribuição de Poder</span>
          </div>
          <div className="flex items-end justify-between h-32 gap-3 mb-4">
            {[
              { label: "MANUTENÇÃO", val: powerAllocation.manutencao, color: "bg-zinc-800" },
              { label: "PRAZER", val: powerAllocation.prazer, color: "bg-orange-500/40" },
              { label: "PODER", val: powerAllocation.poder, color: "bg-yellow-500" }
            ].map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full bg-white/5 rounded-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100px' }}>
                  <div className={`w-full ${b.color} transition-all duration-1000`} style={{ height: `${b.val}%` }} />
                </div>
                <p className="text-[10px] font-black italic">{b.val}%</p>
                <p className="text-[6px] text-zinc-600 font-bold uppercase tracking-tighter">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. STATUS */}
        <section className={`p-8 rounded-[2.5rem] border border-white/5 ${status.bg} backdrop-blur-sm relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className={`text-6xl font-black italic mb-2 ${status.color}`}>{status.label}</h2>
            <p className="text-[11px] text-zinc-400 font-medium normal-case">{status.desc}</p>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5" size={140} />
        </section>

        {/* 4. AUTONOMIA */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1"><Hourglass className="text-yellow-500" size={14} /><span className="text-[9px] font-black text-zinc-500 tracking-widest italic">Autonomia Estimada</span></div>
              <h3 className="text-3xl font-black italic text-white">{burnData.dias} <span className="text-zinc-500 text-sm italic">DIAS</span></h3>
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${burnData.dias > 15 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${burnData.percentual}%` }} />
          </div>
        </section>

        {/* 5. RADAR */}
        <section className="bg-[#050505] p-8 rounded-[3rem] border border-white/5">
          <div className="flex justify-center mb-10 overflow-visible">{renderRadar()}</div>
          <div className="grid grid-cols-3 gap-y-8 border-t border-white/5 pt-8 text-center">
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key}>
                <p className="text-[7px] text-zinc-500 font-black mb-1">{key.toUpperCase()}</p>
                <p className="text-xl font-black italic">{val}<span className="text-yellow-500 text-[10px]">%</span></p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. RODAPÉ DO PDF */}
        <div className="pt-10 text-center">
          <p className="text-[8px] text-zinc-700 font-black tracking-[0.5em] uppercase italic">MindCash Intelligence Protocol v1.0</p>
        </div>

      </div>
    </div>
  );
}
