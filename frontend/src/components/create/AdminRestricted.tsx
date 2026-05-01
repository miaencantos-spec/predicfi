import { Lock } from 'lucide-react';
import Link from 'next/link';

export function AdminRestricted() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center">
        <Lock className="w-10 h-10 text-zinc-400" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Acceso Restringido</h1>
        <p className="text-zinc-500 font-mono text-sm">Solo los administradores pueden crear mercados.</p>
      </div>
      <Link href="/" className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all">
        Volver al inicio
      </Link>
    </div>
  );
}
