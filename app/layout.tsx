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
              {/* Enhanced background decorative elements */}
              <div className="fixed inset-0 z-[-1] overflow-hidden">
                {/* Main large gradient blobs */}
                <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-brand-200/30 to-brand-300/10 dark:from-brand-800/20 dark:to-brand-900/10 blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-15%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-brand-100/20 to-teal-200/10 dark:from-brand-700/15 dark:to-teal-800/10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                
                {/* Secondary accent blobs */}
                <div className="absolute top-[20%] left-[25%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-blue-200/15 to-indigo-200/10 dark:from-blue-800/10 dark:to-indigo-900/5 blur-[80px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
                <div className="absolute bottom-[30%] right-[20%] w-[350px] h-[350px] rounded-full bg-gradient-to-l from-teal-200/10 to-emerald-200/5 dark:from-teal-800/10 dark:to-emerald-900/5 blur-[70px] animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
                
                {/* Subtle noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('/noise.svg')] bg-repeat"></div>
                
                {/* Optional light beam effect */}
                <div className="absolute top-0 left-1/3 w-[2px] h-[200px] bg-gradient-to-b from-brand-300/40 to-transparent blur-[2px] dark:from-brand-400/30"></div>
                <div className="absolute top-0 left-2/3 w-[1px] h-[150px] bg-gradient-to-b from-brand-200/30 to-transparent blur-[1px] dark:from-brand-300/20"></div>
              </div>

              <div className="min-h-screen flex flex-col relative z-0">
                <div className="sticky top-0 z-40">
                  <Navigation />
                </div>
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
