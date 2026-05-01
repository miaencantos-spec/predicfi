'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/providers/web3-provider';
import { FACTORY_ADDRESS, VAULT_FACTORY_ADDRESS } from '@/lib/constants';
import { getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { BrainCircuit, Timer, Sparkles, Lock, Check, Layers, UserPlus, Zap, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

type MarketFormat = 'BINARY' | '1X2' | 'POLLA' | 'MULTI' | 'H2H';

export default function CreateMarketPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [marketFormat, setMarketFormat] = useState<MarketFormat>('BINARY');
  const [endDate, setEndDate] = useState('');

  // Format specific states
  const [binaryData, setBinaryData] = useState({ question: '', yesLabel: 'SÍ', noLabel: 'NO' });
  const [match1x2Data, setMatch1x2Data] = useState({ matchTitle: '', homeTeam: '', awayTeam: '' });
  const [pollaData, setPollaData] = useState({ vaultTitle: '', groupName: '', entryFee: '10', maxParticipants: '15' });
  const [multiData, setMultiData] = useState({ question: '', options: ['Opción A', 'Opción B', 'Opción C'] });
  const [h2hData, setH2hData] = useState({ matchTitle: '', optionA: '', optionB: '' });

  const [isPending, setIsPending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ valid: boolean; reason: string; improved_question?: string } | null>(null);

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

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

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
        <Link href="/" className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const getFormattedQuestion = () => {
    switch (marketFormat) {
      case 'BINARY': return `[FORMAT:BINARY] ${binaryData.question}`;
      case '1X2': return `[FORMAT:1X2] [1X2: ${match1x2Data.homeTeam} vs ${match1x2Data.awayTeam}] ${match1x2Data.matchTitle}`;
      case 'POLLA': return `[FORMAT:POLLA] ${pollaData.vaultTitle} (${pollaData.groupName})`;
      case 'MULTI': return `[FORMAT:MULTI] [OPTIONS: ${multiData.options.filter(o => o.trim() !== '').join(', ')}] ${multiData.question}`;
      case 'H2H': return `[FORMAT:H2H] [H2H: ${h2hData.optionA} vs ${h2hData.optionB}] ${h2hData.matchTitle}`;
    }
  };

  const validateWithAI = async (formattedQuestion: string) => {
    setIsValidating(true);
    setAiFeedback(null);
    try {
      const actualDate = new Date().toISOString();
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Actúa como un moderador experto de mercados de predicción. 
      CONTEXTO TEMPORAL CRÍTICO: La fecha/hora exacta actual es: ${actualDate}.
      Cualquier evento propuesto debe ser POSTERIOR a esta fecha y hora.
      
      TAREA: Evalúa si la siguiente propuesta de mercado tiene sentido y está bien estructurada: "${formattedQuestion}"
      
      Responde ÚNICAMENTE con este JSON:
      {
        "valid": boolean, 
        "improved_question": "Sugerencia mejorada si aplica, o la misma",
        "reason": "Explicación breve"
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
      const fallback = { valid: false, reason: "⚠️ Oráculo saturado o inactivo. La validación falló.", improved_question: formattedQuestion };
      setAiFeedback(fallback);
      return fallback;
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return toast.error('Conecta tu wallet');
    if (!endDate) return toast.error('Selecciona una fecha de cierre');

    if (activeChain?.id !== baseSepolia.id) {
      try {
        toast.info("Cambiando a Base Sepolia...");
        await switchChain(baseSepolia);
      } catch (err) {
        return toast.error("Por favor, cambia a la red Base Sepolia en tu billetera.");
      }
    }

    const endTime = Math.floor(new Date(endDate).getTime() / 1000);
    if (endTime <= Math.floor(Date.now() / 1000)) return toast.error('Fecha de cierre inválida');

    const formattedQuestion = getFormattedQuestion();
    const aiCheck = await validateWithAI(formattedQuestion);
    if (!aiCheck.valid && !aiCheck.improved_question) return;

    const finalQuestion = aiCheck.improved_question || formattedQuestion;

    setIsPending(true);
    try {
      let transactionHash;
      let targetFactoryAddress = FACTORY_ADDRESS;
      let totalLengthMethod = "function allMarketsLength() view returns (uint256)";
      let getAddressMethod = "function allMarkets(uint256) view returns (address)";

      if (marketFormat === 'POLLA') {
        targetFactoryAddress = VAULT_FACTORY_ADDRESS;
        totalLengthMethod = "function allVaultsLength() view returns (uint256)";
        getAddressMethod = "function allVaults(uint256) view returns (address)";
        
        const vaultFactoryContract = getContract({ client, chain: baseSepolia, address: targetFactoryAddress });
        
        const tx = prepareContractCall({
          contract: vaultFactoryContract,
          method: "function createVault(uint256 _entryCost) returns (address)",
          params: [BigInt(pollaData.entryFee || 10)],
        });

        const txResult = await sendTransaction({ transaction: tx, account });
        transactionHash = txResult.transactionHash;
      } else {
        const factoryContract = getContract({ client, chain: baseSepolia, address: targetFactoryAddress });

        const tx = prepareContractCall({
          contract: factoryContract,
          method: "function createMarket(string _question, uint256 _endTime) returns (address)",
          params: [finalQuestion, BigInt(endTime)],
        });

        const txResult = await sendTransaction({ transaction: tx, account });
        transactionHash = txResult.transactionHash;
      }
      
      toast.success('¡Transacción on-chain confirmada!');

      // Obtener el address del nuevo mercado
      toast.info('Sincronizando con Supabase...');
      await new Promise(resolve => setTimeout(resolve, 4000)); // Espera para indexación

      // Usar allMarkets/allVaults y length para obtener el último mercado
      const targetContractForRead = getContract({ client, chain: baseSepolia, address: targetFactoryAddress });
      const length = await readContract({
        contract: targetContractForRead,
        method: totalLengthMethod
      });
      
      const newMarketAddress = await readContract({
        contract: targetContractForRead,
        method: getAddressMethod,
        params: [BigInt(Number(length) - 1)]
      });

      // Determinar categoría
      let category = "CRYPTO";
      if (marketFormat === '1X2') category = "SPORTS";
      if (marketFormat === 'H2H') category = "VERSUS";
      if (marketFormat === 'POLLA') category = "EVENTS";

      // Guardar en Supabase (Solo columnas que existen en la tabla markets)
      const { error: marketError } = await supabase
        .from('markets')
        .insert({
          market_address: newMarketAddress.toLowerCase(),
          creator_address: account.address.toLowerCase(),
          question: finalQuestion,
          category: category,
          ends_at: new Date(endDate).toISOString(),
          status: 'active',
          total_yes: 0,
          total_no: 0
        });

      if (marketError) {
        console.error("Supabase Market Error:", marketError);
        // No lanzamos error para no asustar al usuario si la tx on-chain fue exitosa
        toast.warning("Mercado creado on-chain pero hubo un retraso en la sincronización DB.");
      } else {
        toast.success('¡Mercado creado y sincronizado con éxito!');
      }

      router.push('/');
    } catch (error: any) {
      console.error("Creation Error:", error);
      if (error?.code === 4001 || error?.message?.includes("rejected") || error?.message?.includes("User denied")) {
        toast.info("Transacción cancelada por el usuario");
      } else {
        toast.error(`Error: ${error.message || 'Fallo desconocido'}`);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdateMultiOption = (index: number, value: string) => {
    const newOptions = [...multiData.options];
    newOptions[index] = value;
    setMultiData({ ...multiData, options: newOptions });
  };

  const addMultiOption = () => {
    setMultiData({ ...multiData, options: [...multiData.options, ''] });
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 pb-24 md:pb-8">
      <main className="container mx-auto px-4 py-16">
        <section className="mb-12 text-center md:text-left">
          <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
            <div className="h-[2px] w-8 bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-600 font-bold">Protocol Terminal</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-4">
                Proponer <span className="text-emerald-600 italic">Mercado</span>
              </h2>
            </div>
            <Link href="/admin" className="group flex items-center gap-3 bg-zinc-50 border border-zinc-200 text-zinc-600 px-8 py-4 rounded-2xl hover:bg-white hover:text-emerald-600 transition-all shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest">Volver a Admin</span>
            </Link>
          </div>
        </section>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">

            {/* Format Selector */}
            <div className="bg-zinc-50 p-2 rounded-2xl flex flex-wrap gap-2 border border-zinc-200">
              {(['BINARY', '1X2', 'POLLA', 'MULTI', 'H2H'] as MarketFormat[]).map(format => (
                <button
                  key={format}
                  type="button"
                  onClick={() => setMarketFormat(format)}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    marketFormat === format ? "bg-white shadow-sm border border-zinc-200 text-emerald-600" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {format}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="space-y-8">

              {/* Dynamic Fields based on format */}
              <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm space-y-6">

                {marketFormat === 'BINARY' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Pregunta Binaria</label>
                      <input
                        type="text" placeholder="Ej: ¿Aprobará la SEC el ETF de Solana?"
                        className="w-full p-4 rounded-xl border border-zinc-200 font-medium text-zinc-900 focus:border-emerald-500 outline-none"
                        value={binaryData.question} onChange={e => setBinaryData({ ...binaryData, question: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Etiqueta SÍ</label>
                        <input type="text" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-green-600" value={binaryData.yesLabel} onChange={e => setBinaryData({ ...binaryData, yesLabel: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Etiqueta NO</label>
                        <input type="text" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-red-600" value={binaryData.noLabel} onChange={e => setBinaryData({ ...binaryData, noLabel: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {marketFormat === '1X2' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Torneo o Evento</label>
                      <input type="text" placeholder="Ej: Copa Mundial 2026" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={match1x2Data.matchTitle} onChange={e => setMatch1x2Data({ ...match1x2Data, matchTitle: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Equipo Local</label>
                        <input type="text" placeholder="Ej: Colombia" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={match1x2Data.homeTeam} onChange={e => setMatch1x2Data({ ...match1x2Data, homeTeam: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Equipo Visitante</label>
                        <input type="text" placeholder="Ej: Brasil" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={match1x2Data.awayTeam} onChange={e => setMatch1x2Data({ ...match1x2Data, awayTeam: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {marketFormat === 'POLLA' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nombre de la Bóveda</label>
                      <input type="text" placeholder="Ej: Mundialistas Pro" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={pollaData.vaultTitle} onChange={e => setPollaData({ ...pollaData, vaultTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nombre del Grupo/Empresa</label>
                      <input type="text" placeholder="Ej: Oficina Central" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={pollaData.groupName} onChange={e => setPollaData({ ...pollaData, groupName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Entry Fee (USDC)</label>
                        <input type="number" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-blue-600" value={pollaData.entryFee} onChange={e => setPollaData({ ...pollaData, entryFee: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Máx. Participantes</label>
                        <input type="number" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={pollaData.maxParticipants} onChange={e => setPollaData({ ...pollaData, maxParticipants: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {marketFormat === 'MULTI' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Pregunta / Métrica</label>
                      <input type="text" placeholder="Ej: Precio de Ethereum a fin de mes" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={multiData.question} onChange={e => setMultiData({ ...multiData, question: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Opciones (Niveles)</label>
                      {multiData.options.map((opt, i) => (
                        <input key={i} type="text" className="w-full p-4 rounded-xl border border-zinc-200 font-medium bg-zinc-50" placeholder={`Opción ${i + 1}`} value={opt} onChange={e => handleUpdateMultiOption(i, e.target.value)} />
                      ))}
                      <button type="button" onClick={addMultiOption} className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">+ Añadir Opción</button>
                    </div>
                  </>
                )}

                {marketFormat === 'H2H' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Título del Duelo</label>
                      <input type="text" placeholder="Ej: Batalla de Marcas: Coca vs Pepsi" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={h2hData.matchTitle} onChange={e => setH2hData({ ...h2hData, matchTitle: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Opción A</label>
                        <input type="text" placeholder="Ej: Coca Cola" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-zinc-800" value={h2hData.optionA} onChange={e => setH2hData({ ...h2hData, optionA: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Opción B</label>
                        <input type="text" placeholder="Ej: Pepsi" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-blue-800" value={h2hData.optionB} onChange={e => setH2hData({ ...h2hData, optionB: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {/* Common End Date */}
                <div className="pt-4 border-t border-zinc-100">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                    <Timer className="w-3.5 h-3.5 text-emerald-500" /> TIMESTAMP DE CIERRE
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-4 rounded-xl border border-zinc-200 bg-white font-mono text-sm font-bold focus:border-emerald-500 outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || isValidating}
                className="w-full group bg-zinc-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-xl"
              >
                {isValidating ? "Validando con IA..." : isPending ? "Procesando On-Chain..." : "CREAR MERCADO ON-CHAIN"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">

              <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-lg shadow-zinc-100/50">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600 flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 animate-pulse" /> AI GATEKEEPER
                  </h3>
                </div>
                {!aiFeedback ? (
                  <div className="text-center py-8">
                    <p className="text-[10px] text-zinc-400 italic">La IA validará la propuesta antes de enviarla on-chain para evitar formatos inválidos.</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-700 italic">
                    "{aiFeedback.reason}"
                  </div>
                )}
              </div>

              <div className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> ESTRUCTURA SUPABASE</h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  Al crear este mercado, los datos estructurados se indexarán en la base de datos relacional.
                </p>
                <div className="flex gap-2">
                  <span className="text-[9px] font-bold bg-white border border-zinc-200 px-2 py-1 rounded-md text-zinc-600">markets</span>
                  <span className="text-[9px] font-bold bg-white border border-zinc-200 px-2 py-1 rounded-md text-zinc-600">market_options</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
