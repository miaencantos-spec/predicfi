import type { AppProps } from 'next/app';
import { Web3Provider } from '@/providers/web3-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <LanguageProvider>
        <Web3Provider>
          <Component {...pageProps} />
        </Web3Provider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
