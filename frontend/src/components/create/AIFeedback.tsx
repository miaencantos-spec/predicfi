import { Sparkles, BrainCircuit, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIFeedbackProps {
  isValidating: boolean;
  aiFeedback: { isValid: boolean; reason: string; correctedQuestion?: string } | null;
}

export function AIFeedback({ isValidating, aiFeedback }: AIFeedbackProps) {
  if (!isValidating && !aiFeedback) return null;

  return (
    <div className={cn(
      "p-8 rounded-[2rem] border transition-all duration-500",
      isValidating ? "bg-zinc-50 border-zinc-200 animate-pulse" : 
      aiFeedback?.isValid ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
    )}>
      <div className="flex items-center gap-4 mb-4">
        <div className={cn(
          "p-3 rounded-2xl",
          isValidating ? "bg-zinc-200" : aiFeedback?.isValid ? "bg-emerald-200" : "bg-red-200"
        )}>
          {isValidating ? <Sparkles className="w-6 h-6 text-zinc-400 animate-spin" /> : 
           aiFeedback?.isValid ? <Check className="w-6 h-6 text-emerald-600" /> : <BrainCircuit className="w-6 h-6 text-red-600" />}
        </div>
        <div>
          <h4 className="font-black text-xs uppercase tracking-widest text-zinc-900">
            {isValidating ? "Validando con IA..." : aiFeedback?.isValid ? "Propuesta Validada" : "Revisión Sugerida"}
          </h4>
          <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-[0.2em]">Oracle_Gatekeeper_v2.5</p>
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-700 leading-relaxed italic">
        {isValidating ? "El Oráculo está analizando la estructura y coherencia temporal del mercado..." : aiFeedback?.reason}
      </p>
      {aiFeedback?.correctedQuestion && (
        <div className="mt-4 pt-4 border-t border-zinc-200/50">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Versión Optimizada:</p>
          <p className="text-xs font-bold text-zinc-900 bg-white/50 p-3 rounded-xl border border-zinc-100">
            {aiFeedback.correctedQuestion}
          </p>
        </div>
      )}
    </div>
  );
}
