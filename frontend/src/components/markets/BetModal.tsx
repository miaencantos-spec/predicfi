'use client';

import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { client } from "@/providers/web3-provider";
import { baseSepolia } from "thirdweb/chains";
import { getContract, prepareContractCall } from "thirdweb";
import { useSendTransaction, useActiveAccount, useReadContract } from "thirdweb/react";
import { USDC_ADDRESS } from "@/lib/constants";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Check, Loader2 } from "lucide-react";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketAddress: string;
  question: string;
  initialOutcome?: boolean | null;
}

type Step = 'form' | 'approving' | 'approved' | 'betting' | 'done';

export function BetModal({ isOpen, onClose, marketAddress, question, initialOutcome = null }: BetModalProps) {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [amount, setAmount] = useState("");
  const [outcome, setOutcome] = useState<boolean | null>(initialOutcome);
  const [step, setStep] = useState<Step>('form');

  const displayQuestion = question ? (question as string).replace(/\[.*?\]\s*/g, '') : "Cargando...";

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setOutcome(initialOutcome);
      setStep('form');
      setAmount("");
    }
  }, [isOpen, initialOutcome]);

  const usdcContract = getContract({ client, chain: baseSepolia, address: USDC_ADDRESS });
  const marketContract = getContract({ client, chain: baseSepolia, address: marketAddress });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    contract: usdcContract,
    method: "function allowance(address owner, address spender) view returns (uint256)",
    params: [account?.address || "", marketAddress],
  });

  const { data: balance } = useReadContract({
    contract: usdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [account?.address || ""],
  });

  const amountWei = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
    ? BigInt(Math.floor(parseFloat(amount) * 1e6))
    : 0n;

  const hasEnoughAllowance = !!allowance && allowance >= amountWei && amountWei > 0n;

  const saveBetToSupabase = async (txHash: string) => {
    if (!account?.address) return;
    const { error } = await supabase.from('bets').insert({
      market_address: marketAddress.toLowerCase(),
      user_address: account.address.toLowerCase(),
      is_yes: outcome!,
      amount: parseFloat(amount),
      tx_hash: txHash,
      claimed: false,
    });
    if (error) console.error('Supabase error:', error.message);
  };

  // PASO 1: Approve
  const handleApprove = () => {
    if (!account) return toast.error("Conecta tu wallet");
    if (amountWei <= 0n) return toast.error("Ingresa una cantidad válida");
    if (balance && amountWei > balance) return toast.error("Saldo USDC insuficiente");

    setStep('approving');
    const tx = prepareContractCall({
      contract: usdcContract,
      method: "function approve(address spender, uint256 amount) returns (bool)",
      params: [marketAddress, amountWei],
    });

    sendTransaction(tx, {
      onSuccess: async () => {
        await refetchAllowance();
        toast.success("✅ USDC aprobado — ahora confirma tu apuesta");
        setStep('approved');
      },
      onError: (err) => {
        console.error(err);
        setStep('form');
        toast.error("Error al aprobar USDC");
      },
    });
  };

  // PASO 2: Bet (se llama solo después de approve confirmado)
  const handleBet = () => {
    if (outcome === null) return toast.error("Selecciona SÍ o NO");
    setStep('betting');

    const tx = prepareContractCall({
      contract: marketContract,
      method: "function buyShares(bool _outcome, uint256 _amount)",
      params: [outcome!, amountWei],
    });

    sendTransaction(tx, {
      onSuccess: async (result) => {
        await saveBetToSupabase(result.transactionHash);
        toast.success("🎉 ¡Apuesta realizada!");
        setStep('done');
        setTimeout(() => { setStep('form'); onClose(); }, 1500);
      },
      onError: (err) => {
        console.error(err);
        setStep('approved'); // volver a estado approved para reintentar
        toast.error("Error al realizar la apuesta");
      },
    });
  };

  const isLocked = step === 'approving' || step === 'betting';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Realizar Apuesta">
      <div className="space-y-6">
        <p className="font-bold text-lg text-zinc-900 leading-tight">{displayQuestion}</p>

        {/* SÍ / NO */}
        <div className="grid grid-cols-2 gap-4">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => setOutcome(val)}
              disabled={isLocked}
              className={`py-6 rounded-2xl font-black border-2 transition-all text-xl disabled:opacity-50 ${
                outcome === val
                  ? val ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-red-500 bg-red-50 text-red-500'
                  : 'border-zinc-100 text-zinc-300'
              }`}
            >
              {val ? 'SÍ' : 'NO'}
            </button>
          ))}
        </div>

        {/* Cantidad */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cantidad (USDC)</label>
            <span className="text-[10px] text-zinc-400">
              Saldo: <b>{balance ? (Number(balance) / 1e6).toFixed(2) : '0.00'}</b> USDC
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              disabled={isLocked || step === 'approved'}
              className="w-full p-5 pr-20 rounded-2xl border-2 border-zinc-100 focus:border-emerald-500 outline-none transition-all font-bold text-xl disabled:opacity-50 bg-transparent"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              onClick={() => balance && setAmount((Number(balance) / 1e6).toFixed(6))}
              disabled={isLocked}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-[10px] font-bold transition-all"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2">
          {/* Paso 1 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
            step === 'approved' || step === 'betting' || step === 'done'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : step === 'approving'
              ? 'bg-zinc-900 border-zinc-900 text-white'
              : 'bg-zinc-100 border-zinc-200 text-zinc-400'
          }`}>
            {(step === 'approved' || step === 'betting' || step === 'done') ? <Check className="w-3 h-3" /> : step === 'approving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>1</span>}
            Aprobar USDC
          </div>
          <div className="flex-1 h-px bg-zinc-200" />
          {/* Paso 2 */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
            step === 'done'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : step === 'betting'
              ? 'bg-zinc-900 border-zinc-900 text-white'
              : 'bg-zinc-100 border-zinc-200 text-zinc-400'
          }`}>
            {step === 'done' ? <Check className="w-3 h-3" /> : step === 'betting' ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>2</span>}
            Apostar
          </div>
        </div>

        {/* CTA Principal */}
        {/* Si ya tiene allowance, saltar directo a apostar */}
        {(step === 'form' && hasEnoughAllowance) || step === 'approved' ? (
          <button
            onClick={handleBet}
            disabled={isPending || outcome === null}
            className="w-full py-5 rounded-2xl font-black text-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-emerald-200"
          >
            {isPending && step === 'betting'
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</span>
              : '✅ Confirmar Apuesta'
            }
          </button>
        ) : step === 'form' ? (
          <button
            onClick={handleApprove}
            disabled={isPending || amountWei === 0n || outcome === null}
            className="w-full py-5 rounded-2xl font-black text-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isPending && step === 'approving'
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Aprobando USDC...</span>
              : 'Aprobar USDC'
            }
          </button>
        ) : step === 'approving' ? (
          <button disabled className="w-full py-5 rounded-2xl font-black text-lg bg-zinc-100 text-zinc-400 cursor-not-allowed flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Esperando confirmación...
          </button>
        ) : null}

        <button onClick={onClose} disabled={isLocked} className="w-full text-zinc-400 text-xs font-bold hover:text-zinc-600 transition-colors disabled:opacity-30">
          CANCELAR
        </button>
      </div>
    </Modal>
  );
}
