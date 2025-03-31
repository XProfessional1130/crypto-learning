import "./globals.css";
import { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'
import { AuthProvider } from "@/lib/providers/auth-provider";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { DataCacheProvider } from "@/lib/providers/data-cache-provider";
import { ModalProvider } from "@/lib/providers/modal-provider";
import QueryProvider from "@/lib/providers/query-provider";
import { 
  Navigation, 
  Footer, 
  AppEnhancer, 
  GlobalStyles, 
  AuthTokenScript, 
  BackgroundElements,
  DataPrefetcher
} from "./components";
import dynamic from 'next/dynamic';

// Use variable font for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Ensure text remains visible during font loading
  variable: '--font-inter',
});

// Dynamically import GlobalChat to prevent SSR issues
const GlobalChat = dynamic(() => import('@/components/features/chat/GlobalChat'), {
  ssr: false
});

// Dynamically import GlobalModal to prevent SSR issues
const GlobalModal = dynamic(() => import('@/components/features/modals/GlobalModal'), {
  ssr: false
});

// Split metadata according to Next.js requirements
export const metadata: Metadata = {
  title: 'LearningCrypto - AI-Powered Crypto Education',
  description: 'Master cryptocurrency with personalized AI education, portfolio tracking, and market analytics.',
  icons: {
    icon: '/logos/icon.png',
    apple: '/logos/icon.png',
    shortcut: '/logos/icon.png'
  },
  openGraph: {
    title: 'LearningCrypto - AI-Powered Crypto Education',
    description: 'Master cryptocurrency with personalized AI education, portfolio tracking, and market analytics.',
    type: 'website',
  }
};

// Move viewport and themeColor to separate export
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://supabase.co" crossOrigin="anonymous" />
        <meta name="theme-color" content="#39817c" />
      </head>
      <body className={`${inter.className} h-full antialiased overflow-x-hidden overscroll-none`}>
        {/* Initialize providers first - they handle their own client/server logic */}
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <DataCacheProvider>
                <ModalProvider>
                  {/* Client components for enhancements - moved inside providers to ensure proper hydration */}
                  <AppEnhancer />
                  <GlobalStyles />
                  <AuthTokenScript />
                  
                  {/* Data Prefetcher and other app components */}
                  <DataPrefetcher />
                  
                  {/* App shell with background elements */}
                  <BackgroundElements />
                  
                  {/* Main layout */}
                  <div className="min-h-screen flex flex-col relative z-0 pt-20">
                    <Navigation />
                    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in scrollbar-custom">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  
                  {/* Global Chat Component */}
                  <GlobalChat />
                  
                  {/* Global Modal Component */}
                  <GlobalModal />
                </ModalProvider>
              </DataCacheProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
