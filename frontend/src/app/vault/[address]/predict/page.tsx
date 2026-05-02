'use client';

import { useParams, useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowLeft, Save, Trophy, Medal, Goal } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

type MatchScore = { home: number | ''; away: number | '' };

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const getGroupMatches = (groupLetter: string) => {
  const teams = [`${groupLetter}1`, `${groupLetter}2`, `${groupLetter}3`, `${groupLetter}4`];
  return [
    { id: `${teams[0]}-vs-${teams[1]}`, home: teams[0], away: teams[1] },
    { id: `${teams[2]}-vs-${teams[3]}`, home: teams[2], away: teams[3] },
    { id: `${teams[0]}-vs-${teams[2]}`, home: teams[0], away: teams[2] },
    { id: `${teams[1]}-vs-${teams[3]}`, home: teams[1], away: teams[3] },
    { id: `${teams[0]}-vs-${teams[3]}`, home: teams[0], away: teams[3] },
    { id: `${teams[1]}-vs-${teams[2]}`, home: teams[1], away: teams[2] }
  ];
};

export default function VaultPredictPage() {
  const { address } = useParams();
  const account = useActiveAccount();
  const router = useRouter();
  const vaultAddress = typeof address === 'string' ? address : '';

  const [isSaving, setIsSaving] = useState(false);
  const [scores, setScores] = useState<Record<string, MatchScore>>({});
  const [bonus, setBonus] = useState({ champion: '', runnerUp: '', topScorer: '' });

  const handleScoreChange = (matchId: string, type: 'home' | 'away', val: string) => {
    const num = val === '' ? '' : parseInt(val);
    if (num !== '' && (isNaN(num) || num < 0)) return;
    
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: num
      }
    }));
  };

  const calculateStandings = (groupLetter: string) => {
    const teams = [`${groupLetter}1`, `${groupLetter}2`, `${groupLetter}3`, `${groupLetter}4`];
    const standings = teams.reduce((acc, t) => {
      acc[t] = { team: t, pts: 0, pld: 0, gf: 0, ga: 0, gd: 0 };
      return acc;
    }, {} as Record<string, any>);

    const matches = getGroupMatches(groupLetter);
    matches.forEach(m => {
      const matchScore = scores[m.id];
      if (matchScore && matchScore.home !== '' && matchScore.away !== '') {
        const homeGoals = matchScore.home as number;
        const awayGoals = matchScore.away as number;

        standings[m.home].pld += 1;
        standings[m.away].pld += 1;
        standings[m.home].gf += homeGoals;
        standings[m.home].ga += awayGoals;
        standings[m.away].gf += awayGoals;
        standings[m.away].ga += homeGoals;
        standings[m.home].gd = standings[m.home].gf - standings[m.home].ga;
        standings[m.away].gd = standings[m.away].gf - standings[m.away].ga;

        if (homeGoals > awayGoals) {
          standings[m.home].pts += 3;
        } else if (awayGoals > homeGoals) {
          standings[m.away].pts += 3;
        } else {
          standings[m.home].pts += 1;
          standings[m.away].pts += 1;
        }
      }
    });

    return Object.values(standings).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  const handleSavePredictions = async () => {
    setIsSaving(true);
    try {
      const payload = {
        user: account?.address,
        vault: vaultAddress,
        match_predictions: scores,
        bonus_predictions: bonus
      };
      
      console.log("Saving predictions:", payload);
      // Aquí se insertaría en Supabase `pollas_predictions`
      await new Promise(r => setTimeout(r, 1500));
      
      toast.success("Predicciones de marcadores guardadas exitosamente.");
      router.push(`/market/${vaultAddress}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar predicciones");
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 pt-8">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link href={`/market/${vaultAddress}`} className="text-emerald-600 font-bold flex items-center gap-2 hover:underline mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver a la Bóveda
            </Link>
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <Trophy className="w-10 h-10 text-emerald-500" /> Plantilla WC 2026
            </h1>
            <p className="text-zinc-500 font-medium mt-2">Formato 48 equipos • 12 Grupos • Predicción de Marcadores</p>
          </div>
          <button 
            onClick={handleSavePredictions}
            disabled={isSaving}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? "Guardando..." : <><Save className="w-4 h-4" /> Confirmar Fase de Grupos</>}
          </button>
        </header>

        <div className="bg-white rounded-[2rem] border border-zinc-200 p-6 md:p-10 shadow-sm mb-12">
          <div className="mb-10 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <h3 className="font-bold text-emerald-800 text-sm mb-2">Calculadora Automática Activada</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Ingresa los goles de cada partido. La tabla de posiciones se actualizará en tiempo real sumando 3 pts por victoria y 1 por empate. Clasifican los 2 primeros de cada grupo (24 equipos) y los <strong>8 mejores terceros lugares</strong> para conformar la nueva Ronda de 32 (Dieciseisavos). Nuestro oráculo Gemini validará tu clasificación de terceros en la siguiente fase.
            </p>
          </div>

          <h2 className="text-2xl font-black text-zinc-900 mb-8 uppercase tracking-widest">Fase de Grupos</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
            {GROUPS.map((groupLetter) => {
              const matches = getGroupMatches(groupLetter);
              const standings = calculateStandings(groupLetter);

              return (
                <div key={groupLetter} className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col xl:flex-row gap-6">
                  {/* Partidos */}
                  <div className="flex-1">
                    <h3 className="font-black text-zinc-900 mb-4 bg-white py-1.5 px-4 rounded-xl border border-zinc-100 inline-block text-xs uppercase tracking-widest shadow-sm">
                      Grupo {groupLetter}
                    </h3>
                    <div className="space-y-3">
                      {matches.map((m) => {
                        const score = scores[m.id] || { home: '', away: '' };
                        return (
                          <div key={m.id} className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-zinc-100 shadow-sm hover:border-emerald-200 transition-colors">
                            <span className="text-sm font-bold text-zinc-700 w-8 text-center">{m.home}</span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" max="20"
                                value={score.home}
                                onChange={(e) => handleScoreChange(m.id, 'home', e.target.value)}
                                className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-center font-black outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all hide-arrows" 
                              />
                              <span className="text-zinc-300 font-black">-</span>
                              <input 
                                type="number" 
                                min="0" max="20"
                                value={score.away}
                                onChange={(e) => handleScoreChange(m.id, 'away', e.target.value)}
                                className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-center font-black outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all hide-arrows" 
                              />
                            </div>
                            <span className="text-sm font-bold text-zinc-700 w-8 text-center">{m.away}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tabla de Posiciones */}
                  <div className="xl:w-[180px] shrink-0 flex flex-col justify-center">
                    <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-md">
                      <div className="grid grid-cols-4 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase p-2 text-center tracking-wider">
                        <div className="text-left">Eq</div>
                        <div>Pts</div>
                        <div>J</div>
                        <div>DG</div>
                      </div>
                      <div className="p-1">
                        {standings.map((st, i) => (
                          <div key={st.team} className={`grid grid-cols-4 text-xs p-1.5 text-center font-medium rounded-lg ${i < 2 ? 'text-emerald-400 bg-emerald-500/10' : i === 2 ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500'}`}>
                            <div className="text-left font-black">{st.team}</div>
                            <div className="font-black">{st.pts}</div>
                            <div>{st.pld}</div>
                            <div>{st.gd > 0 ? `+${st.gd}` : st.gd}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 pt-16 border-t-2 border-dashed border-zinc-200">
            <h2 className="text-2xl font-black text-zinc-900 mb-8 uppercase tracking-widest flex items-center gap-3">
              <Medal className="w-6 h-6 text-amber-500" /> Predicciones de Oro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Campeón
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Argentina" 
                  value={bonus.champion}
                  onChange={(e) => setBonus({...bonus, champion: e.target.value})}
                  className="w-full p-4 rounded-xl border border-zinc-200 font-bold focus:border-amber-500 outline-none transition-all" 
                />
              </div>
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Medal className="w-4 h-4" /> Subcampeón
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Francia" 
                  value={bonus.runnerUp}
                  onChange={(e) => setBonus({...bonus, runnerUp: e.target.value})}
                  className="w-full p-4 rounded-xl border border-zinc-200 font-bold focus:border-zinc-500 outline-none transition-all" 
                />
              </div>
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                  <Goal className="w-4 h-4" /> Goleador
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Mbappé" 
                  value={bonus.topScorer}
                  onChange={(e) => setBonus({...bonus, topScorer: e.target.value})}
                  className="w-full p-4 rounded-xl border border-zinc-200 font-bold focus:border-emerald-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="mt-12 opacity-50 pointer-events-none">
            <h2 className="text-xl font-black text-zinc-900 mb-6 uppercase tracking-widest">Fase Final (Llaves)</h2>
            <div className="p-10 border-2 border-dashed border-zinc-300 rounded-[2rem] flex flex-col items-center justify-center text-center">
              <p className="text-zinc-500 font-bold mb-2">Desbloqueo Automático (Fase 2)</p>
              <p className="text-xs text-zinc-400 max-w-md">La llave de eliminación directa (Ronda de 32, Octavos, Cuartos, Semis y Final) se habilitará una vez que termines de definir las posiciones de la Fase de Grupos y los 8 mejores terceros sean filtrados.</p>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  );
}
