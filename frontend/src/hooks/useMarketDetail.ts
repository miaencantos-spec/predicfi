import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Market } from './useMarketData';

function isValidAddress(addr: string): addr is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function useMarketDetail(marketAddress: string) {
  const [market, setMarket] = useState<Market | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMarket() {
      if (!isValidAddress(marketAddress)) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('market_address', marketAddress)
          .single();

        if (error) throw error;
        setMarket(data);

        // Fetch recent bets for this market
        const { data: betsData } = await supabase
          .from('bets')
          .select('user_address, is_yes, amount, created_at')
          .eq('market_address', marketAddress)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentBets(betsData || []);
      } catch (err) {
        console.error('Error fetching market details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarket();
  }, [marketAddress]);

  return { market, isLoading, recentBets };
}
