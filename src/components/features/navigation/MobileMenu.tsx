'use client';

import { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import AuthButtons from './AuthButtons';
import { NavItem } from '@/types/components/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { useCallback, useEffect } from 'react';
import ThemeLogo from '../ThemeLogo';

// Import the NAV_ITEMS directly since we need to know the type
import { NAV_ITEMS } from '@/lib/config/navigation';

// Fallback navigation items in case the passed ones don't work (excluding Home)
const FALLBACK_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', public: true },
  { name: 'About', href: '/about', public: true }
];

// Use the type of NAV_ITEMS items
type NavItemType = typeof NAV_ITEMS[0];

interface MobileMenuProps {
  isOpen: boolean;
  toggle: () => void;
  navItems: NavItem[];
  pathname: string | null;
  user: User | null;
  loading: boolean;
  isScrolled?: boolean;
}

/**
 * MobileMenu - Handles mobile navigation display
 * Shows/hides mobile navigation drawer with seamless animation
 */
export default function MobileMenu({ 
  isOpen, 
  toggle, 
  navItems, 
  pathname, 
  user, 
  loading,
  isScrolled = false
}: MobileMenuProps) {
  const { signOut: authSignOut } = useAuth();
  
  // Create a wrapper function with the expected return type
  const handleSignOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    // Function explicitly returns void
  }, [authSignOut]);

  // Effect to prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log("Mobile menu opened with items:", navItems);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, navItems]);
  
  // Hamburger icon button
  const renderHamburger = () => (
    <motion.button
      className="text-gray-700 dark:text-gray-300 md:hidden rounded-full p-2 transition-all bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
      onClick={toggle}
      aria-label="Toggle mobile menu"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {isOpen ? (
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </motion.button>
  );

  // Animation variants for the mobile menu
  const menuVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1],
        when: "afterChildren"
      }
    },
    visible: {
      opacity: 1,
      height: "100vh",
      transition: {
        duration: 0.4,
        ease: [0.4, 0.0, 0.2, 1],
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  // Animation variants for the mobile menu items
  const menuItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Ensure we always have menu items to render
  const displayItems = navItems && navItems.length > 0 ? navItems : FALLBACK_ITEMS;

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="md:hidden">
        {renderHamburger()}
      </div>

      {/* Mobile menu full screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed left-0 top-[60px] w-full bg-white dark:bg-gray-900 z-[1000] overflow-hidden"
            style={{ height: "calc(100vh - 60px)" }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
          >
            <div className="h-full flex flex-col">
              {/* Navigation Items */}
              <motion.div 
                className="flex-1 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="px-6 py-8">
                  <ul className="space-y-6">
                    {displayItems.map((item, index) => (
                      <motion.li 
                        key={`mobile-nav-${index}`}
                        variants={menuItemVariants}
                        custom={index}
                        className="border-b border-gray-100 dark:border-gray-800 pb-4"
                      >
                        <MobileNavLink
                          href={item.href}
                          active={pathname === item.href}
                          onClick={toggle}
                        >
                          {item.name}
                        </MobileNavLink>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
              
              {/* Footer with Auth Buttons */}
              <motion.div 
                className="mt-auto p-6 border-t border-gray-200 dark:border-gray-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <AuthButtons
                  user={user}
                  onSignOut={handleSignOut}
                  mobile={true}
                />
                
                {/* Additional footer links */}
                <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/privacy" className="hover:text-brand-primary dark:hover:text-brand-light transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="hover:text-brand-primary dark:hover:text-brand-light transition-colors">
                    Terms of Service
                  </Link>
                  <Link href="/contact" className="hover:text-brand-primary dark:hover:text-brand-light transition-colors">
                    Contact Us
                  </Link>
                </div>
                
                {/* Credit text */}
                <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
                  © {new Date().getFullYear()} Learning Crypto. All rights reserved.
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface MobileNavLinkProps {
  children: React.ReactNode;
  href: string;
  active: boolean;
  onClick?: () => void;
}

function MobileNavLink({ children, href, active, onClick }: MobileNavLinkProps) {
  return (
    <div className="group relative">
      <Link
        href={href}
        onClick={onClick}
        className={`
          block text-lg font-medium transition-all duration-200 flex items-center
          ${active 
            ? 'text-brand-primary dark:text-brand-light' 
            : 'text-gray-800 dark:text-gray-100 group-hover:text-brand-primary dark:group-hover:text-brand-light'
          }
        `}
      >
        {children}
        
        {/* Animated arrow indicator */}
        <motion.svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ x: -5, opacity: 0 }}
          animate={{ x: 0, opacity: active ? 1 : 0 }}
          whileHover={{ x: 3 }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </motion.svg>
      </Link>
      
      {/* Animated underline indicator */}
      <motion.div
        className={`h-0.5 bg-brand-primary dark:bg-brand-light absolute bottom-0 left-0 ${active ? 'opacity-100' : 'opacity-0'}`}
        initial={{ width: "0%" }}
        animate={{ width: active ? "100%" : "0%" }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </div>
  );
} 