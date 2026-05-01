import { TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketChartPlaceholderProps {
  format: string;
  isClosed: boolean;
}

export function MarketChartPlaceholder({ format, isClosed }: MarketChartPlaceholderProps) {
  return (
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
  );
}
