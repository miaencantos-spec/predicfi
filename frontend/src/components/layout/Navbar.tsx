'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from 'next-themes';
import { Sun, Moon, Languages, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/providers/web3-provider';
import { baseSepolia } from 'thirdweb/chains';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  "Politics", "Sports", "Crypto", "Esports", "Geopolitics", "Tech", "Economy"
];

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email", "apple"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
];

export default function Navbar({ userEmail }: { userEmail?: string }) {
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const account = useActiveAccount();

  // Verificar si el usuario es Admin en Supabase
  useEffect(() => {
    async function checkAdminStatus() {
      if (account?.address) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('wallet_address', account.address.toLowerCase())
          .single();
        
        if (!error && data) {
          setIsAdmin(!!data.is_admin);
        }
      } else {
        setIsAdmin(false);
      }
    }
    checkAdminStatus();
  }, [account?.address]);

  // Prevenir desajuste de hidratación
  useEffect(() => setMounted(true), []);

  return (
    <nav className="w-full border-b border-zinc-200 bg-white sticky top-0 z-50 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            P
          </div>
          <span className="text-xl font-bold tracking-tighter text-zinc-900 hidden md:block">
            PredicFi
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text"
            placeholder={t.nav.search}
            className="w-full bg-zinc-100 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-zinc-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {account && (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className={cn(
                "text-sm font-medium transition-colors hidden sm:block",
                pathname === '/dashboard' ? 'text-emerald-600' : 'text-zinc-500 hover:text-emerald-600'
              )}>
                {t.nav.dashboard}
              </Link>
              
              {/* Solo visible para el Admin (Dinámico) */}
              {isAdmin && (
                <Link href="/admin" className={cn(
                  "text-sm font-bold transition-colors px-3 py-1 bg-zinc-900 text-white rounded-lg hover:bg-emerald-600",
                  pathname === '/admin' ? 'bg-emerald-600' : ''
                )}>
                  ADMIN
                </Link>
              )}
            </div>
          )}

          {/* Theme & Language Toggles */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button 
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="p-1.5 rounded-lg hover:bg-white text-zinc-500 transition-all flex items-center gap-1 text-[10px] font-bold"
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="uppercase">{language}</span>
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg hover:bg-white text-zinc-500 transition-all"
            >
              {mounted && (theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-yellow-500" /> : <Moon className="w-3.5 h-3.5" />)}
            </button>
          </div>

          <ConnectButton 
            client={client} 
            chain={baseSepolia}
            theme="light"
            supportedChains={[baseSepolia]}
            wallets={wallets}
            supportedTokens={{
              [baseSepolia.id]: [
                {
                  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
                  name: "USD Coin",
                  symbol: "USDC",
                  icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
                },
              ],
            }}
            connectButton={{
              label: t.nav.connect,
              style: {
                backgroundColor: "#18181b",
                color: "white",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                padding: "10px 24px"
              }
            }}
          />
        </div>
      </div>

      {/* Lower Navbar */}
      <div className="max-w-[1400px] mx-auto px-4 h-10 flex items-center overflow-x-auto no-scrollbar gap-6 text-[11px] border-t border-zinc-100">
        <div className="flex items-center gap-1.5 text-zinc-900 font-bold shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          {t.nav.trending}
        </div>
        <div className="h-3 w-[1px] bg-zinc-200 shrink-0" />
        <div className="flex items-center gap-5 text-zinc-500 font-medium">
          {CATEGORIES.map((cat) => (
            <Link key={cat} href={`/?category=${cat.toLowerCase()}`} className="hover:text-zinc-900 transition-colors whitespace-nowrap">
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
