import "./globals.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import QueryProvider from "../lib/providers/query-provider";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import CoinDataInitializer from "./components/CoinDataInitializer";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "LearningCrypto Platform",
  description: "Learn crypto the smart way",
  icons: {
    icon: '/logos/icon.png',
    apple: '/logos/icon.png',
    shortcut: '/logos/icon.png'
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Check for URL hash with auth tokens
            if (typeof window !== 'undefined') {
              const hash = window.location.hash;
              if (hash && hash.includes('access_token')) {
                console.log('Found access_token in URL hash (layout)');
              }
            }
          `
        }} />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <CoinDataInitializer />
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              {/* Enhanced advanced background elements */}
              <div className="fixed inset-0 z-[-1] overflow-hidden">
                {/* Atmospheric gradient blobs with enhanced effects */}
                <div className="absolute top-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full bg-gradient-to-br from-brand-200/25 via-brand-300/10 to-brand-400/5 dark:from-brand-700/20 dark:via-brand-800/10 dark:to-brand-900/5 blur-[120px] animate-pulse-slow opacity-80 dark:opacity-60"></div>
                <div className="absolute bottom-[-25%] left-[-15%] w-[1000px] h-[1000px] rounded-full bg-gradient-to-tr from-indigo-200/15 via-teal-200/10 to-blue-200/5 dark:from-indigo-800/15 dark:via-teal-900/8 dark:to-blue-900/5 blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                
                {/* Secondary accent blobs with more refined styling */}
                <div className="absolute top-[25%] left-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-200/10 via-indigo-200/8 to-purple-200/5 dark:from-blue-900/8 dark:via-indigo-900/5 dark:to-purple-900/3 blur-[100px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
                <div className="absolute bottom-[30%] right-[15%] w-[400px] h-[400px] rounded-full bg-gradient-to-l from-emerald-200/10 via-teal-200/8 to-cyan-200/5 dark:from-emerald-900/8 dark:via-teal-900/5 dark:to-cyan-900/3 blur-[90px] animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
                
                {/* Subtle atmospheric layering */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/2 to-transparent dark:via-dark-bg-primary/5 opacity-50 dark:opacity-30"></div>
                
                {/* Advanced noise texture overlay with enhanced effects */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[url('/noise.svg')] bg-repeat mix-blend-overlay dark:mix-blend-color-dodge"></div>
                
                {/* Enhanced light beam effects */}
                <div className="absolute top-0 left-1/4 w-[1.5px] h-[280px] bg-gradient-to-b from-brand-300/60 to-transparent blur-[1.5px] dark:from-brand-400/40"></div>
                <div className="absolute top-0 left-2/4 w-[1px] h-[230px] bg-gradient-to-b from-brand-200/50 to-transparent blur-[1px] dark:from-brand-300/30"></div>
                <div className="absolute top-0 right-1/3 w-[2px] h-[320px] bg-gradient-to-b from-brand-300/40 to-transparent blur-[2px] dark:from-brand-400/20"></div>
                
                {/* Subtle radial highlight */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full radial-gradient opacity-[0.03] dark:opacity-[0.02] mix-blend-overlay"></div>
                
                {/* Atmospheric particles */}
                <div className="absolute top-[30%] left-[10%] w-[4px] h-[4px] rounded-full bg-brand-300/70 dark:bg-brand-500/40 blur-[1px] animate-float" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-[20%] right-[25%] w-[5px] h-[5px] rounded-full bg-indigo-300/60 dark:bg-indigo-500/30 blur-[1px] animate-float" style={{ animationDelay: '1.8s' }}></div>
                <div className="absolute bottom-[40%] left-[35%] w-[3px] h-[3px] rounded-full bg-cyan-300/50 dark:bg-cyan-500/25 blur-[1px] animate-float" style={{ animationDelay: '3.2s' }}></div>
              </div>

              <div className="min-h-screen flex flex-col relative z-0 pt-20">
                <Navigation />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                  {children}
                </main>
                <Footer />
              </div>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
