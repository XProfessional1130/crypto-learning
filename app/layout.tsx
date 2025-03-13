import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import QueryProvider from "../lib/providers/query-provider";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import CoinDataInitializer from "./components/CoinDataInitializer";
import AppEnhancer from "./components/AppEnhancer";
import GlobalStyles from "./components/GlobalStyles";
import AuthTokenScript from "./components/AuthTokenScript";
import BackgroundElements from "./components/BackgroundElements";
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] })

// Dynamically import the DataPrefetcher to prevent server-side rendering issues
const DataPrefetcher = dynamic(() => import('./components/DataPrefetcher'), { 
  ssr: false 
});

// Split metadata according to Next.js requirements
export const metadata: Metadata = {
  title: "LearningCrypto Platform",
  description: "Learn crypto the smart way",
  icons: {
    icon: '/logos/icon.png',
    apple: '/logos/icon.png',
    shortcut: '/logos/icon.png'
  }
};

// Move viewport and themeColor to separate export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="smooth-scroll overflow-x-hidden">
      <body className={`${inter.className} h-full antialiased overflow-x-hidden`}>
        {/* Initialize providers first - they handle their own client/server logic */}
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              {/* Client components for enhancements - moved inside providers to ensure proper hydration */}
              <AppEnhancer />
              <GlobalStyles />
              <AuthTokenScript />
              <CoinDataInitializer />
              
              {/* Background elements - more isolated now */}
              <BackgroundElements />

              <div className="min-h-screen flex flex-col relative z-0 pt-20">
                <Navigation />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in scrollbar-custom">
                  {children}
                </main>
                <Footer />
              </div>
              <DataPrefetcher />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
