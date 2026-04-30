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

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-8 pt-20">
      
      <main className="container mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-600 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a mercados</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Información y Análisis */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header del Mercado */}
            <div className={cn(
              "bg-white border p-8 rounded-[2rem] shadow-sm relative overflow-hidden transition-opacity",
              isClosed ? "border-zinc-200 opacity-80" : "border-zinc-200"
            )}>
              <div className="absolute top-0 right-0 p-6">
                <OracleStatusBadge status={isResolved ? 'resolved' : (isExpired ? 'processing' : 'active')} />
              </div>
              
              <div className="flex items-center gap-3 text-zinc-400 mb-4 text-sm font-mono">
                <Timer className="w-4 h-4 text-emerald-500" />
                <span>{isClosed ? 'Cerrado el:' : 'Expira:'} {new Date(market.ends_at).toLocaleDateString()}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6 leading-tight tracking-tight">
                {displayQuestion}
              </h1>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-zinc-700">Volumen: ${market.total_yes + market.total_no || '0.00'}</span>
                </div>
                <div className="px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-zinc-700">Probabilidad: {market.total_yes > 0 ? Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : '50'}%</span>
                </div>
              </div>
            </div>

            {/* Gráfico Placeholder (Clean Style) */}
            <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] h-80 relative group overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Gráfico de Probabilidad</h3>
                <div className="flex gap-2">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", isClosed ? "bg-zinc-300" : "bg-emerald-500")} />
                  <span className={cn("text-[10px] font-mono", isClosed ? "text-zinc-400" : "text-emerald-600")}>
                    {isClosed ? "MERCADO CERRADO" : "DATOS EN TIEMPO REAL"}
                  </span>
                </div>
              </div>
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                <TrendingUp className="w-12 h-12 text-zinc-200 mb-2 group-hover:text-emerald-500/20 transition-colors" />
                <p className="text-zinc-400 font-mono text-xs">[ TRADING_VIEW_WIDGET_LOCKED ]</p>
                <p className="text-[10px] text-zinc-400 mt-2 italic">Seguimiento histórico próximamente</p>
              </div>
            </div>

            {/* AI Verdict Section */}
            <div className={cn(
              "border p-8 rounded-[2rem] relative overflow-hidden group",
              isResolved ? "bg-emerald-50 border-emerald-200" : "bg-zinc-50/50 border-zinc-100"
            )}>
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2 rounded-lg", isResolved ? "bg-emerald-100" : "bg-zinc-100")}>
                  <BrainCircuit className={cn("w-6 h-6", isResolved ? "text-emerald-600" : "text-zinc-400")} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">
                  {isResolved ? "Veredicto de la IA" : "Análisis Preventivo"}
                </h3>
              </div>
              
              <div className="space-y-4 relative">
                <p className="text-zinc-600 leading-relaxed italic">
                  {market.resolution_reason || "La IA está monitoreando los eventos globales para proporcionar un veredicto factual en cuanto el mercado expire."}
                </p>
                <div className="pt-4 flex items-center gap-2 text-[10px] font-mono text-emerald-600 uppercase tracking-tighter font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verificado por Gemini 2.5 Flash Oracle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Panel de Apuestas */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 p-8 rounded-[2rem] shadow-xl shadow-zinc-200/50 sticky top-8">
              <h2 className="text-xl font-mono mb-8 text-zinc-900 flex items-center gap-2 font-bold">
                <Activity className="w-5 h-5 text-emerald-500" />
                TERMINAL
              </h2>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-3 px-1">
                    <span className="text-emerald-600 font-bold">SÍ: {market.total_yes > 0 ? Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : '50'}%</span>
                    <span className="text-zinc-400">NO: {market.total_yes > 0 ? 100 - Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : '50'}%</span>
                  </div>
                  <ProbabilityBar yesPercentage={market.total_yes > 0 ? Math.round((market.total_yes / (market.total_yes + market.total_no)) * 100) : 50} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setInitialOutcome(true); setIsBetModalOpen(true); }}
                    disabled={isClosed}
                    className="py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    COMPRAR SÍ
                  </button>
                  <button 
                    onClick={() => { setInitialOutcome(false); setIsBetModalOpen(true); }}
                    disabled={isClosed}
                    className="py-4 rounded-2xl bg-zinc-900 text-white font-bold hover:bg-black transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    COMPRAR NO
                  </button>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  {isResolved && (
                    <button 
                      disabled={!canClaim}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold transition-all mb-4 shadow-lg flex items-center justify-center gap-2",
                        canClaim 
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200" 
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none border border-zinc-200"
                      )}
                    >
                      {canClaim ? <ShieldCheck className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
                      {canClaim ? "RECLAMAR GANANCIAS" : "BLOQUEADO (EN DISPUTA)"}
                    </button>
                  )}

                  {isClosed ? (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                      <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest text-center">
                        {isResolved ? "MERCADO FINALIZADO" : "TIEMPO AGOTADO - ESPERANDO IA"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-4">
                        <Info className="w-4 h-4" />
                        <span>Transacción protegida vía EIP-2612</span>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500 font-mono uppercase tracking-widest">Red</span>
                          <span className="text-emerald-600 font-bold">Base Sepolia</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-zinc-50 border border-zinc-100 p-6 rounded-[2rem]">
              <h4 className="text-xs font-mono text-zinc-400 uppercase mb-4 tracking-widest">Actividad Reciente</h4>
              <div className="space-y-4">
                {recentBets.length === 0 ? (
                  <p className="text-[11px] font-mono text-zinc-400 text-center py-4">Sin actividad aún</p>
                ) : (
                  recentBets.map((bet, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono py-2 border-b border-zinc-200/50 last:border-0">
                      <span className="text-zinc-500">
                        {bet.user_address ? `${bet.user_address.slice(0, 6)}...${bet.user_address.slice(-4)}` : '0x???'}
                      </span>
                      <span className={bet.is_yes ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                        {bet.is_yes ? 'COMPRÓ SÍ' : 'COMPRÓ NO'}
                      </span>
                      <span className="text-zinc-900">${Number(bet.amount || 0).toFixed(2)}</span>
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
