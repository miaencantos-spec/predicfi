import { ArrowLeft, Activity, Timer } from 'lucide-react';
import Link from 'next/link';
import { OracleStatusBadge } from './OracleStatusBadge';
import { Market } from '@/hooks/useMarketData';

interface MarketHeroProps {
  displayQuestion: string;
  format: string;
  market: Market;
  isClosed: boolean;
  isResolved: boolean;
  isExpired: boolean;
}

export function MarketHero({ displayQuestion, format, market, isClosed, isResolved, isExpired }: MarketHeroProps) {
  return (
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
                {isClosed ? 'Cerrado el:' : 'Expira:'} {market.ends_at ? new Date(market.ends_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <OracleStatusBadge status={isResolved ? 'resolved' : (isExpired ? 'processing' : 'active')} />
          </div>
        </div>
      </div>
    </section>
  );
}
