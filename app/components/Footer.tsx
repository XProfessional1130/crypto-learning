'use client';

import Link from 'next/link';
import Container from './ui/Container';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white shadow-inner py-8 border-t border-gray-100">
      <Container>
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="text-xl font-bold text-brand-primary mb-2 inline-block">
              LearningCrypto
            </Link>
            <p className="text-sm text-gray-500 mt-2">
              Helping you navigate the crypto world with clarity and confidence.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              &copy; {currentYear} LearningCrypto. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-6">
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/resources" className="text-sm text-gray-600 hover:text-brand-primary">
                    Articles
                  </Link>
                </li>
                <li>
                  <Link href="/discounts" className="text-sm text-gray-600 hover:text-brand-primary">
                    Discounts
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sm text-gray-600 hover:text-brand-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-brand-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-brand-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-brand-primary">
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