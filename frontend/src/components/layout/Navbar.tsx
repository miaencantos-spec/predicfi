'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from 'next-themes';
import { Sun, Moon, Languages, Search, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/providers/web3-provider';
import { baseSepolia } from 'thirdweb/chains';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { supabase } from '@/lib/supabase';

// Base Sepolia con RPC de Alchemy
const customBaseSepolia = {
  ...baseSepolia,
  rpc: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia.base.org",
};

const USDC_BASE_SEPOLIA = {
  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`,
  name: "USD Coin",
  symbol: "USDC",
  icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=040",
};

const CATEGORIES = [
  { label: "Politics",   value: "politics"   },
  { label: "Sports",     value: "sports"     },
  { label: "Crypto",     value: "crypto"     },
  { label: "Esports",    value: "esports"    },
  { label: "Geopolitics",value: "geopolitics"},
  { label: "Tech",       value: "tech"       },
  { label: "Economy",    value: "economy"    },
];

const wallets = [
  inAppWallet({ auth: { options: ["google", "email", "apple"] } }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
];

export default function Navbar({ userEmail }: { userEmail?: string }) {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const searchParams = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const account = useActiveAccount();

  // Inicializar búsqueda desde URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const activeCategory = searchParams.get('category') || '';

  // Verificar si el usuario es Admin en Supabase
  useEffect(() => {
    async function checkAdminStatus() {
      if (account?.address) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('wallet_address', account.address.toLowerCase())
          .single();
        if (!error && data) setIsAdmin(!!data.is_admin);
      } else {
        setIsAdmin(false);
      }
    }
    checkAdminStatus();
  }, [account?.address]);

  useEffect(() => setMounted(true), []);

  // --- SEARCH: sincronizar con URL después de 400ms ---
  useEffect(() => {
    // Solo actuar si estamos en la home
    if (!pathname.startsWith('/') || pathname !== '/') return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (activeCategory) params.set('category', activeCategory);
      const query = params.toString();
      router.push(query ? `/?${query}` : '/');
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleClearSearch = () => {
    setSearch('');
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    router.push(activeCategory ? `/?category=${activeCategory}` : '/');
  };

  const handleCategoryClick = (cat: string) => {
    const isSame = activeCategory === cat;
    setSearch(''); // limpiar búsqueda al cambiar categoría
    if (isSame) {
      router.push('/');
    } else {
      router.push(`/?category=${cat}`);
    }
  };

  return (
    <nav className="w-full border-b border-zinc-200 bg-white sticky top-0 z-50 transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => { setSearch(''); }}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20">
            P
          </div>
          <span className="text-xl font-bold tracking-tighter text-zinc-900 hidden md:block">
            PredicFi
          </span>
        </Link>

        {/* Search Bar — conectada a URL */}
        <div className="flex-1 max-w-2xl relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={t.nav.search}
            className="w-full bg-zinc-100 border border-zinc-200 rounded-xl py-2 pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-zinc-900 focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClearSearch();
            }}
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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

              <Link href="/create" className={cn(
                "text-sm font-bold transition-colors hidden sm:block px-3 py-1.5 rounded-lg border",
                pathname === '/create' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              )}>
                {isAdmin ? 'Crear Mercado' : t.nav.create}
              </Link>

              {isAdmin && (
                <Link href="/admin" className={cn(
                  "text-sm font-bold transition-colors px-3 py-1 bg-zinc-900 text-white rounded-lg hover:bg-emerald-600",
                  pathname === '/admin' ? 'bg-emerald-600' : ''
                )}>
                  {t.nav.admin.toUpperCase()}
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
            chain={customBaseSepolia}
            theme="light"
            supportedChains={[customBaseSepolia]}
            wallets={wallets}
            supportedTokens={{ 84532: [USDC_BASE_SEPOLIA] }}
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

      {/* Lower Navbar — Categorías activas */}
      <div className="max-w-[1400px] mx-auto px-4 h-10 flex items-center overflow-x-auto no-scrollbar gap-6 text-[11px] border-t border-zinc-100">
        <button
          onClick={() => { setSearch(''); router.push('/'); }}
          className={cn(
            "flex items-center gap-1.5 font-bold shrink-0 transition-colors",
            !activeCategory ? "text-emerald-600" : "text-zinc-900 hover:text-emerald-600"
          )}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          {t.nav.trending}
        </button>
        <div className="h-3 w-[1px] bg-zinc-200 shrink-0" />
        <div className="flex items-center gap-5 font-medium">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat.value)}
              className={cn(
                "whitespace-nowrap transition-colors",
                activeCategory === cat.value
                  ? "text-emerald-600 font-bold underline underline-offset-4"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
