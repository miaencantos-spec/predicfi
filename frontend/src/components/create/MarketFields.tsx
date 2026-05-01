import { MarketFormat } from '@/hooks/useMarketCreation';

interface MarketFieldsProps {
  marketFormat: MarketFormat;
  binaryData: { question: string; yesLabel: string; noLabel: string };
  setBinaryData: (data: { question: string; yesLabel: string; noLabel: string }) => void;
  match1x2Data: { matchTitle: string; homeTeam: string; awayTeam: string };
  setMatch1x2Data: (data: { matchTitle: string; homeTeam: string; awayTeam: string }) => void;
  pollaData: { vaultTitle: string; groupName: string; entryFee: string; maxParticipants: string };
  setPollaData: (data: { vaultTitle: string; groupName: string; entryFee: string; maxParticipants: string }) => void;
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
        <>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nombre de la Bóveda</label>
            <input type="text" placeholder="Ej: Mundialistas Pro" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={pollaData.vaultTitle} onChange={e => setPollaData({ ...pollaData, vaultTitle: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Nombre del Grupo/Empresa</label>
            <input type="text" placeholder="Ej: Oficina Central" className="w-full p-4 rounded-xl border border-zinc-200 font-medium" value={pollaData.groupName} onChange={e => setPollaData({ ...pollaData, groupName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Entry Fee (USDC)</label>
              <input type="number" className="w-full p-4 rounded-xl border border-zinc-200 font-bold text-blue-600" value={pollaData.entryFee} onChange={e => setPollaData({ ...pollaData, entryFee: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Máx. Participantes</label>
              <input type="number" className="w-full p-4 rounded-xl border border-zinc-200 font-bold" value={pollaData.maxParticipants} onChange={e => setPollaData({ ...pollaData, maxParticipants: e.target.value })} />
            </div>
          </div>
        </>
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
