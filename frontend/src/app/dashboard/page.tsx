'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount, useReadContract, useSendTransaction } from 'thirdweb/react';
import { getContract, prepareContractCall } from 'thirdweb';
import { client } from '@/providers/web3-provider';
import { baseSepolia } from 'thirdweb/chains';
import { USDC_ADDRESS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ExternalLink, Trophy, Clock, Wallet, ArrowRight, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  const [bets, setBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read USDC Balance
  const usdcContract = getContract({
    client,
    chain: baseSepolia,
    address: USDC_ADDRESS,
  });

  const { data: balance } = useReadContract({
    contract: usdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [account?.address || ""],
  });

  useEffect(() => {
    if (account?.address) {
      fetchUserBets();
    }
  }, [account?.address]);

  async function fetchUserBets() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bets')
        .select(`
          *,
          markets (
            question,
            status,
            outcome,
            resolution_reason
          )
        `)
        .eq('user_address', account?.address?.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBets(data || []);
    } catch (err) {
      console.error('Error fetching bets:', err);
      toast.error('Error al cargar tus apuestas');
    } finally {
      setIsLoading(false);
    }
  }

  const handleClaim = async (marketAddress: string) => {
    if (!account) return;

    const marketContract = getContract({
      client,
      chain: baseSepolia,
      address: marketAddress,
    });

    const tx = prepareContractCall({
      contract: marketContract,
      method: "function claim()",
    });

    toast.info("Iniciando reclamo de ganancias...");
    sendTransaction(tx, {
      onSuccess: async () => {
        toast.success("¡Ganancias reclamadas con éxito!");
        fetchUserBets();
      },
      onError: (err) => {
        console.error(err);
        toast.error("Error al reclamar. ¿Quizás ya reclamaste o no ganaste?");
      }
    });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20 md:pb-8">
      <main className="container mx-auto px-4 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[2px] w-8 bg-emerald-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold">Terminal de Usuario</span>
            </div>
            <h1 className="text-5xl font-bold text-zinc-900 mb-2">
              DASHBOARD
            </h1>
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Wallet: {account?.address ? `${account.address.slice(0,6)}...${account.address.slice(-4)}` : 'No conectado'}</p>
          </div>
          
          <Link 
            href="/create" 
            className="group flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-zinc-200"
          >
            <span className="text-xs font-mono uppercase tracking-widest group-hover:text-white">Proponer Mercado</span>
            <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={Wallet} 
            label="Balance USDC" 
            value={balance ? (Number(balance) / 1e6).toFixed(2) : "0.00"} 
            color="text-emerald-600" 
          />
          <StatCard 
            icon={Trophy} 
            label="Predicciones" 
            value={bets.length.toString()} 
            color="text-blue-600" 
          />
          <StatCard 
            icon={Clock} 
            label="En Curso" 
            value={bets.filter(b => b.markets.status === 'active').length.toString()} 
            color="text-orange-600" 
          />
        </div>

        {/* Bets List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">Historial de Operaciones</h3>
            <div className="h-[1px] flex-1 mx-6 bg-zinc-100" />
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-50 animate-pulse rounded-[2rem] border border-zinc-100" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {bets.map((bet) => {
                const isResolved = bet.markets.status === 'resolved' || bet.markets.status === 'verified';
                const isWinner = isResolved && bet.is_yes === bet.markets.outcome;
                
                return (
                  <div key={bet.id} className="bg-white p-8 rounded-[2rem] border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={cn(
                          "text-[9px] font-mono font-bold uppercase px-3 py-1 rounded-full border",
                          bet.is_yes 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-red-50 text-red-600 border-red-100"
                        )}>
                          Predicción: {bet.is_yes ? "SÍ" : "NO"}
                        </span>
                        <span className={cn(
                          "text-[9px] font-mono font-bold uppercase px-3 py-1 rounded-full border",
                          isResolved 
                            ? "bg-zinc-100 text-zinc-500 border-zinc-200" 
                            : "bg-blue-50 text-blue-600 border-blue-100 animate-pulse"
                        )}>
                          {isResolved ? "COMPLETADO" : "EN MERCADO"}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">
                        {bet.markets.question.replace(/\[.*?\]\s*/g, '')}
                      </h4>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">
                        <span>Apostado: {bet.amount} USDC</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200" />
                        <span>{new Date(bet.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {isResolved && isWinner && !bet.claimed && (
                        <button 
                          onClick={() => handleClaim(bet.market_address)}
                          className="bg-emerald-600 text-white font-bold text-[10px] tracking-widest uppercase px-8 py-3 rounded-full shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all transform active:scale-95 flex items-center gap-2"
                        >
                          <Trophy className="w-3 h-3" />
                          RECLAMAR
                        </button>
                      )}
                      
                      {isResolved && !isWinner && (
                        <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-mono uppercase tracking-widest border border-zinc-200 px-6 py-3 rounded-full bg-zinc-50">
                          Perdida
                        </div>
                      )}

                      {isResolved && isWinner && bet.claimed && (
                        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-mono uppercase tracking-widest border border-emerald-200 px-6 py-3 rounded-full bg-emerald-50">
                          Liquidado
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link 
                          href={`/market/${bet.market_address}`}
                          className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-emerald-600 border border-zinc-100 transition-all"
                          title="Ver Mercado"
                        >
                          <BrainCircuit className="w-4 h-4" />
                        </Link>
                        <a 
                          href={`https://sepolia.basescan.org/tx/${bet.tx_hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-3 bg-zinc-50 rounded-xl text-zinc-400 hover:text-emerald-600 border border-zinc-100 transition-all"
                          title="Ver Transacción"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {bets.length === 0 && (
                <div className="text-center py-24 bg-zinc-50 rounded-[3rem] border border-dashed border-zinc-200">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 shadow-sm">
                    <Clock className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest">No hay actividad registrada en este terminal</p>
                  <Link href="/" className="text-emerald-600 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mt-6 inline-block hover:underline">
                    &gt; Acceder a Mercados
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 relative overflow-hidden group hover:border-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform group-hover:opacity-10">
        <Icon className="w-20 h-20 text-zinc-900" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("p-1.5 rounded-lg bg-zinc-50 border border-zinc-100", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">{label}</span>
      </div>
      <div className="text-4xl font-bold text-zinc-900 font-mono">{value}</div>
    </div>
  );
}
