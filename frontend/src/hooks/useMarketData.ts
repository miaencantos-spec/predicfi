import { useMemo } from 'react';

export interface Market {
  market_address: string;
  creator_address: string;
  question: string;
  category: string;
  ends_at: string;
  status: string;
  total_yes: number;
  total_no: number;
  resolution_reason?: string;
  resolved_at?: string;
}

export function useMarketData(market: Market | null) {
  return useMemo(() => {
    if (!market) return null;

    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const isExpired = market.ends_at ? new Date(market.ends_at).getTime() < now : false;
    const isResolved = market.status === 'resolved' || market.status === 'verified';
    const isClosed = isExpired || isResolved;

    const DISPUTE_PERIOD_MS = 24 * 60 * 60 * 1000;
    const canClaim = isResolved &&
      market.resolved_at != null &&
      now > new Date(market.resolved_at).getTime() + DISPUTE_PERIOD_MS;

    const displayQuestion = market.question ? market.question.replace(/\[.*?\]\s*/g, '') : "Cargando...";

    const format = market.question?.match(/\[FORMAT:(.*?)\]/i)?.[1] || 'BINARY';
    
    const optionsMatch = market.question?.match(/\[OPTIONS:\s*(.*?)\s*\]/i);
    const multiOptions = optionsMatch?.[1].split(',').map((opt: string) => opt.trim()) || [];

    const h2hMatch = market.question?.match(/\[H2H:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
    const match1X2 = market.question?.match(/\[1X2:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
    
    const yesLabel = h2hMatch ? h2hMatch[1] : (match1X2 ? match1X2[1] : "SÍ");
    const noLabel = h2hMatch ? h2hMatch[2] : (match1X2 ? match1X2[2] : "NO");

    return {
      isExpired,
      isResolved,
      isClosed,
      canClaim,
      displayQuestion,
      format,
      multiOptions,
      yesLabel,
      noLabel
    };
  }, [market]);
}
