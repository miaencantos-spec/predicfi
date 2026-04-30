import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Database, ShieldAlert, ArrowLeft, Terminal } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-700">
      {/* Admin Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-zinc-200 px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-zinc-900">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <span className="tracking-tighter uppercase text-sm font-mono">Control_Center</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-2 px-4 py-6 font-mono text-xs">
          <Link href="/admin" className="flex items-center gap-3 rounded-xl px-4 py-3 text-emerald-600 bg-emerald-50 border border-emerald-200 transition-all">
            <LayoutDashboard className="h-4 w-4" />
            OVERVIEW
          </Link>
          <Link href="/admin/moderation" className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all">
            <Database className="h-4 w-4" />
            MODERATION_QUEUE
          </Link>
          <Link href="/admin/emergency" className="flex items-center gap-3 rounded-xl px-4 py-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all">
            <ShieldAlert className="h-4 w-4" />
            EMERGENCY_ZONE
          </Link>
        </nav>
        <div className="border-t border-zinc-200 p-6">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-400 hover:text-zinc-900 transition-colors group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Exit_Terminal
          </Link>
        </div>
      </aside>

      {/* Admin Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-400">System Core Operating</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[9px] font-mono font-bold text-emerald-600 uppercase tracking-widest">
              Root_Auth
            </div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-tighter">ID: 0x9592...7E</span>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
