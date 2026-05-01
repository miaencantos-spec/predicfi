'use client';

import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";
import { ReactNode, useState } from 'react';
import { AuthSync } from "./AuthSync";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Reemplazar con el Client ID de Thirdweb Dashboard
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

export const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "email", "apple"],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
];

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        <AuthSync />
        {children}
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}
