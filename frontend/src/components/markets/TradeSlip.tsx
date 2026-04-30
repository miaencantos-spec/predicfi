import React, { useState } from 'react';
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { client } from "@/providers/web3-provider";
import { baseSepolia } from "thirdweb/chains";
import { parseUnits } from "viem";

interface TradeSlipProps {
  marketAddress?: string;
  marketTitle?: string;
}

const TradeSlip: React.FC<TradeSlipProps> = ({ 
  marketAddress = "0x0000000000000000000000000000000000000000",
  marketTitle = "Argentina vs México"
}) => {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<boolean>(true);
  const [amount, setAmount] = useState('');
  const account = useActiveAccount();

  const quickAmounts = ['1', '5', '10', '100'];

  const marketContract = getContract({
    client,
    chain: baseSepolia,
    address: marketAddress,
  });

  return (
    <div className="bg-white h-full min-h-[600px] w-full max-w-[400px] shadow-2xl border-l border-zinc-100 flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-zinc-50">
        <h3 className="text-2xl font-black text-zinc-900 leading-tight">{marketTitle}</h3>
        <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Copa Mundial</span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-zinc-400">Final de Grupo</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-6 gap-2">
        <button 
          onClick={() => setTab('buy')}
          className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${tab === 'buy' ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
        >
          Buy
        </button>
        <button 
          onClick={() => setTab('sell')}
          className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${tab === 'sell' ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
        >
          Sell
        </button>
      </div>

      {/* Binary Selection */}
      <div className="px-6 flex gap-3 mb-8">
        <button 
          onClick={() => setOutcome(true)}
          className={`flex-1 py-6 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${outcome ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-zinc-50 border-transparent text-zinc-400'}`}
        >
          <span className={`${outcome ? 'text-emerald-600' : ''} font-black text-2xl italic tracking-tighter`}>Yes 71¢</span>
        </button>
        <button 
          onClick={() => setOutcome(false)}
          className={`flex-1 py-6 rounded-[2rem] border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${!outcome ? 'bg-red-50 border-red-500 shadow-lg shadow-red-100' : 'bg-zinc-50 border-transparent text-zinc-400'}`}
        >
          <span className={`${!outcome ? 'text-red-600' : ''} font-black text-2xl italic tracking-tighter`}>No 30¢</span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="px-6 mb-8">
        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Amount to trade</label>
        <div className="relative group">
            <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-3xl p-6 text-3xl font-mono font-black text-zinc-900 focus:ring-0 focus:border-zinc-900 transition-all placeholder:text-zinc-200"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-zinc-300 tracking-tighter text-xl">USDC</span>
        </div>
      </div>

      {/* Quick Amounts */}
      <div className="px-6 grid grid-cols-4 gap-2 mb-10">
        {quickAmounts.map((q) => (
          <button 
            key={q}
            onClick={() => setAmount(q)}
            className="py-3 rounded-xl border border-zinc-100 text-zinc-500 font-black text-xs hover:border-zinc-900 hover:text-zinc-900 transition-all font-mono"
          >
            +${q}
          </button>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 mt-auto pb-10">
        <TransactionButton
          transaction={() => {
            if (!amount || isNaN(Number(amount))) throw new Error("Monto inválido");
            return prepareContractCall({
              contract: marketContract,
              method: "function buyShares(bool _outcome, uint256 _amount)",
              params: [outcome, parseUnits(amount, 6).toBigInt()],
            });
          }}
          onTransactionConfirmed={() => {
            alert("Predicción realizada con éxito!");
            setAmount('');
          }}
          onError={(error) => {
            console.error(error);
            alert("Error al realizar la predicción");
          }}
          className="!w-full !py-6 !bg-emerald-500 !text-white !rounded-[2rem] !font-black !text-2xl !shadow-2xl !shadow-emerald-200 hover:!bg-emerald-600 active:!scale-95 !transition-all !uppercase !tracking-tighter !border-none"
        >
          PLACE TRADE
        </TransactionButton>
        <p className="text-[10px] text-center text-zinc-400 mt-4 font-black uppercase tracking-widest">
          Gasless experience via USDC Permit enabled
        </p>
      </div>
    </div>
  );
};

export default TradeSlip;
