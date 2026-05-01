'use client';

import { useState, useEffect } from 'react';
import { MarketCard } from '@/components/markets/MarketCard';
import { cn } from '@/lib/utils';
import { TrendingUp, Users, Zap, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MatchRow from '@/components/markets/MatchRow';
import PollaVaultCard from '@/components/markets/PollaVaultCard';
import { 
  mockMatches, 
  mockPollaVaults, 
  mockBinaryMarkets, 
  mockMultiLevelMarkets, 
  mockHeadToHeadMarkets 
} from '@/lib/mockMarkets';

export default function Home() {
  const [activeMarkets, setActiveMarkets] = useState<any[]>([]);
  const [resolvedMarkets, setResolvedMarkets] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarkets();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'markets' }, 
        () => fetchMarkets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMarkets() {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('ends_at', { ascending: true });

      if (error) throw error;
      
      const now = new Date().toISOString();
      
      // Separar mercados: Activos vs Cerrados/Resueltos
      const active = data?.filter(m => m.status === 'active' && m.ends_at > now) || [];
      const resolved = data?.filter(m => m.status === 'resolved' || m.ends_at <= now) || [];
      
      setActiveMarkets(active);
      setResolvedMarkets(resolved);
    } catch (err) {
      console.error('Error fetching markets:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Filtrar mercados por formato usando etiquetas en la pregunta [FORMAT:XXX]
  const getMarketsByFormat = (format: string) => {
    return activeMarkets.filter(m => m.question?.includes(`[FORMAT:${format}]`));
  };

  const binaryReal = getMarketsByFormat('BINARY');
  const h2hReal = getMarketsByFormat('H2H');
  const multiReal = getMarketsByFormat('MULTI');
  const matchesReal = getMarketsByFormat('1X2');
  const pollaReal = getMarketsByFormat('POLLA');

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20 md:pb-8">
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="mb-16 text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6">
            Predice el futuro <br />
            <span className="text-emerald-600">verificado por IA</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard icon={Zap} label="Mercados Vivos" value={activeMarkets.length.toString()} color="text-yellow-600" />
            <StatCard icon={TrendingUp} label="Volumen Total" value="$12.5M" color="text-emerald-600" />
            <StatCard icon={History} label="Resueltos" value={resolvedMarkets.length.toString()} color="text-blue-600" />
          </div>
        </section>

        {/* Galería de Formatos PredicFi */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-4">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Galería de Formatos PredicFi (Real vs Mock)
            </h3>
          </div>
          
          <div className="space-y-16">
            {/* 1. Formato 1X2 */}
            <div>
              <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-yellow-400 pl-4">1. Formato 1X2 (Mundial 2026)</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real Markets first */}
                {matchesReal.map((market) => {
                  const teamsMatch = market.question?.match(/\[1X2:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
                  return (
                    <MatchRow 
                      key={market.market_address} 
                      address={market.market_address}
                      league="Liga PredicFi"
                      time={new Date(market.ends_at).toLocaleTimeString()}
                      homeTeam={teamsMatch?.[1] || "Local"}
                      awayTeam={teamsMatch?.[2] || "Visitante"}
                      homeColor="bg-zinc-800"
                      awayColor="bg-emerald-600"
                      homePrice="LIVE"
                      drawPrice="LIVE"
                      awayPrice="LIVE"
                    />
                  );
                })}
                {/* Then Mocks */}
                {mockMatches.map((match, idx) => (
                  <MatchRow key={`match-${idx}`} {...match} />
                ))}
              </div>
            </div>

            {/* 2. Formato PollaVault */}
            <div>
              <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">2. Formato PollaVault (Pari-Mutuel)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Real Markets first */}
                {pollaReal.map((market) => (
                  <PollaVaultCard 
                    key={market.market_address} 
                    address={market.market_address}
                    title={market.question?.replace(/\[.*?\]\s*/g, '') || market.question}
                    participants="0/15"
                    pool="0 USDC"
                    entryFee="10 USDC"
                  />
                ))}
                {/* Then Mocks */}
                {mockPollaVaults.map((vault, idx) => (
                  <PollaVaultCard key={`vault-${idx}`} {...vault} />
                ))}
              </div>
            </div>

            {/* 3. Formato Binario Clásico */}
            <div>
              <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-blue-500 pl-4">3. Formato Binario Clásico (Crypto SÍ/NO)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Real Markets first */}
                {binaryReal.map((market) => (
                  <MarketCard key={market.market_address} address={market.market_address} />
                ))}
                {/* Then Mocks */}
                {mockBinaryMarkets.map((market, idx) => (
                  <MarketCard key={`binary-${idx}`} {...market} />
                ))}
              </div>
            </div>

            {/* 4. Formato Multi-Nivel */}
            <div>
              <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-purple-500 pl-4">4. Formato Multi-Nivel (Agrupadores)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Real Markets first */}
                {multiReal.map((market) => {
                  const optionsMatch = market.question?.match(/\[OPTIONS:\s*(.*?)\s*\]/i);
                  const options = optionsMatch?.[1].split(',').map(opt => ({ label: opt.trim(), chance: '??%' })) || [];
                  return (
                    <MarketCard 
                      key={market.market_address} 
                      address={market.market_address} 
                      variant="multi" 
                      options={options}
                    />
                  );
                })}
                {/* Then Mocks */}
                {mockMultiLevelMarkets.map((market, idx) => (
                  <MarketCard key={`multi-${idx}`} {...market} />
                ))}
              </div>
            </div>

            {/* 5. Formato Cara a Cara */}
            <div>
              <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-red-500 pl-4">5. Formato Cara a Cara (Eventos Directos)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Real Markets first */}
                {h2hReal.map((market) => (
                  <MarketCard key={market.market_address} address={market.market_address} />
                ))}
                {/* Then Mocks */}
                {mockHeadToHeadMarkets.map((market, idx) => (
                  <MarketCard key={`h2h-${idx}`} {...market} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Historial (Resueltos o Expirados) */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-4">
            <h3 className="text-2xl font-bold text-zinc-400 tracking-tight flex items-center gap-3">
              <History className="w-6 h-6" />
              Historial de Mercados
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-75 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {resolvedMarkets.map((market) => (
              <MarketCard key={market.market_address} address={market.market_address} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 hover:border-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
      <div className={cn("p-2 rounded-xl bg-zinc-50 inline-block mb-3 transition-colors group-hover:bg-emerald-50", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-2xl font-bold text-zinc-900 font-mono">{value}</div>
      <div className="text-sm text-zinc-500 font-medium">{label}</div>
    </div>
  );
}
