import "./globals.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "LearningCrypto Platform",
  description: "Learn crypto the smart way",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Force a repaint when dark class changes */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // This script helps ensure dark mode is applied properly
            try {
              // Immediately apply the theme from localStorage to avoid flicker
              const storedTheme = localStorage.getItem('theme');
              
              if (storedTheme === 'dark' || 
                  (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              }
              
              // Watch for theme changes and force UI update if needed
              const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                  if (mutation.attributeName === 'class') {
                    // Force repaint by toggling a style
                    document.body.style.transition = 'background-color 0.01s';
                    setTimeout(() => {
                      document.body.style.transition = '';
                    }, 50);
                  }
                });
              });
              
              observer.observe(document.documentElement, { attributes: true });
            } catch (e) {
              console.error('Theme initialization error:', e);
            }
          `,
        }} />
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
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
