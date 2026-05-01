'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProbabilityBar } from '@/components/markets/ProbabilityBar';
import { OracleStatusBadge } from '@/components/markets/OracleStatusBadge';
import { BetModal } from '@/components/markets/BetModal';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Activity, 
  BrainCircuit, 
  Timer, 
  ShieldCheck, 
  ArrowLeft,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function isValidAddress(addr: string): addr is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export default function MarketDetailPage() {
  const { address } = useParams();
  const marketAddress = typeof address === 'string' ? address : '';
  
  const [market, setMarket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [initialOutcome, setInitialOutcome] = useState<boolean | null>(null);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  useEffect(() => {
    if (!isValidAddress(marketAddress)) {
      setIsLoading(false);
      return;
    }

    async function fetchMarket() {
      try {
        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('market_address', address)
          .single();

        if (error) throw error;
        setMarket(data);

        // Fetch recent bets for this market
        const { data: betsData } = await supabase
          .from('bets')
          .select('user_address, is_yes, amount, created_at')
          .eq('market_address', address)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentBets(betsData || []);
      } catch (err) {
        console.error('Error fetching market details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (address) {
      fetchMarket();
    }
  }, [address]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Mercado no encontrado</h1>
        <Link href="/" className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>
    );
  }

  const isExpired = market?.ends_at ? new Date(market.ends_at).getTime() < Date.now() : false;
  const isResolved = market?.status === 'resolved' || market?.status === 'verified';
  const isClosed = isExpired || isResolved;

  // canClaim: market resolved + 24h dispute period has passed
  const DISPUTE_PERIOD_MS = 24 * 60 * 60 * 1000;
  const canClaim = isResolved &&
    market?.resolved_at != null &&
    Date.now() > new Date(market.resolved_at).getTime() + DISPUTE_PERIOD_MS;

  const displayQuestion = market?.question ? market.question.replace(/\[.*?\]\s*/g, '') : "Cargando...";

  // Detectar Formato
  const format = market?.question?.match(/\[FORMAT:(.*?)\]/i)?.[1] || 'BINARY';
  
  // Parsear opciones si es MULTI
  const optionsMatch = market?.question?.match(/\[OPTIONS:\s*(.*?)\s*\]/i);
  const multiOptions = optionsMatch?.[1].split(',').map((opt: string) => opt.trim()) || [];

  // Parsear equipos si es 1X2 o H2H
  const h2hMatch = market?.question?.match(/\[H2H:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
  const match1X2 = market?.question?.match(/\[1X2:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
  
  const yesLabel = h2hMatch ? h2hMatch[1] : (match1X2 ? match1X2[1] : "SÍ");
  const noLabel = h2hMatch ? h2hMatch[2] : (match1X2 ? match1X2[2] : "NO");

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-8 pt-10">
      
      <main className="container mx-auto px-4 py-8">
        
        {/* Hero Section - Matched with Home */}
        <section className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-emerald-600 mb-8 transition-colors group text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a mercados</span>
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <div className="h-[2px] w-8 bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold italic">
              {format === 'POLLA' ? 'Bóveda Pari-Mutuel' : 'Mercado en Tiempo Real'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-900 leading-[1.1] tracking-tighter mb-6">
                {displayQuestion}
              </h1>
              
              <div className="flex flex-wrap gap-3 items-center">
                <div className="px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100 flex items-center gap-2 shadow-sm">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {format === 'POLLA' ? 'Pozo Estimado' : 'Volumen'}: ${(Number(market.total_yes || 0) + Number(market.total_no || 0)).toFixed(2)} USDC
                  </span>
                </div>
                <div className="px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100 flex items-center gap-2 shadow-sm">
                  <Timer className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    {isClosed ? 'Cerrado el:' : 'Expira:'} {new Date(market.ends_at).toLocaleDateString()}
                  </span>
                </div>
                <OracleStatusBadge status={isResolved ? 'resolved' : (isExpired ? 'processing' : 'active')} />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Columna Izquierda: Información y Análisis */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Gráfico Placeholder (Clean Style) */}
            <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] h-[400px] relative group overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                  {format === 'POLLA' ? 'VAULT_PARTICIPANTS_FEED' : 'Trading_View_Terminal'}
                </h3>
                <div className="flex gap-2 items-center">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", isClosed ? "bg-zinc-300" : "bg-emerald-500")} />
                  <span className={cn("text-[9px] font-mono font-bold", isClosed ? "text-zinc-400" : "text-emerald-600")}>
                    {isClosed ? "TERMINAL_LOCKED" : "LIVE_FEED_ACTIVE"}
                  </span>
                </div>
              </div>
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-[2rem] bg-zinc-50/50">
                {format === 'POLLA' ? (
                  <Activity className="w-16 h-16 text-zinc-200 mb-4 group-hover:text-emerald-500/20 transition-colors" />
                ) : (
                  <TrendingUp className="w-16 h-16 text-zinc-200 mb-4 group-hover:text-emerald-500/20 transition-colors" />
                )}
                <p className="text-zinc-400 font-mono text-xs font-bold tracking-widest">
                  {format === 'POLLA' ? '[ SYNCING_PARTICIPANTS ]' : '[ ENGINE_LOADING_DATA ]'}
                </p>
                <p className="text-[9px] text-zinc-400 mt-3 italic uppercase tracking-tighter opacity-60">
                  {format === 'POLLA' ? 'Visualización de predicciones próximamente' : 'Visualización de liquidez próximamente'}
                </p>
              </div>
            </div>

            {/* AI Verdict Section */}
            <div className={cn(
              "border p-10 rounded-[2.5rem] relative overflow-hidden group shadow-sm transition-all",
              isResolved ? "bg-emerald-50/50 border-emerald-200" : "bg-zinc-50/30 border-zinc-100"
            )}>
              <div className="flex items-center gap-4 mb-8">
                <div className={cn("p-3 rounded-2xl shadow-inner", isResolved ? "bg-emerald-100 border border-emerald-200" : "bg-zinc-100 border border-zinc-200")}>
                  <BrainCircuit className={cn("w-7 h-7", isResolved ? "text-emerald-600" : "text-zinc-400")} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight italic uppercase">
                    {isResolved ? "Veredicto de la IA" : "Monitoreo Preventivo"}
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-1">Oracle_System_v2.5_Flash</p>
                </div>
              </div>
              
              <div className="space-y-4 relative">
                <p className="text-zinc-600 text-lg leading-relaxed italic font-medium">
                  "{market.resolution_reason || (format === 'POLLA' 
                    ? "La IA validará cada marcador de los partidos seleccionados una vez finalicen para determinar los ganadores de la polla." 
                    : "La IA está monitoreando los eventos globales para proporcionar un veredicto factual en cuanto el mercado expire.")}"
                </p>
                <div className="pt-6 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified_by_PredicFi_Oracle_Protocol</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Panel de Apuestas */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] shadow-2xl shadow-zinc-100 sticky top-24">
              <h2 className="text-xs font-black mb-10 text-zinc-400 flex items-center gap-3 uppercase tracking-[0.3em]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {format === 'POLLA' ? 'Vault_Entry' : 'Trading_Terminal'}
              </h2>
              
              <div className="space-y-10">
                {format !== 'POLLA' && (
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-4 px-1">
                      <span className="text-emerald-600">
                        {format === 'BINARY' || format === 'H2H' ? (yesLabel + ':') : 'SÍ:'} {market.total_yes > 0 ? Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : '50'}%
                      </span>
                      <span className="text-zinc-400">
                        {format === 'BINARY' || format === 'H2H' ? (noLabel + ':') : 'NO:'} {market.total_yes > 0 ? 100 - Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : '50'}%
                      </span>
                    </div>
                    <ProbabilityBar yesPercentage={market.total_yes > 0 ? Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : 50} />
                  </div>
                )}

                <div className="space-y-4">
                  {format === 'POLLA' ? (
                    <button 
                      onClick={() => { setIsBetModalOpen(true); }}
                      disabled={isClosed}
                      className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-widest hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Unirse a la Polla (10 USDC)
                    </button>
                  ) : format === 'MULTI' ? (
                    <div className="grid grid-cols-1 gap-3">
                      {multiOptions.map((opt: string, i: number) => (
                        <button 
                          key={i}
                          onClick={() => { setInitialOutcome(true); setIsBetModalOpen(true); }}
                          disabled={isClosed}
                          className="py-4 rounded-2xl border-2 border-zinc-100 text-zinc-900 font-black text-xs uppercase tracking-widest hover:border-emerald-500 hover:bg-emerald-50 transition-all flex justify-between px-6 items-center"
                        >
                          <span>{opt}</span>
                          <span className="text-emerald-600 font-mono">30%</span>
                        </button>
                      ))}
                    </div>
                  ) : format === '1X2' ? (
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => { setInitialOutcome(true); setIsBetModalOpen(true); }}
                        disabled={isClosed}
                        className="py-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex flex-col items-center gap-1"
                      >
                        <span className="opacity-40">1</span>
                        <span>{yesLabel.slice(0, 3)}</span>
                      </button>
                      <button 
                        onClick={() => { setInitialOutcome(false); setIsBetModalOpen(true); }}
                        disabled={isClosed}
                        className="py-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all flex flex-col items-center gap-1"
                      >
                        <span className="opacity-40">X</span>
                        <span>EMP</span>
                      </button>
                      <button 
                        onClick={() => { setInitialOutcome(false); setIsBetModalOpen(true); }}
                        disabled={isClosed}
                        className="py-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex flex-col items-center gap-1"
                      >
                        <span className="opacity-40">2</span>
                        <span>{noLabel.slice(0, 3)}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => { setInitialOutcome(true); setIsBetModalOpen(true); }}
                        disabled={isClosed}
                        className="py-5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {yesLabel}
                      </button>
                      <button 
                        onClick={() => { setInitialOutcome(false); setIsBetModalOpen(true); }}
                        disabled={isClosed}
                        className="py-5 rounded-2xl bg-zinc-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {noLabel}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-zinc-100">
                  {isResolved && (
                    <button 
                      disabled={!canClaim}
                      className={cn(
                        "w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all mb-6 shadow-xl flex items-center justify-center gap-3",
                        canClaim 
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200" 
                          : "bg-zinc-50 text-zinc-300 cursor-not-allowed shadow-none border border-zinc-100"
                      )}
                    >
                      {canClaim ? <ShieldCheck className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                      {canClaim ? "Reclamar Ganancias" : "Bloqueado_En_Disputa"}
                    </button>
                  )}

                  {isClosed ? (
                    <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl text-center">
                      <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em]">
                        {isResolved ? "MERCADO FINALIZADO" : "PENDIENTE_DE_IA"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
                        <Info className="w-3 h-3 text-emerald-500" />
                        <span>Gasless_Via_Permit_Enabled</span>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em]">
                          <span className="text-zinc-400">Protocol_Network</span>
                          <span className="text-emerald-600">Base Sepolia</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-zinc-50/50 border border-zinc-100 p-8 rounded-[2.5rem]">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase mb-6 tracking-[0.3em]">Live_Feed_Activity</h4>
              <div className="space-y-4">
                {recentBets.length === 0 ? (
                  <p className="text-[10px] font-mono text-zinc-300 text-center py-6 italic uppercase tracking-tighter">No hay actividad reciente</p>
                ) : (
                  recentBets.map((bet, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] font-mono py-3 border-b border-zinc-200/50 last:border-0">
                      <span className="text-zinc-500 font-bold uppercase tracking-tighter">
                        {bet.user_address ? `${bet.user_address.slice(0, 4)}...${bet.user_address.slice(-4)}` : '0x???'}
                      </span>
                      <span className={cn("font-black tracking-tighter", bet.is_yes ? "text-emerald-600" : "text-red-500")}>
                        {bet.is_yes ? 'B_YES' : 'B_NO'}
                      </span>
                      <span className="text-zinc-900 font-black italic">${Number(bet.amount || 0).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
      
      {market && (
        <BetModal 
          isOpen={isBetModalOpen} 
          onClose={() => setIsBetModalOpen(false)} 
          marketAddress={address as string}
          question={market.question}
          initialOutcome={initialOutcome}
        />
      )}
    </div>
  );
}
