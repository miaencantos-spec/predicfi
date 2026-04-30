import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/web3-provider";
import { Toaster } from "sonner";
import Navbar from "@/components/layout/Navbar";
import { ThemeProvider } from "@/providers/theme-provider";
import { LanguageProvider } from "@/providers/LanguageProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PredicFi | AI-Powered Prediction Markets",
  description: "Mercados de predicción inteligentes en Base, verificados por Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            <Web3Provider>
              <Navbar />
              {children}
              <Toaster position="bottom-right" />
            </Web3Provider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
