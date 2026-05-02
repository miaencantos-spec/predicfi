import { MarketFormat } from '@/hooks/useMarketCreation';

interface MarketFieldsProps {
  marketFormat: MarketFormat;
  binaryData: { question: string; yesLabel: string; noLabel: string };
  setBinaryData: (data: { question: string; yesLabel: string; noLabel: string }) => void;
  match1x2Data: { matchTitle: string; homeTeam: string; awayTeam: string };
  setMatch1x2Data: (data: { matchTitle: string; homeTeam: string; awayTeam: string }) => void;
  pollaData: { type: string; templateId: string; customLeagueName: string; numTeams: string; rounds: string; referenceUrl: string; vaultTitle: string; groupName: string; entryFee: string; maxParticipants: string };
  setPollaData: (data: { type: string; templateId: string; customLeagueName: string; numTeams: string; rounds: string; referenceUrl: string; vaultTitle: string; groupName: string; entryFee: string; maxParticipants: string }) => void;
  multiData: { question: string; options: string[] };
  setMultiData?: (data: { question: string; options: string[] }) => void;
  handleUpdateMultiOption: (index: number, value: string) => void;
  addMultiOption: () => void;
  h2hData: { matchTitle: string; optionA: string; optionB: string };
  setH2hData: (data: { matchTitle: string; optionA: string; optionB: string }) => void;
}

