import { Metadata, Viewport } from "next";

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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
}; 