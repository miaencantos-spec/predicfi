import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/providers/web3-provider';
import { FACTORY_ADDRESS, VAULT_FACTORY_ADDRESS } from '@/lib/constants';
import { getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { baseSepolia } from 'thirdweb/chains';
import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export type MarketFormat = 'BINARY' | '1X2' | 'POLLA' | 'MULTI' | 'H2H';

export function useMarketCreation() {
  const router = useRouter();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const [marketFormat, setMarketFormat] = useState<MarketFormat>('BINARY');
  const [endDate, setEndDate] = useState('');

  // Format specific states
  const [binaryData, setBinaryData] = useState({ question: '', yesLabel: 'SÍ', noLabel: 'NO' });
  const [match1x2Data, setMatch1x2Data] = useState({ matchTitle: '', homeTeam: '', awayTeam: '' });
  const [pollaData, setPollaData] = useState({ 
    type: 'TEMPLATE', 
    templateId: 'worldcup2026', 
    customLeagueName: '', 
    numTeams: '16', 
    rounds: '15', 
    referenceUrl: '', 
    vaultTitle: '', 
    groupName: '', 
    entryFee: '10', 
    maxParticipants: '15' 
  });
  const [multiData, setMultiData] = useState({ question: '', options: ['Opción A', 'Opción B', 'Opción C'] });
  const [h2hData, setH2hData] = useState({ matchTitle: '', optionA: '', optionB: '' });

  const [isPending, setIsPending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ valid: boolean; reason: string; improved_question?: string } | null>(null);

  const getFormattedQuestion = () => {
    switch (marketFormat) {
      case 'BINARY': return `[FORMAT:BINARY] ${binaryData.question}`;
      case '1X2': return `[FORMAT:1X2] [1X2: ${match1x2Data.homeTeam} vs ${match1x2Data.awayTeam}] ${match1x2Data.matchTitle}`;
      case 'POLLA': 
        const leagueName = pollaData.type === 'TEMPLATE' ? 'Plantilla Oficial' : pollaData.customLeagueName;
        return `[FORMAT:POLLA] [LEAGUE:${leagueName}] ${pollaData.vaultTitle} (${pollaData.groupName})`;
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
    } catch (error) {
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
      } catch {
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

        await sendTransaction({ transaction: tx, account });
      } else {
        const factoryContract = getContract({ client, chain: baseSepolia, address: targetFactoryAddress });

        const tx = prepareContractCall({
          contract: factoryContract,
          method: "function createMarket(string _question, uint256 _endTime) returns (address)",
          params: [finalQuestion, BigInt(endTime)],
        });

        await sendTransaction({ transaction: tx, account });
      }
      
      toast.success('¡Transacción on-chain confirmada!');

      // Obtener el address del nuevo mercado
      toast.info('Sincronizando con Supabase...');
      await new Promise(resolve => setTimeout(resolve, 4000)); // Espera para indexación

      const targetContractForRead = getContract({ client, chain: baseSepolia, address: targetFactoryAddress });
      const length = await readContract({
        contract: targetContractForRead,
        method: totalLengthMethod as "function allMarketsLength() view returns (uint256)"
      });
      
      const newMarketAddress = await readContract({
        contract: targetContractForRead,
        method: getAddressMethod as "function allMarkets(uint256) view returns (address)",
        params: [BigInt(Number(length) - 1)]
      });

      // Determinar categoría
      let category = "CRYPTO";
      if (marketFormat === '1X2') category = "SPORTS";
      if (marketFormat === 'H2H') category = "VERSUS";
      if (marketFormat === 'POLLA') category = "EVENTS";

      const { error: marketError } = await supabase
        .from('markets')
        .insert({
          market_address: (newMarketAddress as string).toLowerCase(),
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

  return {
    marketFormat, setMarketFormat,
    endDate, setEndDate,
    binaryData, setBinaryData,
    match1x2Data, setMatch1x2Data,
    pollaData, setPollaData,
    multiData, setMultiData,
    h2hData, setH2hData,
    isPending,
    isValidating,
    aiFeedback,
    handleCreate,
    handleUpdateMultiOption,
    addMultiOption
  };
}