export function MarketFields({
  marketFormat,
  binaryData, setBinaryData,
  match1x2Data, setMatch1x2Data,
  pollaData, setPollaData,
  multiData, handleUpdateMultiOption, addMultiOption,
  h2hData, setH2hData
}: MarketFieldsProps) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm space-y-6">
      {marketFormat === 'BINARY' && (
        <>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Pregunta Binaria</label>
            <input
              type="text" placeholder="Ej: ¿Aprobará la SEC el ETF de Solana?"
              className="w-full p-4 rounded-xl border border-zinc-200 font-medium text-zinc-900 focus:border-emerald-500 outline-none"
              value={binaryData.question} onChange={e => setBinaryData({ ...binaryData, question: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Etiqueta SÍ</label>
              <input type="text" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-green-600" value={binaryData.yesLabel} onChange={e => setBinaryData({ ...binaryData, yesLabel: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Etiqueta NO</label>
              <input type="text" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-red-600" value={binaryData.noLabel} onChange={e => setBinaryData({ ...binaryData, noLabel: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {marketFormat === '1X2' && (
        <>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Torneo o Evento</label>
            <input type="text" placeholder="Ej: Copa Mundial 2026" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={match1x2Data.matchTitle} onChange={e => setMatch1x2Data({ ...match1x2Data, matchTitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Equipo Local</label>
              <input type="text" placeholder="Ej: Colombia" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={match1x2Data.homeTeam} onChange={e => setMatch1x2Data({ ...match1x2Data, homeTeam: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Equipo Visitante</label>
              <input type="text" placeholder="Ej: Brasil" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={match1x2Data.awayTeam} onChange={e => setMatch1x2Data({ ...match1x2Data, awayTeam: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {marketFormat === 'POLLA' && (
        <div className="space-y-8">
          {/* Selector de Modo */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Modo de Creación</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setPollaData({ ...pollaData, type: 'TEMPLATE' })}
                className={`py-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${pollaData.type === 'TEMPLATE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
              >
                Plantilla Global
              </button>
              <button 
                type="button"
                onClick={() => setPollaData({ ...pollaData, type: 'CUSTOM' })}
                className={`py-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${pollaData.type === 'CUSTOM' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
              >
                Torneo Personalizado
              </button>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-6">
            {pollaData.type === 'TEMPLATE' ? (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Seleccionar Torneo Oficial</label>
                <select 
                  className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-zinc-900 bg-white"
                  value={pollaData.templateId}
                  onChange={e => setPollaData({ ...pollaData, templateId: e.target.value })}
                >
                  <option value="worldcup2026">FIFA World Cup 2026</option>
                  <option value="champions2025">UEFA Champions League 2025/26</option>
                  <option value="copaamerica2028">Copa América 2028</option>
                </select>
                <p className="mt-2 text-xs text-zinc-500">Los partidos y fechas se sincronizarán automáticamente desde la plantilla oficial.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nombre de la Liga Local</label>
                  <input type="text" placeholder="Ej: Torneo Intercolegial F-11" className="w-full p-4 rounded-xl border border-zinc-200 font-medium bg-white" value={pollaData.customLeagueName} onChange={e => setPollaData({ ...pollaData, customLeagueName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nº de Equipos</label>
                    <input type="number" placeholder="Ej: 16" className="w-full p-4 rounded-xl border border-zinc-200 font-bold bg-white" value={pollaData.numTeams} onChange={e => setPollaData({ ...pollaData, numTeams: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nº de Rondas</label>
                    <input type="number" placeholder="Ej: 15" className="w-full p-4 rounded-xl border border-zinc-200 font-bold bg-white" value={pollaData.rounds} onChange={e => setPollaData({ ...pollaData, rounds: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">URL de Referencia (Para Validación IA) - Opcional</label>
                  <input type="url" placeholder="Ej: https://resultados-amateur.com/liga-bogota" className="w-full p-4 rounded-xl border border-zinc-200 font-medium bg-white text-blue-600" value={pollaData.referenceUrl} onChange={e => setPollaData({ ...pollaData, referenceUrl: e.target.value })} />
                  <p className="mt-2 text-[10px] text-zinc-400">Si se proporciona, Gemini intentará validar los resultados automáticamente desde esta web.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Título de tu Bóveda (Polla)</label>
              <input type="text" placeholder="Ej: La Polla de la Oficina" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={pollaData.vaultTitle} onChange={e => setPollaData({ ...pollaData, vaultTitle: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nombre del Grupo / Empresa</label>
              <input type="text" placeholder="Ej: TechCorp S.A." className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={pollaData.groupName} onChange={e => setPollaData({ ...pollaData, groupName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Entry Fee (USDC)</label>
                <input type="number" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-emerald-600" value={pollaData.entryFee} onChange={e => setPollaData({ ...pollaData, entryFee: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Máx. Participantes</label>
                <input type="number" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={pollaData.maxParticipants} onChange={e => setPollaData({ ...pollaData, maxParticipants: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {marketFormat === 'MULTI' && (
        <>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Pregunta / Métrica</label>
            <input type="text" placeholder="Ej: Precio de Ethereum a fin de mes" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={multiData.question} onChange={e => setMultiData?.({ ...multiData, question: e.target.value })} />
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Opciones (Niveles)</label>
            {multiData.options.map((opt, i) => (
              <input key={i} type="text" className="w-full p-4 rounded-xl border border-zinc-200 font-medium bg-zinc-50" placeholder={`Opción ${i + 1}`} value={opt} onChange={e => handleUpdateMultiOption(i, e.target.value)} />
            ))}
            <button type="button" onClick={addMultiOption} className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">+ Añadir Opción</button>
          </div>
        </>
      )}

      {marketFormat === 'H2H' && (
        <>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Título del Duelo</label>
            <input type="text" placeholder="Ej: Batalla de Marcas: Coca vs Pepsi" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={h2hData.matchTitle} onChange={e => setH2hData({ ...h2hData, matchTitle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Opción A</label>
              <input type="text" placeholder="Ej: Coca Cola" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-zinc-800" value={h2hData.optionA} onChange={e => setH2hData({ ...h2hData, optionA: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Opción B</label>
              <input type="text" placeholder="Ej: Pepsi" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-blue-800" value={h2hData.optionB} onChange={e => setH2hData({ ...h2hData, optionB: e.target.value })} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
