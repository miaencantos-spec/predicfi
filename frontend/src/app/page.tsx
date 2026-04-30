'use client';

import { useState, useEffect } from 'react';
import { MarketCard } from '@/components/markets/MarketCard';
import { cn } from '@/lib/utils';
import { TrendingUp, Users, Zap, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [activeMarkets, setActiveMarkets] = useState<any[]>([]);
  const [resolvedMarkets, setResolvedMarkets] = useState<any[]>([]);
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
        .order('created_at', { ascending: false });

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

        {/* Mercados Activos */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-zinc-50 animate-pulse rounded-[2rem] border border-zinc-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeMarkets.map((market) => (
                <MarketCard key={market.market_address} address={market.market_address} />
              ))}
              {activeMarkets.length === 0 && (
                <div className="col-span-full py-16 text-center bg-zinc-50 rounded-[2.5rem] border border-dashed border-zinc-200">
                  <p className="text-zinc-400 font-mono text-sm">No hay mercados abiertos a nuevas apuestas.</p>
                </div>
              )}
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
