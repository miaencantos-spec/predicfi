import { BrainCircuit, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Market } from '@/hooks/useMarketData';

interface AIVerdictCardProps {
  isResolved: boolean;
  market: Market;
  format: string;
}

export function AIVerdictCard({ isResolved, market, format }: AIVerdictCardProps) {
  return (
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
          &quot;{market.resolution_reason || (format === 'POLLA' 
            ? "La IA validará cada marcador de los partidos seleccionados una vez finalicen para determinar los ganadores de la polla." 
            : "La IA está monitoreando los eventos globales para proporcionar un veredicto factual en cuanto el mercado expire.")}&quot;
        </p>
        <div className="pt-6 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified_by_PredicFi_Oracle_Protocol</span>
        </div>
      </div>
    </div>
  );
}
