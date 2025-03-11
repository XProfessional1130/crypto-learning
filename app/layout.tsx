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
              {/* Background decorative elements */}
              <div className="fixed inset-0 z-[-1] overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-200/30 dark:bg-brand-900/20 blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-100/30 dark:bg-brand-800/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
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
