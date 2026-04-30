'use client';

import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";
import { ReactNode } from 'react';
import { AuthSync } from "./AuthSync";

// Reemplazar con el Client ID de Thirdweb Dashboard
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <AuthSync />
      {children}
    </ThirdwebProvider>
  );
}
