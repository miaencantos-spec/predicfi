import React from 'react';
import { MarketCard } from '../components/markets/MarketCard';
import { mockProMarkets } from '../lib/mockMarkets';

const ProMarketsPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-zinc-50 p-12">
      <header className="max-w-7xl mx-auto mb-16">
        <div className="flex items-center gap-4 mb-3">
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black tracking-widest uppercase">Pro Prediction Engine</span>
        </div>
        <h1 className="text-6xl font-black text-zinc-900 mb-4 tracking-tighter italic">Crypto & Mundiales 🌍</h1>
        <p className="text-zinc-500 text-xl max-w-2xl leading-relaxed">Alta precisión, baja latencia y liquidación garantizada por IA.</p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {mockProMarkets.map((market, idx) => (
          <MarketCard key={idx} {...market} />
        ))}
      </div>

      {/* Stats rápidas al final */}
      <div className="max-w-7xl mx-auto mt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
            { label: "Volumen 24h", value: "$5.2M", color: "text-emerald-500" },
            { label: "Mercados Activos", value: "128", color: "text-zinc-900" },
            { label: "Predicciones IA", value: "1.2k", color: "text-blue-500" },
            { label: "Usuarios Pro", value: "450", color: "text-purple-500" }
        ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 group-hover:text-zinc-600 transition-colors">{stat.label}</p>
                <p className={`text-4xl font-black font-mono tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ProMarketsPage;
