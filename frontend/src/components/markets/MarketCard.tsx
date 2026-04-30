'use client';

import { useState } from "react";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "@/providers/web3-provider";
import { baseSepolia } from "thirdweb/chains";
import { ProbabilityBar } from "./ProbabilityBar";
import { OracleStatusBadge } from "./OracleStatusBadge";
import { BetModal } from "./BetModal";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketCardProps {
  address: string;
}

// Returns true only for valid 0x-prefixed 40-hex-char Ethereum addresses
function isValidAddress(addr: string): addr is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function MarketCard({ address }: MarketCardProps) {
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);

  // Guard: skip rendering entirely if the address is not a valid ETH address
  // (e.g. placeholder / seed data rows in the DB)
  if (!isValidAddress(address)) {
    return null;
  }

  const contract = getContract({
    client,
    chain: baseSepolia,
    address: address,
  });

  const { data: question } = useReadContract({
    contract,
    method: "function question() view returns (string)",
  });

  const { data: endTime } = useReadContract({
    contract,
    method: "function endTime() view returns (uint256)",
  });

  const { data: resolved } = useReadContract({
    contract,
    method: "function resolved() view returns (bool)",
  });

  const { data: totalYesShares } = useReadContract({
    contract,
    method: "function totalYesShares() view returns (uint256)",
  });

  const { data: totalNoShares } = useReadContract({
    contract,
    method: "function totalNoShares() view returns (uint256)",
  });

  const totalShares = (totalYesShares || 0n) + (totalNoShares || 0n);
  const yesPercentage = totalShares > 0n 
    ? Number((totalYesShares! * 100n) / totalShares) 
    : 50;
  const noPercentage = 100 - yesPercentage;

  const isExpired = endTime ? Number(endTime) < Date.now() / 1000 : false;
  const isClosed = (resolved as boolean) || isExpired;
  
  const endsIn = endTime ? formatDistanceToNow(Number(endTime) * 1000, { locale: es, addSuffix: true }) : '...';

  const handleBetClick = (e: React.MouseEvent, outcome: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isClosed) return;
    setSelectedOutcome(outcome);
    setIsBetModalOpen(true);
  };

  const displayQuestion = question ? (question as string).replace(/\[.*?\]\s*/g, '') : "Cargando...";

  return (
    <Link 
      href={`/market/${address}`}
      className={cn(
        "bg-white rounded-[2rem] p-6 border border-zinc-200 transition-all group relative overflow-hidden block",
        isClosed ? "opacity-80 grayscale-[0.5]" : "hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <OracleStatusBadge status={status as any} />
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded-full border border-zinc-100">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          {Number(totalShares) / 1e6} USDC
        </div>
      </div>
      
      <h4 className="text-lg font-bold text-zinc-900 mb-6 line-clamp-2 min-h-[3.5rem] group-hover:text-emerald-600 transition-colors leading-snug">
        {displayQuestion}
      </h4>
      
      <ProbabilityBar yesPercentage={yesPercentage} className="mb-8" />
      
      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <button 
          onClick={(e) => handleBetClick(e, true)}
          disabled={isClosed}
          className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 text-emerald-600 font-bold hover:bg-emerald-500 hover:text-white transition-all text-xs disabled:opacity-30 disabled:cursor-not-allowed"
        >
          SÍ ({yesPercentage}%)
        </button>
        <button 
          onClick={(e) => handleBetClick(e, false)}
          disabled={isClosed}
          className="w-full py-3 rounded-xl border border-red-500/30 bg-red-50/50 text-red-600 font-bold hover:bg-red-500 hover:text-white transition-all text-xs disabled:opacity-30 disabled:cursor-not-allowed"
        >
          NO ({noPercentage}%)
        </button>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span className="uppercase tracking-widest">
          {resolved ? 'MERCADO CERRADO' : (isExpired ? 'CERRADO (PROCESANDO IA)' : `EXPIRA ${endsIn}`)}
        </span>
        <span className="group-hover:text-emerald-600 transition-colors">DETALLES →</span>
      </div>

      <BetModal 
        isOpen={isBetModalOpen} 
        onClose={() => setIsBetModalOpen(false)} 
        marketAddress={address}
        question={question || ""}
        initialOutcome={selectedOutcome}
      />
    </Link>
  );
}
