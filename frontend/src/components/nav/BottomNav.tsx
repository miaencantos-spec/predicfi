'use client';

import { Home, PlusCircle, History, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: Home, label: 'Inicio', href: '/' },
  { icon: History, label: 'Apuestas', href: '/portfolio' },
  { icon: PlusCircle, label: 'Crear', href: '/create', primary: true },
  { icon: Trophy, label: 'Ranking', href: '/leaderboard' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-lg border-t border-zinc-200 dark:bg-zinc-950/80 dark:border-zinc-800 pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all',
                isActive ? 'text-brand dark:text-white' : 'text-zinc-500',
                item.primary && 'scale-110 -translate-y-1'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl transition-colors',
                item.primary ? 'bg-success text-white' : (isActive ? 'bg-zinc-100 dark:bg-zinc-800' : '')
              )}>
                <Icon className={cn('w-5 h-5', item.primary && 'w-6 h-6')} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
