'use client';

import { useParams, useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowLeft, Save, Trophy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

export default function VaultPredictPage() {
  const { address } = useParams();
  const account = useActiveAccount();
  const router = useRouter();
  const vaultAddress = typeof address === 'string' ? address : '';

  const [isSaving, setIsSaving] = useState(false);

  const handleSavePredictions = async () => {
    setIsSaving(true);
    // Simular guardado en Supabase en pollas_predictions
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    toast.success("Predicciones guardadas exitosamente.");
    router.push(`/market/${vaultAddress}`);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-zinc-900 mb-2">Conecta tu billetera</h1>
          <p className="text-zinc-500">Debes estar conectado para guardar tus predicciones.</p>
        </div>
      </div>
    );
  }

  // Generar datos de ejemplo para 12 grupos (A-L) de 4 equipos (48 equipos en total)
  const groups = Array.from({ length: 12 }, (_, i) => ({
    name: `Grupo ${String.fromCharCode(65 + i)}`,
    teams: [`Equipo 1`, `Equipo 2`, `Equipo 3`, `Equipo 4`]
  }));

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href={`/market/${vaultAddress}`} className="text-emerald-600 font-bold flex items-center gap-2 hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver a la Bóveda
            </Link>
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <Trophy className="w-10 h-10 text-emerald-500" /> Plantilla WC 2026
            </h1>
            <p className="text-zinc-500 font-medium mt-2">Formato 48 equipos • 12 Grupos • Ronda de 32</p>
          </div>
          <button 
            onClick={handleSavePredictions}
            disabled={isSaving}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? "Guardando..." : <><Save className="w-4 h-4" /> Guardar Mis Predicciones</>}
          </button>
        </header>

        <div className="bg-white rounded-[2rem] border border-zinc-200 p-8 shadow-sm">
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h3 className="font-bold text-emerald-800 text-sm mb-1">Reglas de Clasificación (WC 2026)</h3>
            <p className="text-xs text-emerald-700">Clasifican los 2 primeros de cada grupo (24 equipos) y los <strong>8 mejores terceros lugares</strong> para conformar la nueva Ronda de 32. Nuestro oráculo Gemini está configurado para validar automáticamente estos 8 cupos extra según los criterios oficiales de desempate.</p>
          </div>

          <h2 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-widest">Fase de Grupos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                <h3 className="font-bold text-zinc-900 mb-3 bg-white py-1 px-3 rounded-lg border border-zinc-100 inline-block text-xs uppercase tracking-widest">{group.name}</h3>
                <div className="space-y-2">
                  {group.teams.map((team, tIdx) => (
                    <div key={tIdx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-100">
                      <span className="text-sm font-semibold text-zinc-700">{group.name.charAt(group.name.length-1)}{tIdx+1}</span>
                      <div className="flex gap-2">
                        <input type="number" placeholder="Pts" className="w-12 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-center font-bold outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 opacity-50 pointer-events-none">
            <h2 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-widest">Fase Final (Ronda de 32 en adelante)</h2>
            <div className="p-10 border-2 border-dashed border-zinc-300 rounded-[2rem] flex flex-col items-center justify-center text-center">
              <p className="text-zinc-500 font-bold mb-2">Desbloqueo Automático</p>
              <p className="text-xs text-zinc-400 max-w-md">La llave de eliminación directa (Ronda de 32, Octavos, Cuartos, Semis y Final) se habilitará una vez que definas las posiciones de la Fase de Grupos y los 8 mejores terceros.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
