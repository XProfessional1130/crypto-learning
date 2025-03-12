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

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en" className="smooth-scroll">
      <head>
        {/* Script tags in <head> should be defined at build time for static generation */}
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        {/* Auth token detection */}
        <AuthTokenScript />
        {/* App enhancements for professional UX */}
        <AppEnhancer />
        {/* Client-side only styles */}
        <GlobalStyles />
        <CoinDataInitializer />
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              {/* Enhanced background elements */}
              <BackgroundElements />

              <div className="min-h-screen flex flex-col relative z-0 pt-20">
                <Navigation />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in scrollbar-custom">
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
