'use client';

import { useState } from 'react';
import { Menu, X, LayoutDashboard, Compass, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "@/providers/web3-provider";
import { baseSepolia } from "thirdweb/chains";
import { cn } from '@/lib/utils';

export function TopBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const account = useActiveAccount();

  const navLinks = [
    { href: '/', label: 'Explorar', icon: Compass },
    ...(account ? [{ href: '/dashboard', label: 'Mis Jugadas', icon: LayoutDashboard }] : []),
    { href: '/docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-zinc-900">
            PREDIC<span className="text-emerald-600">FI</span>
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "text-sm font-bold tracking-widest uppercase transition-all hover:text-emerald-600",
                pathname === link.href ? "text-emerald-600" : "text-zinc-500"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ConnectButton 
              client={client} 
              chain={baseSepolia}
              theme="light"
              connectButton={{
                className: "!bg-zinc-900 !text-white !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest !px-6 !py-3 hover:!bg-emerald-600 transition-all shadow-lg shadow-zinc-900/10",
                label: "Conectar"
              }}
            />
          </div>

          {/* MOBILE MENU TRIGGER */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* MOBILE OVERLAY MENU */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-zinc-200 backdrop-blur-2xl animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col p-4 gap-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all",
                  pathname === link.href ? "bg-emerald-50 text-emerald-600" : "text-zinc-500 hover:bg-zinc-50"
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-zinc-100 sm:hidden">
              <ConnectButton 
                client={client} 
                chain={baseSepolia}
                theme="light"
                connectButton={{
                  className: "!w-full !bg-zinc-900 !text-white !rounded-xl !text-xs !font-black !uppercase !tracking-widest !py-4",
                  label: "Conectar Wallet"
                }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
