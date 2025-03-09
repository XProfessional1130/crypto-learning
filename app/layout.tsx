import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { ThemeProvider } from "../lib/theme-context";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearningCrypto - AI-Driven Crypto Education",
  description: "Learn crypto with AI-driven education, portfolio tracking, and market analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary">
              <Navigation />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
