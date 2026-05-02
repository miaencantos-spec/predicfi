'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MarketCard } from '@/components/markets/MarketCard';
import { cn } from '@/lib/utils';
import { TrendingUp, Zap, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MatchRow from '@/components/markets/MatchRow';
import PollaVaultCard from '@/components/markets/PollaVaultCard';

export default function Home() {
  const searchParams  = useSearchParams();
  const searchQuery   = (searchParams.get('search')   || '').toLowerCase().trim();
  const categoryParam = (searchParams.get('category') || '').toLowerCase().trim();

  const [activeMarkets, setActiveMarkets] = useState<any[]>([]);
  const [resolvedMarkets, setResolvedMarkets] = useState<any[]>([]);
  const [pollaStats, setPollaStats] = useState<Record<string, { count: number; pool: number }>>({});
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

      // Misma lógica que Admin: activo = status active Y no expirado
      const active = data?.filter(m => m.status === 'active' && m.ends_at > now) || [];
      const resolved = data?.filter(m => m.status === 'resolved' || m.ends_at <= now) || [];

      setActiveMarkets(active);
      setResolvedMarkets(resolved);

      // Fetch estadísticas reales de pollas (participantes + pozo)
      const pollaAddresses = active
        .filter(m => m.question?.includes('[FORMAT:POLLA]'))
        .map(m => m.market_address?.toLowerCase())
        .filter(Boolean);

      if (pollaAddresses.length > 0) {
        const { data: bets } = await supabase
          .from('bets')
          .select('market_address, amount')
          .in('market_address', pollaAddresses);

        const stats: Record<string, { count: number; pool: number }> = {};
        for (const bet of bets || []) {
          const addr = bet.market_address?.toLowerCase();
          if (!stats[addr]) stats[addr] = { count: 0, pool: 0 };
          stats[addr].count += 1;
          stats[addr].pool += parseFloat(bet.amount) || 0;
        }
        setPollaStats(stats);
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Filtrar mercados por formato + búsqueda + categoría
  const filterAndFormat = (format: string) => {
    return activeMarkets.filter(m => {
      const q   = (typeof m.question === 'string' ? m.question : '').toLowerCase();
      const cat = (m.category || '').toLowerCase();
      const matchesFormat   = q.includes(`[format:${format.toLowerCase()}]`);
      const matchesSearch   = !searchQuery   || q.includes(searchQuery);
      const matchesCategory = !categoryParam || cat.includes(categoryParam) || q.includes(categoryParam);
      return matchesFormat && matchesSearch && matchesCategory;
    });
  };

  const binaryReal  = filterAndFormat('BINARY');
  const h2hReal     = filterAndFormat('H2H');
  const multiReal   = filterAndFormat('MULTI');
  const matchesReal = filterAndFormat('1X2');
  const pollaReal   = filterAndFormat('POLLA');

  const totalFiltered = binaryReal.length + h2hReal.length + multiReal.length + matchesReal.length + pollaReal.length;

  const EmptyState = ({ label }: { label: string }) => (
    <div className="col-span-full flex items-center justify-center py-14 border border-dashed border-zinc-200 rounded-[2rem] text-zinc-300 text-xs font-mono uppercase tracking-widest">
      Sin mercados {label} activos
    </div>
  );

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
            <StatCard icon={Zap}         label="Mercados Vivos"  value={activeMarkets.length.toString()}  color="text-yellow-600" />
            <StatCard icon={TrendingUp}  label="Volumen Total"   value="$12.5M"                           color="text-emerald-600" />
            <StatCard icon={History}     label="Resueltos"       value={resolvedMarkets.length.toString()} color="text-blue-600" />
          </div>
        </section>

        {/* Banner de filtro activo */}
        {(searchQuery || categoryParam) && (
          <div className="mb-6 flex items-center gap-3 text-sm text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">Filtrando:</span>
            {searchQuery   && <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">&quot;{searchQuery}&quot;</span>}
            {categoryParam && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 capitalize">{categoryParam}</span>}
            <span className="ml-auto text-[10px] font-mono text-zinc-400">{totalFiltered} resultado{totalFiltered !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Mercados por Formato */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-4">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Mercados Activos
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-50 animate-pulse rounded-[2rem] border border-zinc-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {/* 1. Formato 1X2 */}
              <div>
                <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-yellow-400 pl-4">
                  1. Formato 1X2 (Fútbol)
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {matchesReal.length > 0 ? matchesReal.map((market) => {
                    const teamsMatch = market.question?.match(/\[1X2:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
                    return (
                      <MatchRow
                        key={market.market_address}
                        address={market.market_address}
                        league="Liga PredicFi"
                        time={new Date(market.ends_at).toLocaleTimeString()}
                        homeTeam={teamsMatch?.[1] || 'Local'}
                        awayTeam={teamsMatch?.[2] || 'Visitante'}
                        homeColor="bg-zinc-800"
                        awayColor="bg-emerald-600"
                        homePrice="LIVE"
                        drawPrice="LIVE"
                        awayPrice="LIVE"
                      />
                    );
                  }) : <EmptyState label="1X2" />}
                </div>
              </div>

              {/* 2. Formato PollaVault */}
              <div>
                <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">
                  2. Formato PollaVault (Pari-Mutuel)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pollaReal.length > 0 ? pollaReal.map((market) => {
                    const addr = market.market_address?.toLowerCase();
                    const stats = pollaStats[addr] || { count: 0, pool: 0 };
                    return (
                      <PollaVaultCard
                        key={market.market_address}
                        address={market.market_address}
                        title={market.question?.replace(/\[.*?\]\s*/g, '') || 'Polla sin título'}
                        participants={`${stats.count} inscrito${stats.count !== 1 ? 's' : ''}`}
                        pool={`${stats.pool.toFixed(0)} USDC`}
                        entryFee="10 USDC"
                      />
                    );
                  }) : <EmptyState label="Polla" />}
                </div>
              </div>

              {/* 3. Formato Binario */}
              <div>
                <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-blue-500 pl-4">
                  3. Formato Binario Clásico (SÍ / NO)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {binaryReal.length > 0 ? binaryReal.map((market) => (
                    <MarketCard key={market.market_address} address={market.market_address} />
                  )) : <EmptyState label="Binario" />}
                </div>
              </div>

              {/* 4. Formato Multi-Nivel */}
              <div>
                <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-purple-500 pl-4">
                  4. Formato Multi-Nivel
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {multiReal.length > 0 ? multiReal.map((market) => {
                    const optionsMatch = market.question?.match(/\[OPTIONS:\s*(.*?)\s*\]/i);
                    const options = optionsMatch?.[1].split(',').map((opt: string) => ({ label: opt.trim(), chance: '??%' })) || [];
                    return (
                      <MarketCard
                        key={market.market_address}
                        address={market.market_address}
                        variant="multi"
                        options={options}
                      />
                    );
                  }) : <EmptyState label="Multi-Nivel" />}
                </div>
              </div>

              {/* 5. Formato Cara a Cara */}
              <div>
                <h4 className="text-lg font-black text-zinc-500 mb-6 uppercase tracking-widest border-l-4 border-red-500 pl-4">
                  5. Formato Cara a Cara (H2H)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {h2hReal.length > 0 ? h2hReal.map((market) => (
                    <MarketCard key={market.market_address} address={market.market_address} />
                  )) : <EmptyState label="H2H" />}
                </div>
              </div>
            </div>
          )}
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
            {resolvedMarkets.length === 0 && (
              <div className="col-span-3 text-center py-12 text-zinc-300 font-mono text-xs uppercase tracking-widest">
                Aún no hay mercados resueltos
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 hover:border-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/5 group">
      <div className={cn('p-2 rounded-xl bg-zinc-50 inline-block mb-3 transition-colors group-hover:bg-emerald-50', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-2xl font-bold text-zinc-900 font-mono">{value}</div>
      <div className="text-sm text-zinc-500 font-medium">{label}</div>
    </div>
  );
}
