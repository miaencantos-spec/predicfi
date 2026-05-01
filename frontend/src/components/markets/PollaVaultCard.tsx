import React from 'react';
import { Users, Trophy, ArrowRight } from 'lucide-react';
import { toast } from "sonner";
import Link from "next/link";

interface PollaVaultCardProps {
  address?: string;
  title: string;
  participants: string;
  pool: string;
  entryFee: string;
}

const PollaVaultCard: React.FC<PollaVaultCardProps> = ({
  address,
  title,
  participants,
  pool,
  entryFee
}) => {
  const handleMockClick = (e: React.MouseEvent) => {
    if (!address) {
      e.preventDefault();
      e.stopPropagation();
      toast.info("Este es un mercado de demostración (mock).", {
        description: "Prueba los 'Mercados Activos (Real)' para apostar de verdad."
      });
    }
  };

  const content = (
    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2rem] p-8 border border-indigo-500/30 shadow-xl shadow-purple-900/20 hover:shadow-2xl hover:shadow-purple-900/40 transition-all flex flex-col group relative overflow-hidden h-full">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-purple-200 uppercase tracking-widest mb-3 bg-purple-500/20 w-fit px-3 py-1 rounded-full border border-purple-400/30">
          <Trophy size={12} className="text-yellow-400" />
          <span>Pari-Mutuel Pool</span>
        </div>
        <h3 className="font-black text-white text-2xl leading-tight tracking-tight">{title}</h3>
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-col flex-1 justify-center py-4 space-y-6">
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Users size={18} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Bóveda</p>
              <p className="font-mono text-lg font-bold text-white">{participants}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest">Pozo Actual</p>
            <p className="font-mono text-2xl font-black text-yellow-400">{pool}</p>
          </div>
        </div>

        <button 
          onClick={handleMockClick}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-black text-sm uppercase tracking-widest hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 group/btn">
          {address ? 'Unirse Ahora' : `Unirse por ${entryFee}`}
          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-indigo-200">
        <span className="uppercase tracking-widest flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          {address ? 'LIVE ON CHAIN' : 'REGISTRO ABIERTO'}
        </span>
        <span className="uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">SPORTS</span>
      </div>
    </div>
  );

  return address ? (
    <Link href={`/market/${address}`} className="block h-full">
      {content}
    </Link>
  ) : content;
};

export default PollaVaultCard;
