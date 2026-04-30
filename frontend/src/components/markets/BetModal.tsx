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

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketAddress: string;
  question: string;
  initialOutcome?: boolean | null;
}

export function BetModal({ isOpen, onClose, marketAddress, question, initialOutcome = null }: BetModalProps) {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending } = useSendTransaction();
  const [amount, setAmount] = useState("");
  const [outcome, setOutcome] = useState<boolean | null>(initialOutcome);

  // Sync outcome when initialOutcome changes (modal opens)
  useEffect(() => {
    if (isOpen) setOutcome(initialOutcome);
  }, [isOpen, initialOutcome]);

  const usdcContract = getContract({
    client,
    chain: baseSepolia,
    address: USDC_ADDRESS,
  });

  const marketContract = getContract({
    client,
    chain: baseSepolia,
    address: marketAddress,
  });

  // Check allowance
  const { data: allowance } = useReadContract({
    contract: usdcContract,
    method: "function allowance(address owner, address spender) view returns (uint256)",
    params: [account?.address || "", marketAddress],
  });

  // Get user USDC balance
  const { data: balance } = useReadContract({
    contract: usdcContract,
    method: "function balanceOf(address account) view returns (uint256)",
    params: [account?.address || ""],
  });

  // Get nonce for permit
  const { data: nonce } = useReadContract({
    contract: usdcContract,
    method: "function nonces(address owner) view returns (uint256)",
    params: [account?.address || ""],
  });

  const needsPermit = !allowance || (amount && allowance < BigInt(Math.floor(parseFloat(amount) * 1e6)));

  const handleMax = () => {
    if (balance) {
      setAmount((Number(balance) / 1e6).toString());
    }
  };

  const saveBetToSupabase = async (txHash: string, isYes: boolean, amountUsdc: number) => {
    if (!account?.address) return;
    const { error } = await supabase.from('bets').insert({
      market_address: marketAddress.toLowerCase(),
      user_address: account.address.toLowerCase(),
      is_yes: isYes,
      amount: amountUsdc,
      tx_hash: txHash,
      claimed: false,
    });
    if (error) console.error('Error guardando apuesta en DB:', error.message);
  };

  const handleBet = async () => {
    if (!account) return toast.error("Conecta tu wallet");
    if (!amount || outcome === null) return toast.error("Completa los datos");

    const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e6));

    if (needsPermit) {
      try {
        toast.info("Por favor, firma el mensaje de permiso en tu wallet...");
        
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
        
        const domain = {
          name: "USDC",
          version: "2",
          chainId: BigInt(baseSepolia.id),
          verifyingContract: USDC_ADDRESS,
        } as const;

        const types = {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        } as const;

        const message = {
          owner: account.address,
          spender: marketAddress,
          value: amountWei,
          nonce: nonce || 0n,
          deadline,
        };

        const signature = await account.signTypedData({
          domain,
          types,
          primaryType: "Permit",
          message,
        });

        const r = signature.substring(0, 66) as `0x${string}`;
        const s = ("0x" + signature.substring(66, 130)) as `0x${string}`;
        let v = parseInt(signature.substring(130, 132), 16);
        if (v < 27) v += 27;

        const betWithPermitTx = prepareContractCall({
          contract: marketContract,
          method: "function buySharesWithPermit(bool _outcome, uint256 _amount, uint256 _deadline, uint8 v, bytes32 r, bytes32 s)",
          params: [outcome!, amountWei, deadline, v, r, s],
        });

        toast.info("Enviando apuesta con Permit...");
        sendTransaction(betWithPermitTx, {
          onSuccess: async (result) => {
            toast.success("¡Apuesta realizada con éxito!");
            await saveBetToSupabase(
              result.transactionHash,
              outcome!,
              parseFloat(amount)
            );
            onClose();
          },
          onError: (error) => {
            console.error(error);
            toast.error("Error al realizar la apuesta");
          },
        });

      } catch (error) {
        console.error("Permit error:", error);
        toast.error("Error al firmar el permiso");
      }
    } else {
      executeBet(amountWei);
    }
  };

  const executeBet = (amountWei: bigint) => {
    const betTx = prepareContractCall({
      contract: marketContract,
      method: "function buyShares(bool _outcome, uint256 _amount)",
      params: [outcome!, amountWei],
    });

    toast.info("Enviando apuesta...");
    sendTransaction(betTx, {
      onSuccess: async (result) => {
        toast.success("¡Apuesta realizada con éxito!");
        await saveBetToSupabase(
          result.transactionHash,
          outcome!,
          parseFloat(amount)
        );
        onClose();
      },
      onError: () => toast.error("Error al realizar la apuesta"),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Realizar Apuesta">
      <div className="space-y-6">
        <p className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">{question}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setOutcome(true)}
            className={`py-6 rounded-2xl font-black border-2 transition-all text-xl ${outcome === true ? 'border-success bg-success/10 text-success shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'border-zinc-100 dark:border-zinc-800 text-zinc-400'}`}
          >
            SÍ
          </button>
          <button 
            onClick={() => setOutcome(false)}
            className={`py-6 rounded-2xl font-black border-2 transition-all text-xl ${outcome === false ? 'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-zinc-100 dark:border-zinc-800 text-zinc-400'}`}
          >
            NO
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cantidad (USDC)</label>
            <span className="text-[10px] font-bold text-zinc-500">Saldo: {balance ? (Number(balance)/1e6).toFixed(2) : "0.00"}</span>
          </div>
          <div className="relative group">
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full p-5 pr-20 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-transparent focus:border-brand outline-none transition-all font-bold text-xl"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button 
              onClick={handleMax}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-brand hover:text-white rounded-lg text-[10px] font-bold transition-all"
            >
              MAX
            </button>
          </div>
        </div>

        <button 
          onClick={handleBet}
          disabled={isPending}
          className={`w-full py-5 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 ${needsPermit ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-brand text-white'}`}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Escribiendo en Base...
            </span>
          ) : (
            needsPermit ? "Firmar y Apostar" : "Confirmar Apuesta"
          )}
        </button>
        
        <button 
          onClick={onClose}
          className="w-full text-zinc-400 text-xs font-bold hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          CANCELAR
        </button>
      </div>
    </Modal>
  );
}
