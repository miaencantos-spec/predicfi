'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { getContract, prepareContractCall } from 'thirdweb';
import { client } from '@/providers/web3-provider';
import { baseSepolia } from 'thirdweb/chains';
import { FACTORY_ADDRESS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { 
  Zap, 
  ShieldAlert, 
  BarChart3, 
  Users, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const account = useActiveAccount();
  const router = useRouter();
  
  // Declarar estados primero para evitar ReferenceError
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = cargando
  const [isLoading, setIsLoading] = useState(true);
  const [markets, setMarkets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalMarkets: 0,
    activeMarkets: 0,
    pendingModeration: 0,
    totalVolume: 0,
    disputedMarkets: 0
  });

  // Verificación de Seguridad Dinámica
  useEffect(() => {
    async function verifyAdmin() {
      if (account?.address) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('wallet_address', account.address.toLowerCase())
          .single();
        
        if (error || !data?.is_admin) {
          toast.error("Acceso denegado: No tienes permisos de administrador");
          router.push('/');
        } else {
          setIsAdmin(true);
        }
      } else if (!account && !isLoading) {
        router.push('/');
      }
    }
    
    if (!isLoading) {
      verifyAdmin();
    }
  }, [account, isLoading, router]);

  const factoryContract = getContract({
    client,
    chain: baseSepolia,
    address: FACTORY_ADDRESS,
  });

  const { mutate: sendTransaction } = useSendTransaction();

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMarkets(data || []);
      
      const pending = data.filter(m => m.status === 'pending_moderation');
      const disputed = data.filter(m => m.status === 'resolved' && (new Date().getTime() - new Date(m.resolved_at).getTime() < 24 * 60 * 60 * 1000));

      setStats({
        totalMarkets: data.length,
        activeMarkets: data.filter(m => m.status === 'active').length,
        pendingModeration: pending.length,
        totalVolume: data.reduce((acc, m) => acc + (parseFloat(m.volume) || 0), 0),
        disputedMarkets: disputed.length
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleModeration = async (marketId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('markets')
        .update({ status: approve ? 'active' : 'rejected' })
        .eq('id', marketId);

      if (error) throw error;
      
      toast.success(approve ? 'Mercado aprobado' : 'Mercado rechazado');
      fetchAdminData();
    } catch (err) {
      toast.error('Error al procesar moderación');
    }
  };

  const correctMarket = async (marketAddress: string, newOutcome: boolean) => {
    const tx = prepareContractCall({
      contract: factoryContract,
      method: "function correctMarket(address _market, bool _newOutcome)",
      params: [marketAddress as `0x${string}`, newOutcome],
    });

    toast.info("Iniciando Corrección Manual (Missing Link)...");
    sendTransaction(tx, {
      onSuccess: () => toast.success("Resultado del mercado corregido en blockchain"),
      onError: (err) => toast.error("Fallo en la transacción de corrección")
    });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-20 md:pb-8">
      <main className="container mx-auto px-4 py-16">
        
        {/* Hero Section - Matched with Home */}
        <section className="mb-16 text-center md:text-left">
          <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
            <div className="h-[2px] w-8 bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold">Protocol Terminal</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-4">
                Administración <br />
                <span className="text-emerald-600 italic">del Sistema</span>
              </h2>
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Protocol Control System v1.1</p>
            </div>
            <button 
              onClick={fetchAdminData}
              className="flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all shadow-xl active:scale-95"
            >
              <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              SINCRONIZAR DATOS
            </button>
          </div>
        </section>

        {/* Stats Grid - Standardized with Home style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <AdminStatCard icon={BarChart3} label="VOLUMEN TOTAL" value={`$${stats.totalVolume.toFixed(2)}`} color="text-emerald-600" />
          <AdminStatCard icon={Zap} label="MERCADOS ACTIVOS" value={stats.activeMarkets.toString()} color="text-yellow-600" />
          <AdminStatCard icon={AlertTriangle} label="PENDIENTES MOD" value={stats.pendingModeration.toString()} color="text-amber-600" />
          <AdminStatCard icon={ShieldAlert} label="EN DISPUTA" value={stats.disputedMarkets.toString()} color="text-red-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content: Mercado Management */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-emerald-500" />
                  Market_Inventory
                </h3>
              </div>

              <div className="divide-y divide-zinc-100">
                {markets.map((market) => (
                  <div key={market.id} className="p-8 hover:bg-zinc-50/30 transition-all group">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider",
                            market.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            market.status === 'pending_moderation' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-zinc-100 text-zinc-400 border-zinc-200"
                          )}>
                            {(market.status || 'unknown').toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-300">ID: {market.id?.slice(0,8) || 'N/A'}</span>
                        </div>
                        <h4 className="text-lg font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors leading-tight">
                          {market.question}
                        </h4>
                      </div>

                      <div className="flex gap-3">
                        {market.status === 'pending_moderation' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleModeration(market.id, false)}
                              className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-2xl hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                            <button 
                              onClick={() => handleModeration(market.id, true)}
                              className="p-3 bg-white border border-zinc-200 text-zinc-400 rounded-2xl hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                          </div>
                        )}
                        
                        {market.status === 'resolved' && (
                          <button 
                            onClick={() => correctMarket(market.market_address, !market.resolution_result)}
                            className="px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-2xl text-[10px] font-bold hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            OVERRIDE_IA
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Treasury & Emergency */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Treasury */}
            <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart3 className="w-24 h-24 text-zinc-900" />
              </div>
              
              <div className="relative z-10 space-y-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Global_Treasury</h3>
                <div className="space-y-2">
                  <p className="text-5xl font-black tracking-tighter italic text-zinc-900">$1,420.50</p>
                  <p className="text-[11px] font-mono text-emerald-600 font-bold uppercase tracking-widest">Available_Revenue</p>
                </div>
                <button className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 group">
                  Withdraw_Fees
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Protocol Security */}
            <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 space-y-8 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Protocol_Security</h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                The Kill Switch is a last-resort measure to halt all operations during a critical incident.
              </p>
              <button className="w-full py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95">
                Execute_Kill_Switch
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

function AdminStatCard({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-white border border-zinc-200 p-10 rounded-[2.5rem] hover:border-emerald-500 transition-all group shadow-sm hover:shadow-xl hover:shadow-zinc-100">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
          <Icon className="w-6 h-6 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-tighter">{label}</span>
      </div>
      <div className="text-4xl font-black text-zinc-900 tracking-tight italic">{value}</div>
      <div className="mt-4 h-1 w-12 bg-zinc-100 rounded-full group-hover:w-full group-hover:bg-emerald-500 transition-all duration-500" />
    </div>
  );
}
