'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getDiscounts, getDiscountsByCategory, searchDiscounts, type Discount } from '@/lib/api/discounts';

// Custom icons instead of heroicons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Background pattern element
const BackgroundPattern = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
    <svg className="absolute w-[600px] h-[600px] -right-64 -top-64 text-brand-primary/10 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M42.8,-73.1C55.9,-66.7,67.3,-56.2,74.5,-43.2C81.7,-30.2,84.6,-15.1,83.8,-0.5C83,14.1,78.4,28.3,71.3,41.6C64.1,55,54.4,67.7,41.6,75.4C28.9,83.2,14.4,86.1,0.4,85.4C-13.6,84.8,-27.2,80.5,-38.5,72.8C-49.8,65,-58.8,53.7,-66.1,41.1C-73.3,28.5,-78.9,14.2,-79,0C-79.1,-14.3,-73.8,-28.6,-65.9,-41.3C-58,-54.1,-47.5,-65.3,-35,-70.6C-22.5,-76,-11.2,-75.4,1.6,-78.3C14.5,-81.2,29.6,-79.5,42.8,-73.1Z" transform="translate(100 100)" />
    </svg>
    <svg className="absolute w-[600px] h-[600px] -left-64 -bottom-64 text-blue-500/10 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M34.5,-58.7C45.1,-51.7,54.5,-42.8,62.7,-31.7C70.9,-20.6,77.9,-7.4,77.2,5.8C76.6,19,68.3,32.2,58.5,42.4C48.8,52.6,37.5,59.8,25.2,64.1C12.8,68.5,-0.6,70.1,-12.4,66.8C-24.2,63.4,-34.4,55.2,-44.1,45.7C-53.7,36.2,-62.9,25.4,-68.1,12.4C-73.3,-0.5,-74.6,-15.7,-68.6,-27.3C-62.7,-38.9,-49.6,-47,-37,-54.2C-24.5,-61.4,-12.2,-67.6,0.3,-68.1C12.8,-68.6,25.6,-63.3,34.5,-58.7Z" transform="translate(100 100)" />
    </svg>
  </div>
);

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories for filtering
  const categories = ['All', 'Exchange', 'Hardware Wallet', 'Trading Tools', 'Data & Analytics'];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      } 
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Fetch discounts based on filters
  const fetchDiscounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/discounts');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      let filteredData = result.data || [] as Discount[];
      console.log('Fetched data:', filteredData); // Debug log
      
      // Apply client-side filtering
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredData = filteredData.filter((discount: Discount) => 
          discount.title.toLowerCase().includes(searchLower) ||
          discount.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (selectedCategory !== 'All') {
        filteredData = filteredData.filter((discount: Discount) => 
          discount.category === selectedCategory
        );
      }

      console.log('Filtered data:', filteredData); // Debug log
      setDiscounts(filteredData);
    } catch (err) {
      console.error('Error fetching discounts:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Failed to load discounts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch discounts when filters change
  useEffect(() => {
    console.log('Effect triggered'); // Debug log
    fetchDiscounts();
  }, [selectedCategory, searchTerm]);

  // Debug log for render state
  console.log('Render state:', { isLoading, discountsLength: discounts.length, error });

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if discount is expiring soon (within 7 days)
  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Background gradient */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-primary/5 to-transparent -z-10" />
        
        {/* Enhanced header with interactive animations */}
        <motion.div 
          className="neo-glass rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden border border-white/10 dark:border-white/5 bg-white dark:bg-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackgroundPattern />
          
          <div className="relative z-10">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="relative inline-block">
                Exclusive
                <motion.span 
                  className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-brand-primary/80 to-transparent pointer-events-none" 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                />
              </span>{' '}
              <span className="text-gradient">Discounts</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Special deals and referral links for LearningCrypto members
            </motion.p>
          </div>
        </motion.div>

        {/* Enhanced search and filters bar */}
        <motion.div 
          className="neo-glass rounded-xl mb-8 p-4 flex flex-col md:flex-row gap-4 items-center border border-white/10 dark:border-white/5 bg-white dark:bg-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Search box */}
          <div className="relative flex-grow z-20">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-text-secondary/70 dark:text-dark-text-secondary/70 group-focus-within:text-brand-primary transition-colors duration-200">
              <SearchIcon />
            </div>
            <input
              type="text"
              className="w-full bg-white/50 dark:bg-dark-bg-secondary/40 border border-white/30 dark:border-dark-bg-accent/30 rounded-xl py-3 pl-10 pr-10 placeholder-light-text-secondary/60 dark:placeholder-dark-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all duration-200 shadow-sm backdrop-blur-sm"
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-light-text-secondary/70 dark:text-dark-text-secondary/70 hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors"
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* Filter toggle for mobile */}
          <motion.button 
            className="md:hidden px-4 py-2 rounded-lg bg-white/30 dark:bg-dark-bg-accent/30 text-light-text-secondary dark:text-dark-text-secondary border border-white/10 dark:border-white/5 flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FilterIcon />
            Filters
          </motion.button>

          {/* Filter buttons - visible on desktop or when toggled on mobile */}
          <motion.div 
            className={`flex-wrap gap-2 z-20 ${showFilters ? 'flex' : 'hidden md:flex'}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all relative ${
                  selectedCategory === category
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'bg-white/30 dark:bg-dark-bg-accent/30 backdrop-blur-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/40 dark:hover:bg-dark-bg-accent/40 border border-white/20 dark:border-white/10'
                }`}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {category}
                {selectedCategory === category && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-brand-primary/5 pointer-events-none"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 6 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Error display */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="relative z-10">
          {isLoading && (
            <motion.div 
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="neo-glass rounded-xl h-64 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: i * 0.05 }
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 to-transparent dark:from-brand-900/20 dark:to-transparent">
                    <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {!isLoading && discounts.length > 0 && (
            <motion.div 
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {discounts.map((discount, index) => (
                <motion.div 
                  key={discount.id} 
                  className="group relative"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  
                  <div className="relative neo-glass rounded-xl overflow-hidden backdrop-blur-md flex flex-col h-full shadow-sm border border-white/20 dark:border-white/5 transition-all duration-300 group-hover:shadow-md group-hover:border-brand-primary/30 bg-white dark:bg-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {isExpiringSoon(discount.expires_at) && (
                      <div className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 dark:from-yellow-500/90 dark:to-yellow-600/90 px-4 py-1.5 text-center text-sm font-medium text-white relative z-10">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Expires {formatDate(discount.expires_at)}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6 flex-grow relative z-10">
                      <motion.span 
                        className="rounded-full bg-gradient-to-r from-brand-primary/30 to-brand-primary/20 px-3 py-1 text-xs font-medium text-brand-primary dark:text-brand-light border border-brand-primary/30 dark:border-brand-light/30 inline-block"
                        whileHover={{ scale: 1.05 }}
                      >
                        {discount.category}
                      </motion.span>
                      
                      <h2 className="mt-3 text-xl font-semibold text-light-text-primary dark:text-dark-text-primary group-hover:text-brand-primary transition-colors duration-300">
                        {discount.title}
                      </h2>
                      
                      <p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary">
                        {discount.description}
                      </p>
                    </div>
                    
                    <div className="p-4 mt-auto relative">
                      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
                      <motion.a
                        href={discount.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-full rounded-lg overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-primary/80 rounded-md" />
                        <div className="relative px-4 py-2.5 text-center text-white font-medium">
                          Get Discount
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </div>
                        </div>
                      </motion.a>
                      
                      <p className="mt-2 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {discount.expires_at ? `Valid until ${formatDate(discount.expires_at)}` : 'No expiration date'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {!isLoading && discounts.length === 0 && (
            <motion.div 
              className="neo-glass rounded-xl p-8 text-center relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <BackgroundPattern />
              <div className="relative z-10">
                <motion.div 
                  className="inline-flex items-center justify-center mb-4 p-4 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.2 }}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mt-2">No discounts found</h3>
                <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
                  No discounts available matching your filters at the moment.
                </p>
                <motion.button
                  onClick={() => {setSelectedCategory('All'); setSearchTerm('');}}
                  className="mt-4 px-6 py-2.5 rounded-lg bg-brand-primary text-white font-medium shadow-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View All Discounts
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Enhanced Referral Program */}
        <motion.div 
          className="mt-16 neo-glass rounded-xl p-8 text-center relative overflow-hidden border border-white/10 dark:border-white/5 bg-white/50 dark:bg-gray-800/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BackgroundPattern />
          
          <div className="relative z-10">
            <motion.h2 
              className="text-2xl font-bold"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <span className="text-gradient">Earn While You Share</span>
            </motion.h2>
            
            <motion.p 
              className="mx-auto mt-3 max-w-2xl text-light-text-secondary dark:text-dark-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Join our referral program and earn rewards when your friends sign up for LearningCrypto. Share your unique referral link and earn up to 20% commission on their subscription.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Link
                href="/auth/signin"
                className="mt-6 inline-block rounded-lg bg-white/40 dark:bg-dark-bg-accent/30 border border-white/20 dark:border-white/10 text-light-text-primary dark:text-dark-text-primary px-6 py-3 font-medium shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <span>Join Referral Program</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 