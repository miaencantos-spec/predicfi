'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useMarketCreation } from '@/hooks/useMarketCreation';
import { MarketFormatSelector } from '@/components/create/MarketFormatSelector';
import { MarketFields } from '@/components/create/MarketFields';
import { AIFeedback } from '@/components/create/AIFeedback';
import { AdminRestricted } from '@/components/create/AdminRestricted';
import { MarketCreationSidebar } from '@/components/create/MarketCreationSidebar';

export default function CreateMarketPage() {
  const { isAdmin } = useAdminStatus();
  const {
    marketFormat, setMarketFormat,
    endDate, setEndDate,
    binaryData, setBinaryData,
    match1x2Data, setMatch1x2Data,
    pollaData, setPollaData,
    multiData, setMultiData,
    h2hData, setH2hData,
    isPending,
    isValidating,
    aiFeedback,
    handleCreate,
    handleUpdateMultiOption,
    addMultiOption
  } = useMarketCreation();

  useEffect(() => {
    if (isAdmin === false && marketFormat !== 'POLLA') {
      setMarketFormat('POLLA');
    }
  }, [isAdmin, marketFormat, setMarketFormat]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-8">
      <main className="container mx-auto px-4 py-16">
        <section className="mb-12 text-center md:text-left">
          <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
            <div className="h-[2px] w-8 bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold">Protocol Terminal</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-4">
                Proponer <span className="text-emerald-600 italic">{isAdmin ? 'Mercado' : 'Polla'}</span>
              </h2>
            </div>
            {isAdmin && (
              <Link href="/admin" className="group flex items-center gap-3 bg-zinc-50 border border-zinc-200 text-zinc-600 px-8 py-4 rounded-2xl hover:bg-white hover:text-emerald-600 transition-all shadow-sm">
                <span className="text-xs font-bold uppercase tracking-widest">Volver a Admin</span>
              </Link>
            )}
          </div>
        </section>

        <form onSubmit={handleCreate} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">
            <MarketFormatSelector 
              marketFormat={marketFormat} 
              setMarketFormat={setMarketFormat} 
              allowedFormats={isAdmin ? ['BINARY', '1X2', 'POLLA', 'MULTI', 'H2H'] : ['POLLA']}
            />
            
            <MarketFields 
              marketFormat={marketFormat}
              binaryData={binaryData} setBinaryData={setBinaryData}
              match1x2Data={match1x2Data} setMatch1x2Data={setMatch1x2Data}
              pollaData={pollaData} setPollaData={setPollaData}
              multiData={multiData} setMultiData={setMultiData} 
              handleUpdateMultiOption={handleUpdateMultiOption} addMultiOption={addMultiOption}
              h2hData={h2hData} setH2hData={setH2hData}
            />

            <AIFeedback isValidating={isValidating} aiFeedback={aiFeedback} />
          </div>

          <MarketCreationSidebar isPending={isPending} endDate={endDate} setEndDate={setEndDate} />
        </form>
      </main>
    </div>
  );
}
