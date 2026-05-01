import React from 'react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface MatchRowProps {
  address?: string;
  league: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeColor: string;
  awayColor: string;
  homePrice: string;
  drawPrice: string;
  awayPrice: string;
  homeButtonColor?: string;
  awayButtonColor?: string;
}

const MatchRow: React.FC<MatchRowProps> = ({
  address,
  league,
  time,
  homeTeam,
  awayTeam,
  homeColor,
  awayColor,
  homePrice,
  drawPrice,
  awayPrice,
  homeButtonColor,
  awayButtonColor,
}) => {
  const handleMockClick = (e: React.MouseEvent) => {
    if (!address) {
      e.preventDefault();
      e.stopPropagation();
      toast.info("Este es un mercado de demostración (mock).", {
        description: "Prueba los 'Mercados Activos (Real)' para apostar de verdad."
      });
    }
  };

  const content = (
    <div className="bg-white rounded-[2rem] border border-zinc-200 p-6 mb-4 shadow-sm hover:shadow-md transition-all group">
      <div className="text-[10px] font-black tracking-widest text-zinc-400 mb-4 flex justify-between uppercase">
        <span>{league}</span>
        <span className="font-mono">{time}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Equipos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full ${homeColor} border-2 border-zinc-100 flex-shrink-0 shadow-inner`} />
            <span className="font-black text-zinc-900 text-xl tracking-tight">{homeTeam}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full ${awayColor} border-2 border-zinc-100 flex-shrink-0 shadow-inner`} />
            <span className="font-black text-zinc-900 text-xl tracking-tight">{awayTeam}</span>
          </div>
        </div>

        {/* Botones 1X2 */}
        <div className="flex gap-3 h-14">
          <button 
            onClick={handleMockClick}
            className={cn(
            "flex-1 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-bold flex flex-col items-center justify-center transition-all group/btn",
            homeButtonColor ? `hover:${homeButtonColor} hover:text-white hover:border-transparent` : "hover:bg-emerald-500 hover:text-white hover:border-emerald-600"
          )}>
            <span className="text-[10px] opacity-60 font-black mb-0.5">1</span>
            <span className="font-mono">{homePrice}</span>
          </button>
          <button 
            onClick={handleMockClick}
            className="flex-1 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-500 font-bold flex flex-col items-center justify-center hover:bg-zinc-200 transition-all">
            <span className="text-[10px] opacity-60 font-black mb-0.5">X</span>
            <span className="font-mono">{drawPrice}</span>
          </button>
          <button 
            onClick={handleMockClick}
            className={cn(
            "flex-1 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-bold flex flex-col items-center justify-center transition-all group/btn",
            awayButtonColor ? `hover:${awayButtonColor} hover:text-white hover:border-transparent` : "hover:bg-red-500 hover:text-white hover:border-red-600"
          )}>
            <span className="text-[10px] opacity-60 font-black mb-0.5">2</span>
            <span className="font-mono">{awayPrice}</span>
          </button>
        </div>
      </div>
      
      {address && (
        <div className="mt-4 pt-4 border-t border-zinc-50 flex justify-end">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 group-hover:underline">Operar en vivo →</span>
        </div>
      )}
    </div>
  );

  return address ? (
    <Link href={`/market/${address}`} className="block">
      {content}
    </Link>
  ) : content;
};

export default MatchRow;
