'use client';

import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";
import { ReactNode } from 'react';
import { AuthSync } from "./AuthSync";
import { createWallet, inAppWallet } from "thirdweb/wallets";

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
  return (
    <ThirdwebProvider>
      <AuthSync />
      {children}
    </ThirdwebProvider>
  );
}
