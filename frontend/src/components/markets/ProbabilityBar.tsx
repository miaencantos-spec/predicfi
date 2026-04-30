'use client';

import { cn } from '@/lib/utils';

interface ProbabilityBarProps {
  yesPercentage: number;
  className?: string;
}

export function ProbabilityBar({ yesPercentage, className }: ProbabilityBarProps) {
  const noPercentage = 100 - yesPercentage;

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        <span>Sí {yesPercentage}%</span>
        <span>No {noPercentage}%</span>
      </div>
      <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
        <div
          style={{ width: `${yesPercentage}%` }}
          className="h-full bg-success transition-all duration-500 ease-out relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
        </div>
        <div
          style={{ width: `${noPercentage}%` }}
          className="h-full bg-danger transition-all duration-500 ease-out relative"
        >
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/20" />
        </div>
      </div>
    </div>
  );
}
