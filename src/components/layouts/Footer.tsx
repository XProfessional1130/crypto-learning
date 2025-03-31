'use client';

import Link from 'next/link';
import Container from '@/components/ui/Container';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Don't render footer on admin pages
  if (pathname?.startsWith('/admin-platform')) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="glass-effect border-t border-white/10 dark:border-dark-bg-accent/20 py-8 mt-auto">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <span className="text-lg font-semibold tracking-tight text-light-text-primary dark:text-dark-text-primary">LearningCrypto</span>
            </Link>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-md">
              Learn about cryptocurrencies, blockchain technology, and digital assets with our comprehensive resources and tools.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4 text-light-text-primary dark:text-dark-text-primary">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary transition">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary transition">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4 text-light-text-primary dark:text-dark-text-primary">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-primary transition">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10 dark:border-dark-bg-accent/20 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            &copy; {currentYear} LearningCrypto. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <Link href="https://twitter.com" className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-brand-primary dark:hover:text-brand-primary" target="_blank" rel="noopener noreferrer">
              Twitter
            </Link>
            <Link href="https://discord.com" className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-brand-primary dark:hover:text-brand-primary" target="_blank" rel="noopener noreferrer">
              Discord
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
} 