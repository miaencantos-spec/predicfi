import { cn } from '@/lib/utils';
import { MarketFormat } from '@/hooks/useMarketCreation';

interface MarketFormatSelectorProps {
  marketFormat: MarketFormat;
  setMarketFormat: (format: MarketFormat) => void;
}

export function MarketFormatSelector({ marketFormat, setMarketFormat }: MarketFormatSelectorProps) {
  const formats: MarketFormat[] = ['BINARY', '1X2', 'POLLA', 'MULTI', 'H2H'];
  
  return (
    <div className="bg-zinc-50 p-2 rounded-2xl flex flex-wrap gap-2 border border-zinc-200">
      {formats.map(format => (
        <button
          key={format}
          type="button"
          onClick={() => setMarketFormat(format)}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            marketFormat === format ? "bg-white shadow-sm border border-zinc-200 text-emerald-600" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          {format}
        </button>
      ))}
    </div>
  );
}
