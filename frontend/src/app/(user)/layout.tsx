import { ReactNode } from 'react';
import { BottomNav } from '@/components/nav/BottomNav';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
