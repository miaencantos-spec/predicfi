'use client';

import React, { useState } from 'react';
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "@/providers/web3-provider";
import { baseSepolia } from "thirdweb/chains";
import { TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MarketCardProps {
  // Real data prop
  address?: string;
  // Mock/Manual props
  variant?: 'classic' | 'multi';
  title?: string;
  icon?: string;
  chance?: string;
  volume?: string;
  category?: string;
  options?: { label: string; chance: string }[];
  yesLabel?: string;
  noLabel?: string;
  customYesStyle?: string;
  customNoStyle?: string;
}

function isValidAddress(addr: string): addr is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export function MarketCard({ 
  address, 
  variant = 'classic', 
  title: manualTitle, 
  icon, 
  chance: manualChance, 
  volume: manualVolume, 
  category: manualCategory, 
  options,
  yesLabel,
  noLabel,
  customYesStyle,
  customNoStyle
}: MarketCardProps) {
  
  // 1. Data Fetching (Only if address is provided)
  const isRealMarket = !!(address && isValidAddress(address));
  
  const contract = getContract({
    client,
    chain: baseSepolia,
    address: isRealMarket ? address : "0x0000000000000000000000000000000000000000",
  });

  const { data: question } = useReadContract({
    contract,
    method: "function question() view returns (string)",
    queryOptions: { enabled: isRealMarket }
  });

  const { data: endTime } = useReadContract({
    contract,
    method: "function endTime() view returns (uint256)",
    queryOptions: { enabled: isRealMarket }
  });

  const { data: resolved } = useReadContract({
    contract,
    method: "function resolved() view returns (bool)",
    queryOptions: { enabled: isRealMarket }
  });

  const { data: totalYesShares } = useReadContract({
    contract,
    method: "function totalYesShares() view returns (uint256)",
    queryOptions: { enabled: isRealMarket }
  });

  const { data: totalNoShares } = useReadContract({
    contract,
    method: "function totalNoShares() view returns (uint256)",
    queryOptions: { enabled: isRealMarket }
  });

  // 2. Derive Values
  const displayTitle = isRealMarket ? (question as string || "Cargando...") : manualTitle;
  // Limpiar etiquetas como [SUBJECT:XXX], [FORMAT:XXX], etc.
  const cleanTitle = displayTitle?.replace(/\[.*?\]\s*/g, '');
  
  const totalShares = (totalYesShares || 0n) + (totalNoShares || 0n);
  const yesProb = totalShares > 0n 
    ? Number((totalYesShares! * 100n) / totalShares) 
    : 50;
  
  const displayChance = isRealMarket ? `${yesProb}%` : manualChance;
  const displayVolume = isRealMarket ? `${(Number(totalShares) / 1e6).toFixed(2)} USDC` : manualVolume;
  const displayCategory = isRealMarket ? 'GENERAL' : manualCategory;

  const isExpired = endTime ? Number(endTime) < Date.now() / 1000 : false;
  const isClosed = (resolved as boolean) || isExpired;
  const endsIn = endTime ? formatDistanceToNow(Number(endTime) * 1000, { locale: es, addSuffix: true }) : '';

  // Detectar labels personalizados para H2H
  const h2hMatch = displayTitle?.match(/\[H2H:\s*(.*?)\s*vs\s*(.*?)\s*\]/i);
  const derivedYesLabel = h2hMatch ? h2hMatch[1] : yesLabel;
  const derivedNoLabel = h2hMatch ? h2hMatch[2] : noLabel;

  // Detectar icono por sujeto
  const subjectMatch = displayTitle?.match(/\[SUBJECT:\s*(.*?)\s*\]/i);
  const derivedIcon = icon || (subjectMatch ? (subjectMatch[1].includes('BTC') ? '₿' : (subjectMatch[1].includes('ETH') ? '⟠' : (subjectMatch[1].includes('SOL') ? '◎' : '🎯'))) : '🎯');

  const handleButtonClick = (e: React.MouseEvent, outcome: boolean) => {
    if (!isRealMarket) {
      e.preventDefault();
      e.stopPropagation();
      toast.info("Este es un mercado de demostración (mock).", {
        description: "Prueba los 'Mercados Activos (Real)' para apostar de verdad."
      });
    }
  };

  // 3. Render
  if (variant === 'classic') {
    const cardContent = (
      <div className={cn(
        "bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col h-full group",
        isClosed && "opacity-80 grayscale-[0.5]"
      )}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-2xl shadow-inner border border-zinc-100 group-hover:scale-110 transition-transform">
            {derivedIcon}
          </div>
          <h3 className="font-black text-zinc-900 text-lg leading-snug flex-1 tracking-tight line-clamp-2">
            {cleanTitle}
          </h3>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center py-6 flex-1">
          <div className="relative w-32 h-32 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-zinc-50"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="351.8"
                strokeDashoffset={351.8 - (351.8 * parseInt(displayChance || '50')) / 100}
                className="text-emerald-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-zinc-900 font-mono tracking-tighter">{displayChance}</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Chance</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <button 
              onClick={(e) => handleButtonClick(e, true)}
              disabled={isClosed} 
              className={cn("py-4 rounded-2xl font-black text-sm uppercase tracking-widest border transition-all shadow-lg disabled:opacity-30 px-2 line-clamp-1", customYesStyle || "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white shadow-emerald-50")}
            >
              {derivedYesLabel || "Yes"}
            </button>
            <button 
              onClick={(e) => handleButtonClick(e, false)}
              disabled={isClosed} 
              className={cn("py-4 rounded-2xl font-black text-sm uppercase tracking-widest border transition-all shadow-lg disabled:opacity-30 px-2 line-clamp-1", customNoStyle || "bg-red-50 text-red-600 border-red-100 hover:bg-red-500 hover:text-white shadow-red-50")}
            >
              {derivedNoLabel || "No"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-[10px] font-black text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-50 text-red-500 px-2 py-1 rounded-md">
                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="uppercase tracking-widest">{resolved ? 'CERRADO' : 'LIVE'}</span>
            </div>
            <span className="uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded-md">{displayCategory}</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-zinc-500">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>{displayVolume}</span>
          </div>
        </div>
        
        {isRealMarket && (
          <div className="mt-4 pt-4 border-t border-zinc-50 text-[10px] uppercase tracking-widest text-zinc-300 group-hover:text-emerald-500 transition-colors flex justify-between items-center">
            <span>{resolved ? 'MERCADO RESUELTO' : (isExpired ? 'PROCESANDO IA' : `EXPIRA ${endsIn}`)}</span>
            <ArrowRight size={12} />
          </div>
        )}
      </div>
    );

    return isRealMarket ? (
      <Link href={`/market/${address}`} className="block h-full">
        {cardContent}
      </Link>
    ) : cardContent;
  }

  // Multi-variant
  const multiContent = (
    <div className="bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col group h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 bg-emerald-50 w-fit px-3 py-1 rounded-full">
          <Activity size={12} />
          <span>Multi-Level Market</span>
        </div>
        <h3 className="font-black text-zinc-900 text-2xl leading-tight tracking-tight">{cleanTitle}</h3>
      </div>

      {/* Body */}
      <div className="space-y-4">
        {options?.map((opt, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-500/5 transition-all group/row">
            <span className="font-black text-zinc-700 text-sm tracking-tight">{opt.label}</span>
            <div className="flex items-center gap-6">
              <span className="text-lg font-black text-zinc-900 font-mono tracking-tighter">{opt.chance}</span>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => handleButtonClick(e, true)}
                  className="w-12 h-12 rounded-xl bg-white border border-zinc-200 text-emerald-600 font-black text-xs hover:bg-emerald-500 hover:text-white hover:border-emerald-600 transition-all shadow-sm"
                >
                  Y
                </button>
                <button 
                  onClick={(e) => handleButtonClick(e, false)}
                  className="w-12 h-12 rounded-xl bg-white border border-zinc-200 text-red-600 font-black text-xs hover:bg-red-500 hover:text-white hover:border-red-600 transition-all shadow-sm"
                >
                  N
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between text-[10px] font-black text-zinc-400">
        <div className="flex items-center gap-2 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-full">
            {displayCategory}
        </div>
        <div className="flex items-center gap-1 font-mono text-zinc-500">
          <TrendingUp size={14} className="text-emerald-500" />
          <span>{displayVolume}</span>
        </div>
      </div>
      
      {isRealMarket && (
        <div className="mt-4 pt-4 border-t border-zinc-50 text-[10px] uppercase tracking-widest text-zinc-300 group-hover:text-emerald-500 transition-colors flex justify-between items-center">
          <span>{resolved ? 'MERCADO RESUELTO' : (isExpired ? 'PROCESANDO IA' : `EXPIRA ${endsIn}`)}</span>
          <ArrowRight size={12} />
        </div>
      )}
    </div>
  );

  return isRealMarket ? (
    <Link href={`/market/${address}`} className="block h-full">
      {multiContent}
    </Link>
  ) : multiContent;
}
