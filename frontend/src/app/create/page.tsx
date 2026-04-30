'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/providers/web3-provider';
import { FACTORY_ADDRESS } from '@/lib/constants';
import { getContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { BrainCircuit, Timer, Sparkles, ShieldCheck, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export default function CreateMarketPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  
  const [question, setQuestion] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ valid: boolean; reason: string; improved_question?: string } | null>(null);

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
    <div className="min-h-screen bg-white text-zinc-900 pb-24 pt-20">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[2px] w-8 bg-emerald-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold">Protocol Terminal</span>
            </div>
            <h1 className="text-5xl font-bold text-zinc-900 tracking-tight">
              PROPOSICIÓN DE <span className="text-emerald-600">MERCADO</span>
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              <form onSubmit={handleCreate} className="space-y-8">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Entrada de Datos
                  </label>
                  <textarea 
                    placeholder="Ej: ¿Sube BTC a 70k hoy?" 
                    className="w-full p-8 rounded-[2.5rem] border border-zinc-200 bg-zinc-50 outline-none min-h-[180px] text-xl font-medium"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                    <Timer className="w-3 h-3 text-emerald-500" />
                    Timestamp de Cierre
                  </label>
                  <input 
                    type="datetime-local" 
                    className="w-full p-6 rounded-2xl border border-zinc-200 bg-zinc-50 font-mono text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isPending || isValidating}
                  className="w-full group bg-zinc-900 text-white py-6 rounded-[2.5rem] font-bold text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {isValidating ? "Consultando Gemini..." : isPending ? "Confirmando en Wallet..." : "Crear Mercado On-Chain"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 animate-pulse" />
                    AI GATEKEEPER
                  </h3>
                  <div className="text-[9px] font-mono text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-200">
                    SYS_TIME: {new Date().toLocaleDateString()}
                  </div>
                </div>

                {!aiFeedback && (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      <BrainCircuit className="w-5 h-5 text-zinc-300" />
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Esperando propuesta...</p>
                  </div>
                )}

                {aiFeedback && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-zinc-600 italic leading-relaxed">
                      "{aiFeedback.reason}"
                    </div>
                    {aiFeedback.improved_question && (
                      <div className="space-y-4">
                        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl font-mono text-[10px] text-emerald-700 leading-relaxed">
                          {aiFeedback.improved_question}
                        </div>
                        <button
                          onClick={applyImprovement}
                          className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-3 h-3" /> Aplicar Sugerencia
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
