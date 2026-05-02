'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { BetModal } from '@/components/markets/BetModal';
import { useMarketDetail } from '@/hooks/useMarketDetail';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketHero } from '@/components/markets/MarketHero';
import { MarketChartPlaceholder } from '@/components/markets/MarketChartPlaceholder';
import { AIVerdictCard } from '@/components/markets/AIVerdictCard';
import { TradingTerminal } from '@/components/markets/TradingTerminal';
import { RecentActivityFeed } from '@/components/markets/RecentActivityFeed';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MarketDetailPage() {
  const { address } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const marketAddress = typeof address === 'string' ? address : '';
  
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [initialOutcome, setInitialOutcome] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { market, isLoading, recentBets } = useMarketDetail(marketAddress, refreshKey);
  const marketData = useMarketData(market);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!market || !marketData) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Mercado no encontrado</h1>
        <Link href="/" className="text-zinc-500 hover:text-emerald-600 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>
    );
  }

  const {
    displayQuestion,
    format,
    isClosed,
    isResolved,
    isExpired,
    canClaim,
    yesLabel,
    noLabel,
    multiOptions,
    isPrivate
  } = marketData;

  const hasAccess = !isPrivate || !!token;

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-8 pt-10">
      <main className="container mx-auto px-4 py-8">
        
        <MarketHero 
          displayQuestion={displayQuestion}
          format={format}
          market={market}
          isClosed={isClosed}
          isResolved={isResolved}
          isExpired={isExpired}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-8">
            <MarketChartPlaceholder format={format} isClosed={isClosed} />
            <AIVerdictCard isResolved={isResolved} market={market} format={format} />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <TradingTerminal 
              format={format}
              market={market}
              yesLabel={yesLabel}
              noLabel={noLabel}
              multiOptions={multiOptions}
              isClosed={isClosed}
              isResolved={isResolved}
              canClaim={canClaim}
              setIsBetModalOpen={setIsBetModalOpen}
              setInitialOutcome={setInitialOutcome}
              isPrivate={isPrivate}
              hasAccess={hasAccess}
            />

            <RecentActivityFeed recentBets={recentBets} />
          </div>

        </div>
      </main>
      
      <BetModal 
        isOpen={isBetModalOpen} 
        onClose={() => setIsBetModalOpen(false)} 
        marketAddress={marketAddress}
        question={market.question}
        initialOutcome={initialOutcome}
        onBetSuccess={() => setRefreshKey(k => k + 1)}
      />
    </div>
  );
}
