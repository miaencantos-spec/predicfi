'use client';

import React from 'react';
import MatchRow from '../components/markets/MatchRow';
import TradeSlip from '../components/markets/TradeSlip';
import PollaVaultCard from '../components/markets/PollaVaultCard';
import { mockMatches, pollaVaultMock } from '../lib/mockMarkets';

const SportsPage: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Main Content (Matches) */}
      <main className="flex-1 p-10">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black tracking-widest uppercase">Live Sports</span>
          </div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter">Copa Mundial ⚽</h1>
          <p className="text-zinc-500 text-lg mt-2">Predice los resultados de los mejores partidos del mundo.</p>
        </header>

        <div className="max-w-4xl">
          <div className="flex gap-3 mb-8">
            <button className="px-6 py-2.5 bg-zinc-900 rounded-full shadow-xl shadow-zinc-200 font-black text-xs text-white uppercase tracking-widest">Todos</button>
            <button className="px-6 py-2.5 bg-white border border-zinc-100 rounded-full font-black text-xs text-zinc-400 hover:text-zinc-900 transition-all uppercase tracking-widest">En vivo</button>
            <button className="px-6 py-2.5 bg-white border border-zinc-100 rounded-full font-black text-xs text-zinc-400 hover:text-zinc-900 transition-all uppercase tracking-widest">Próximos</button>
          </div>

          <div className="space-y-6">
            <div className="mb-10">
              <PollaVaultCard {...pollaVaultMock} />
            </div>

            {mockMatches.map((match, idx) => (
              <MatchRow key={idx} {...match} />
            ))}
          </div>
        </div>
      </main>

      {/* Sidebar (TradeSlip) */}
      <aside className="hidden xl:block sticky top-0 h-screen">
        <TradeSlip />
      </aside>
    </div>
  );
};

export default SportsPage;
