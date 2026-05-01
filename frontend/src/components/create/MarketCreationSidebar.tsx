import { BrainCircuit, Timer, Sparkles, Layers, UserPlus, Zap, Crosshair } from 'lucide-react';

interface MarketCreationSidebarProps {
  isPending: boolean;
  endDate: string;
  setEndDate: (date: string) => void;
}

export function MarketCreationSidebar({ isPending, endDate, setEndDate }: MarketCreationSidebarProps) {
  return (
    <div className="lg:col-span-5 space-y-8">
      <div className="bg-zinc-900 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-100 sticky top-8">
        <h3 className="text-xs font-black mb-8 text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Zap className="w-4 h-4 fill-emerald-500" /> Parámetros Globales
        </h3>
        
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Fecha y Hora de Cierre (Local)</label>
            <div className="relative group">
              <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="datetime-local"
                className="w-full bg-zinc-800 border-none p-5 pl-12 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <BrainCircuit className="w-5 h-5 text-emerald-500 mt-1" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Oracle Auto-Validation</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">El mercado será validado automáticamente por el Oráculo IA antes de ser desplegado on-chain.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Layers className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Multi-Chain Deployment</p>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Despliegue nativo en Base Sepolia con indexación inmediata en Supabase.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-900/20"
          >
            {isPending ? "Confirmando en Wallet..." : "Desplegar Mercado"}
          </button>
          
          <p className="text-[9px] text-center text-zinc-500 font-bold uppercase tracking-widest">
            Al desplegar, firmas una transacción on-chain
          </p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 p-8 rounded-[2.5rem]">
        <h4 className="text-[10px] font-black text-zinc-400 uppercase mb-6 tracking-[0.3em]">Protocol_Rules</h4>
        <ul className="space-y-4">
          {[
            { icon: UserPlus, text: "Admin-only market creation", color: "text-zinc-400" },
            { icon: Crosshair, text: "Verified event resolution", color: "text-zinc-400" },
            { icon: Sparkles, text: "AI-enhanced market clarity", color: "text-zinc-400" }
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <item.icon className={cn("w-4 h-4", item.color)} />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
