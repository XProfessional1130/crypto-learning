'use client';

import Link from 'next/link';
import Container from './ui/Container';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="glass-effect border-t border-white/10 dark:border-dark-bg-accent/20 py-8 mt-auto">
      <Container>
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-xl font-bold text-gradient mb-2 inline-block">
              LearningCrypto
            </Link>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-2">
              Helping you navigate the crypto world with clarity and confidence.
            </p>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-4">
              &copy; {currentYear} LearningCrypto. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-6">
            <div>
              <h3 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/resources" className="text-sm nav-link">
                    Articles
                  </Link>
                </li>
                <li>
                  <Link href="/discounts" className="text-sm nav-link">
                    Discounts
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sm nav-link">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm nav-link">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-sm nav-link">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm nav-link">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
} 