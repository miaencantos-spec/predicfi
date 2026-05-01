import { cn } from '@/lib/utils';

interface Bet {
  user_address: string;
  is_yes: boolean;
  amount: number;
  created_at: string;
}

interface RecentActivityFeedProps {
  recentBets: Bet[];
}

export function RecentActivityFeed({ recentBets }: RecentActivityFeedProps) {
  return (
    <div className="bg-zinc-50/50 border border-zinc-100 p-8 rounded-[2.5rem]">
      <h4 className="text-[10px] font-black text-zinc-400 uppercase mb-6 tracking-[0.3em]">Live_Feed_Activity</h4>
      <div className="space-y-4">
        {recentBets.length === 0 ? (
          <p className="text-[10px] font-mono text-zinc-300 text-center py-6 italic uppercase tracking-tighter">No hay actividad reciente</p>
        ) : (
          recentBets.map((bet, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] font-mono py-3 border-b border-zinc-200/50 last:border-0">
              <span className="text-zinc-500 font-bold uppercase tracking-tighter">
                {bet.user_address ? `${bet.user_address.slice(0, 4)}...${bet.user_address.slice(-4)}` : '0x???'}
              </span>
              <span className={cn("font-black tracking-tighter", bet.is_yes ? "text-emerald-600" : "text-red-500")}>
                {bet.is_yes ? 'B_YES' : 'B_NO'}
              </span>
              <span className="text-zinc-900 font-black italic">${Number(bet.amount || 0).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
