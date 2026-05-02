'use client';

import { useParams, useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { ArrowLeft, Save, Trophy, Medal, Goal, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import confetti from 'canvas-confetti';

type Team = {
  id: string;
  name: string;
  group_letter: string;
  flag_code: string;
};

type Match = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  group_letter: string;
  match_date: string;
  home?: Team;
  away?: Team;
};

type MatchScore = { home: number | ''; away: number | '' };

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function VaultPredictPage() {
  const { address } = useParams();
  const account = useActiveAccount();
  const router = useRouter();
  const vaultAddress = typeof address === 'string' ? address : '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Record<string, MatchScore>>({});
  const [bonus, setBonus] = useState({ champion: '', runnerUp: '', topScorer: '' });
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Refs for scrolling to errors
  const matchRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. Fetch Initial Data & Load Draft
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch Teams & Matches
        const [teamsRes, matchesRes] = await Promise.all([
          supabase.from('wc2026_teams').select('*').order('name'),
          supabase.from('wc2026_matches').select(`
            *,
            home:home_team_id(id, name, flag_code),
            away:away_team_id(id, name, flag_code)
          `).order('match_date')
        ]);
        
        if (teamsRes.error) throw teamsRes.error;
        if (matchesRes.error) throw matchesRes.error;

        setTeams(teamsRes.data || []);
        setMatches(matchesRes.data || []);

        // Load from LocalStorage if exists
        const localDraft = localStorage.getItem(`draft_${vaultAddress}_${account?.address}`);
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          setScores(parsed.scores || {});
          setBonus(parsed.bonus || { champion: '', runnerUp: '', topScorer: '' });
          toast.info("Borrador local cargado.");
        } else if (account?.address) {
          // Load from Supabase if not in local
          const { data: remoteDraft } = await supabase
            .from('pollas_predictions')
            .select('*')
            .eq('vault_address', vaultAddress)
            .eq('user_address', account.address)
            .maybeSingle();
          
          if (remoteDraft) {
            setScores(remoteDraft.predictions_json?.match_predictions || {});
            setBonus(remoteDraft.predictions_json?.bonus_predictions || { champion: '', runnerUp: '', topScorer: '' });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (account?.address && vaultAddress) fetchData();
  }, [vaultAddress, account?.address]);

  // 2. Auto-save to LocalStorage
  useEffect(() => {
    if (account?.address && (Object.keys(scores).length > 0 || bonus.champion)) {
      localStorage.setItem(`draft_${vaultAddress}_${account?.address}`, JSON.stringify({ scores, bonus }));
    }
  }, [scores, bonus, vaultAddress, account?.address]);

  const handleScoreChange = (matchId: string, type: 'home' | 'away', val: string) => {
    const num = val === '' ? '' : parseInt(val);
    if (num !== '' && (isNaN(num) || num < 0)) return;
    
    // Clear error for this match if it was missing
    if (missingFields.includes(matchId)) {
      setMissingFields(prev => prev.filter(id => id !== matchId));
    }

    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { home: '', away: '' },
        [type]: num
      }
    }));
  };

  const calculateStandings = (groupLetter: string) => {
    const groupTeams = teams.filter(t => t.group_letter === groupLetter);
    const standings = groupTeams.reduce((acc, t) => {
      acc[t.id] = { id: t.id, team: t.name, flag: t.flag_code, pts: 0, pld: 0, gf: 0, ga: 0, gd: 0 };
      return acc;
    }, {} as Record<string, any>);

    const groupMatches = matches.filter(m => m.group_letter === groupLetter);
    groupMatches.forEach(m => {
      const matchScore = scores[m.id];
      if (matchScore && matchScore.home !== '' && matchScore.away !== '') {
        const homeGoals = matchScore.home as number;
        const awayGoals = matchScore.away as number;

        if (standings[m.home_team_id] && standings[m.away_team_id]) {
          standings[m.home_team_id].pld += 1;
          standings[m.away_team_id].pld += 1;
          standings[m.home_team_id].gf += homeGoals;
          standings[m.home_team_id].ga += awayGoals;
          standings[m.away_team_id].gf += awayGoals;
          standings[m.away_team_id].ga += homeGoals;
          standings[m.home_team_id].gd = standings[m.home_team_id].gf - standings[m.home_team_id].ga;
          standings[m.away_team_id].gd = standings[m.away_team_id].gf - standings[m.away_team_id].ga;

          if (homeGoals > awayGoals) {
            standings[m.home_team_id].pts += 3;
          } else if (awayGoals > homeGoals) {
            standings[m.away_team_id].pts += 3;
          } else {
            standings[m.home_team_id].pts += 1;
            standings[m.away_team_id].pts += 1;
          }
        }
      }
    });

    return Object.values(standings).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  };

  const validate = () => {
    const missing: string[] = [];
    
    // Check all matches
    matches.forEach(m => {
      const s = scores[m.id];
      if (!s || s.home === '' || s.away === '') {
        missing.push(m.id);
      }
    });

    // Check bonus
    if (!bonus.champion) missing.push('bonus-champion');
    if (!bonus.runnerUp) missing.push('bonus-runnerup');
    if (!bonus.topScorer) missing.push('bonus-topscorer');

    setMissingFields(missing);

    if (missing.length > 0) {
      const firstMissingId = missing[0];
      const element = matchRefs.current[firstMissingId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast.error(`Faltan ${missing.length} predicciones por completar.`);
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!account) return;
    setIsDraftSaving(true);
    try {
      const { error } = await supabase.from('pollas_predictions').upsert({
        vault_address: vaultAddress,
        user_address: account.address,
        predictions_json: {
          match_predictions: scores,
          bonus_predictions: bonus,
          is_draft: true
        }
      }, { onConflict: 'vault_address,user_address' });

      if (error) throw error;
      toast.success("Borrador guardado en la nube.");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar borrador");
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleSavePredictions = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('pollas_predictions').upsert({
        vault_address: vaultAddress,
        user_address: account?.address,
        predictions_json: {
          match_predictions: scores,
          bonus_predictions: bonus,
          is_draft: false
        }
      }, { onConflict: 'vault_address,user_address' });

      if (error) throw error;
      
      // 🎉 Trigger Celebration Confetti!
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      localStorage.removeItem(`draft_${vaultAddress}_${account?.address}`);
      setShowSuccessModal(true);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);

    } catch (error) {
      console.error(error);
      toast.error("Error al enviar predicciones finales.");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-black text-zinc-900">Cargando partidos oficiales...</h2>
        <p className="text-zinc-500">Sincronizando fixture del Mundial 2026</p>
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
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveDraft}
              disabled={isDraftSaving || isSaving}
              className="px-6 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-bold text-xs hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
            >
              {isDraftSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Borrador
            </button>
            <button 
              onClick={handleSavePredictions}
              disabled={isSaving || isDraftSaving}
              className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Predicción Final"}
            </button>
          </div>
        </header>

        <div className="bg-white rounded-[2rem] border border-zinc-200 p-6 md:p-10 shadow-sm mb-12">
          <div className="mb-10 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4">
            <div className="bg-emerald-500 p-2 rounded-xl text-white mt-1">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800 text-sm mb-1">Calculadora Automática Activada</h3>
              <p className="text-xs text-emerald-700 leading-relaxed max-w-3xl">
                Ingresa los goles de cada partido. La tabla de posiciones se actualizará en tiempo real. Para habilitar la Fase Final, debes completar los <strong>72 partidos</strong> de la fase de grupos. Tu progreso se guarda automáticamente.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-zinc-900 mb-8 uppercase tracking-widest">Fase de Grupos</h2>
          
          {matches.length === 0 ? (
            <div className="p-20 text-center bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-300">
              <p className="text-zinc-500 font-bold">No se encontraron partidos cargados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
              {GROUPS.map((groupLetter) => {
                const groupMatches = matches.filter(m => m.group_letter === groupLetter);
                const standings = calculateStandings(groupLetter);

                if (groupMatches.length === 0) return null;

                return (
                  <div key={groupLetter} className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col xl:flex-row gap-6">
                    {/* Partidos */}
                    <div className="flex-1">
                      <h3 className="font-black text-zinc-900 mb-4 bg-white py-1.5 px-4 rounded-xl border border-zinc-100 inline-block text-xs uppercase tracking-widest shadow-sm">
                        Grupo {groupLetter}
                      </h3>
                      <div className="space-y-3">
                        {groupMatches.map((m) => {
                          const score = scores[m.id] || { home: '', away: '' };
                          const isMissing = missingFields.includes(m.id);

                          return (
                            <div 
                              key={m.id} 
                              ref={el => { matchRefs.current[m.id] = el }}
                              className={`flex items-center justify-between bg-white p-2.5 rounded-2xl border transition-all ${isMissing ? 'border-red-500 bg-red-50 shadow-md animate-pulse' : 'border-zinc-100 shadow-sm hover:border-emerald-200'}`}
                            >
                              <div className="flex items-center gap-2 w-[120px]">
                                <img src={`https://flagcdn.com/w40/${m.home?.flag_code.toLowerCase()}.png`} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                                <span className="text-[10px] font-black text-zinc-700 truncate uppercase">{m.home?.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  min="0" max="20"
                                  value={score.home}
                                  onChange={(e) => handleScoreChange(m.id, 'home', e.target.value)}
                                  className={`w-10 h-10 bg-zinc-50 border rounded-xl text-sm text-center font-black outline-none transition-all hide-arrows ${isMissing && score.home === '' ? 'border-red-400 bg-red-100' : 'border-zinc-200 focus:border-emerald-500 focus:bg-emerald-50'}`} 
                                />
                                <span className="text-zinc-300 font-black">-</span>
                                <input 
                                  type="number" 
                                  min="0" max="20"
                                  value={score.away}
                                  onChange={(e) => handleScoreChange(m.id, 'away', e.target.value)}
                                  className={`w-10 h-10 bg-zinc-50 border rounded-xl text-sm text-center font-black outline-none transition-all hide-arrows ${isMissing && score.away === '' ? 'border-red-400 bg-red-100' : 'border-zinc-200 focus:border-emerald-500 focus:bg-emerald-50'}`} 
                                />
                              </div>
                              <div className="flex items-center gap-2 w-[120px] justify-end">
                                <span className="text-[10px] font-black text-zinc-700 truncate uppercase text-right">{m.away?.name}</span>
                                <img src={`https://flagcdn.com/w40/${m.away?.flag_code.toLowerCase()}.png`} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                              </div>
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
                            <div key={st.id} className={`grid grid-cols-4 text-[10px] p-1.5 text-center font-medium rounded-lg ${i < 2 ? 'text-emerald-400 bg-emerald-500/10' : i === 2 ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500'}`}>
                              <div className="text-left font-black flex items-center gap-1 truncate">
                                <img src={`https://flagcdn.com/w40/${st.flag.toLowerCase()}.png`} alt="" className="w-3 h-2 object-cover rounded-px" />
                                {st.team.substring(0, 3).toUpperCase()}
                              </div>
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
          )}

          <div className="mt-16 pt-16 border-t-2 border-dashed border-zinc-200">
            <h2 className="text-2xl font-black text-zinc-900 mb-8 uppercase tracking-widest flex items-center gap-3">
              <Medal className="w-6 h-6 text-amber-500" /> Predicciones de Oro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                ref={el => { matchRefs.current['bonus-champion'] = el }}
                className={`p-6 rounded-3xl border transition-all ${missingFields.includes('bonus-champion') ? 'border-red-500 bg-red-50' : 'bg-zinc-50 border-zinc-200'}`}
              >
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
              <div 
                ref={el => { matchRefs.current['bonus-runnerup'] = el }}
                className={`p-6 rounded-3xl border transition-all ${missingFields.includes('bonus-runnerup') ? 'border-red-500 bg-red-50' : 'bg-zinc-50 border-zinc-200'}`}
              >
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
              <div 
                ref={el => { matchRefs.current['bonus-topscorer'] = el }}
                className={`p-6 rounded-3xl border transition-all ${missingFields.includes('bonus-topscorer') ? 'border-red-500 bg-red-50' : 'bg-zinc-50 border-zinc-200'}`}
              >
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

      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        title="¡Misión Completada!"
      >
        <div className="text-center py-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-lg shadow-emerald-100">
            <Trophy className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight uppercase">¡ÉPICO!</h2>
          <p className="text-zinc-600 font-bold text-xl leading-relaxed">
            Has completado la predicción de la <span className="text-emerald-600">Fase de Grupos</span> con éxito. 🏆
          </p>
          <div className="mt-10 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-[0.2em]">Sincronizando con el Dashboard...</p>
            <div className="w-full h-1 bg-zinc-200 rounded-full mt-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-emerald-500 animate-progress origin-left" style={{ animationDuration: '5s' }} />
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-8 w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
          >
            Ir al Panel de Control
          </button>
        </div>
      </Modal>
      
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
