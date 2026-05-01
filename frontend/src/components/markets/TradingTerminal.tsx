import { ProbabilityBar } from './ProbabilityBar';
import { ShieldCheck, Timer, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Market } from '@/hooks/useMarketData';

interface TradingTerminalProps {
  format: string;
  market: Market;
  yesLabel: string;
  noLabel: string;
  multiOptions: string[];
  isClosed: boolean;
  isResolved: boolean;
  canClaim: boolean;
  setIsBetModalOpen: (open: boolean) => void;
  setInitialOutcome: (outcome: boolean | null) => void;
}

export function TradingTerminal({
  format,
  market,
  yesLabel,
  noLabel,
  multiOptions,
  isClosed,
  isResolved,
  canClaim,
  setIsBetModalOpen,
  setInitialOutcome
}: TradingTerminalProps) {
  const total = Number(market.total_yes || 0) + Number(market.total_no || 0);
  const yesPercentage = total > 0 ? Math.round((Number(market.total_yes) / total) * 100) : 50;

  return (
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
                {format === 'BINARY' || format === 'H2H' ? (yesLabel + ':') : 'SÍ:'} {yesPercentage}%
              </span>
              <span className="text-zinc-400">
                {format === 'BINARY' || format === 'H2H' ? (noLabel + ':') : 'NO:'} {100 - yesPercentage}%
              </span>
            </div>
            <ProbabilityBar yesPercentage={yesPercentage} />
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
              {multiOptions.map((opt, i) => (
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
  );
}
