'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/providers/web3-provider';
import { FACTORY_ADDRESS } from '@/lib/constants';
import { getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { BrainCircuit, Timer, Sparkles, ShieldCheck, AlertCircle, ArrowRight, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export default function CreateMarketPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking
  const [question, setQuestion] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ valid: boolean; reason: string; improved_question?: string } | null>(null);

  // Guard: verificar si el usuario es admin
  useEffect(() => {
    async function checkAdmin() {
      if (!account?.address) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('wallet_address', account.address.toLowerCase())
        .single();
      setIsAdmin(!!data?.is_admin);
    }
    checkAdmin();
  }, [account?.address]);

  // Loading
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Acceso denegado
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center">
          <Lock className="w-10 h-10 text-zinc-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Acceso Restringido</h1>
          <p className="text-zinc-500 font-mono text-sm">Solo los administradores pueden crear mercados.</p>
        </div>
        <Link
          href="/"
          className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }



  const validateWithAI = async (marketQuestion: string) => {
    setIsValidating(true);
    setAiFeedback(null);
    try {
      const actualDate = new Date().toISOString();
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Actúa como un moderador y editor experto de mercados de predicción. 
      
      CONTEXTO TEMPORAL CRÍTICO:
      La fecha y hora exacta actual es: ${actualDate}.
      Cualquier evento propuesto debe ser POSTERIOR a esta fecha y hora.
      
      TAREA:
      Genera una versión técnica y estructurada siguiendo este protocolo:
      [SUBJECT: evento] [METRIC: dato] [THRESHOLD: valor] [SOURCE: fuente] [TIME: hora GMT] PREGUNTA_HUMANA.
      
      Si el usuario propone algo para "hoy", asegúrate de que la sugerencia técnica use esta fecha: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} con una hora GMT coherente.
      
      Responde ÚNICAMENTE con este JSON:
      {
        "valid": boolean, 
        "improved_question": "La pregunta estructurada aquí",
        "reason": "Explicación técnica basada en la fecha de hoy"
      }`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonStr = text.match(/\{.*\}/s)?.[0] || '{"valid": false, "reason": "Error en formato de respuesta IA"}';
      const data = JSON.parse(jsonStr);
      setAiFeedback(data);
      return data;
    } catch (error: any) {
      console.error("AI Validation error:", error);
      const fallback = { 
        valid: true, 
        reason: "⚠️ Oráculo saturado (503). Procediendo con validación manual.", 
        improved_question: marketQuestion 
      };
      setAiFeedback(fallback);
      return fallback;
    } finally {
      setIsValidating(false);
    }
  };

  const applyImprovement = () => {
    if (aiFeedback?.improved_question) {
      setQuestion(aiFeedback.improved_question);
      toast.success("Sugerencia aplicada");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) return toast.error('Conecta tu wallet');
    if (!question || !endDate) return toast.error('Completa los campos');

    // 1. Verificar Red (Base Sepolia: 84532)
    if (activeChain?.id !== baseSepolia.id) {
      try {
        toast.info("Cambiando a Base Sepolia...");
        await switchChain(baseSepolia);
      } catch (err) {
        return toast.error("Por favor, cambia a la red Base Sepolia en tu billetera.");
      }
    }

    const endTime = Math.floor(new Date(endDate).getTime() / 1000);
    if (endTime <= Math.floor(Date.now() / 1000)) return toast.error('Fecha inválida');

    const aiCheck = await validateWithAI(question);
    if (!aiCheck.valid && !aiCheck.improved_question) return;

    setIsPending(true);
    try {
      const factoryContract = getContract({
        client,
        chain: baseSepolia,
        address: FACTORY_ADDRESS,
      });

      const tx = prepareContractCall({
        contract: factoryContract,
        method: "function createMarket(string _question, uint256 _endTime) returns (address)",
        params: [question, BigInt(endTime)],
      });

      const { transactionHash } = await sendTransaction({
        transaction: tx,
        account: account
      });

      toast.success('¡Mercado creado con éxito!');
      console.log("Tx Hash:", transactionHash);
      router.push('/');
    } catch (error: any) {
      console.error("Tx Error:", error);
      toast.error(`Error en transacción: ${error.message || 'Fallo desconocido'}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-8">
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
                Proponer <br />
                <span className="text-emerald-600 italic">Nuevo Mercado</span>
              </h2>
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest leading-relaxed">
                Sistema de Proposición Verificado por <span className="text-emerald-600 font-bold">Gemini AI</span>
              </p>
            </div>
            
            <Link 
              href="/admin" 
              className="group flex items-center gap-3 bg-zinc-50 border border-zinc-200 text-zinc-600 px-8 py-4 rounded-2xl hover:bg-white hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-widest">Volver a Admin</span>
            </Link>
          </div>
        </section>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <form onSubmit={handleCreate} className="space-y-10">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    ENTRADA_DE_DATOS
                  </label>
                  <textarea 
                    placeholder="Ej: ¿Sube BTC a 70k hoy?" 
                    className="w-full p-8 rounded-[2.5rem] border border-zinc-200 bg-white outline-none min-h-[220px] text-2xl font-bold text-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-zinc-200 shadow-sm"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    <Timer className="w-3.5 h-3.5 text-emerald-500" />
                    TIMESTAMP_DE_CIERRE
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-6 rounded-3xl border border-zinc-200 bg-white font-mono text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isPending || isValidating}
                  className="w-full group bg-zinc-900 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-2xl shadow-zinc-200"
                >
                  {isValidating ? "Consultando Gemini..." : isPending ? "Confirmando en Wallet..." : "CREAR MERCADO ON-CHAIN"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-24">
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 relative overflow-hidden shadow-xl shadow-zinc-100/50">
                  <div className="flex justify-between items-start mb-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-3">
                      <BrainCircuit className="w-6 h-6 animate-pulse" />
                      AI GATEKEEPER
                    </h3>
                    <div className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
                      SYS_STATUS: ONLINE
                    </div>
                  </div>

                  {!aiFeedback && (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                        <BrainCircuit className="w-8 h-8 text-zinc-200" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Esperando propuesta...</p>
                        <p className="text-[10px] text-zinc-300 italic">La IA validará la estructura y temporalidad del evento.</p>
                      </div>
                    </div>
                  )}

                  {aiFeedback && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-sm text-zinc-700 italic leading-relaxed relative">
                        <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase">VEREDICTO</div>
                        "{aiFeedback.reason}"
                      </div>
                      
                      {aiFeedback.improved_question && (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">PROPUESTA ESTRUCTURADA</label>
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl font-mono text-[11px] text-emerald-400 leading-relaxed shadow-2xl">
                              {aiFeedback.improved_question}
                            </div>
                          </div>
                          <button
                            onClick={applyImprovement}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
                          >
                            <Check className="w-4 h-4" /> APLICAR SUGERENCIA
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-8 p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">REGLAS DE PROTOCOLO</h4>
                  <ul className="space-y-3">
                    {[
                      "Eventos futuros y verificables",
                      "Fuentes de datos públicas",
                      "Sin ambigüedad en el threshold",
                      "Mínimo 24h de duración"
                    ].map((rule, i) => (
                      <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
