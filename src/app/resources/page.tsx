'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useContent, useContentTypes } from '@/hooks/content/useContent';
import { ResourceListSkeleton } from '@/components/molecules/ResourceSkeleton';
import { motion, AnimatePresence } from 'framer-motion';

// Custom icons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [page, setPage] = useState(1);
  const [allResources, setAllResources] = useState<any[]>([]);
  const loadingRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  
  // Simplified, direct toggle function
  const toggleView = (newMode: 'grid' | 'map') => {
    console.log(`TOGGLE: Setting view mode to ${newMode}`);
    setViewMode(newMode);
  };
  
  // Monitor view mode changes for debugging
  useEffect(() => {
    console.log('View mode changed to:', viewMode);
  }, [viewMode]);

  const { data: contentData, isLoading, error } = useContent(page, 9, {
    searchTerm,
    type: selectedCategory
  });

  const { data: resourceCategories = ['All'] } = useContentTypes();
  
  // Helper function to determine the appropriate category for a resource
  const getResourceCategory = useCallback((resource: any) => {
    // Get available categories excluding "All"
    const availableCategories = resourceCategories.filter(cat => cat !== 'All');
    
    // If the resource already has a type that matches a category, use it
    if (resource.type && availableCategories.includes(resource.type)) {
      return resource.type;
    }
    
    // Try to infer category from title or excerpt
    const titleLower = resource.title?.toLowerCase() || '';
    const excerptLower = resource.excerpt?.toLowerCase() || '';
    
    // Check for exact category matches in title or excerpt
    for (const category of availableCategories) {
      const categoryLower = category.toLowerCase();
      
      // Direct match with category name
      if (titleLower.includes(categoryLower) || excerptLower.includes(categoryLower)) {
        return category;
      }
    }
    
    // Special cases for common content types
    if (resource.type === 'tutorial' || 
        titleLower.includes('how to') || 
        titleLower.includes('guide') || 
        titleLower.includes('tutorial')) {
      return 'Tutorial';
    }
    
    if (resource.type === 'course' || 
        titleLower.includes('course') || 
        titleLower.includes('class') || 
        titleLower.includes('lesson')) {
      return 'Course';
    }
    
    if (resource.type === 'article' || 
        titleLower.includes('article') || 
        titleLower.includes('blog')) {
      return 'Article';
    }
    
    // Default to "Uncategorized" if no matches
    return 'Uncategorized';
  }, [resourceCategories]);
  
  // Format a category for display (capitalization, rename Uncategorized)
  const formatCategoryForDisplay = useCallback((category: string) => {
    if (category === 'Uncategorized') return 'Resource';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }, []);

  // Reset resources when filters change
  useEffect(() => {
    setPage(1);
    setAllResources([]);
  }, [searchTerm, selectedCategory]);

  // Update resources when data changes
  useEffect(() => {
    if (contentData?.data) {
      if (page === 1) {
        setAllResources(contentData.data);
      } else {
        setAllResources(prev => [...prev, ...contentData.data]);
      }
    }
  }, [contentData?.data, page]);

  // Group resources by category for the map view
  const resourcesByCategory = useMemo(() => {
    if (!allResources?.length) return {};
    
    // Add logging to help debug
    console.log(`Recalculating resourcesByCategory with ${allResources.length} resources`);
    
    const grouped: Record<string, any[]> = {};
    
    // Get available categories excluding "All"
    const availableCategories = resourceCategories.filter(cat => cat !== 'All');
    
    // Initialize categories with empty arrays
    availableCategories.forEach(category => {
      grouped[category] = [];
    });
    
    // Add "Uncategorized" category if needed
    if (!grouped['Uncategorized']) {
      grouped['Uncategorized'] = [];
    }
    
    // Process all resources in one pass, more efficiently
    allResources.forEach(resource => {
      // Get resource category using the helper function
      const category = getResourceCategory(resource);
      
      // If category exists in our grouped object, add the resource there
      if (grouped[category]) {
        grouped[category].push(resource);
      } else {
        // Otherwise add to Uncategorized
        grouped['Uncategorized'].push(resource);
      }
    });
    
    // Remove empty categories
    Object.keys(grouped).forEach(category => {
      if (grouped[category].length === 0) {
        delete grouped[category];
      }
    });
    
    return grouped;
  }, [allResources, resourceCategories, getResourceCategory]);

  // Intersection Observer setup
  const lastResourceRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && contentData?.hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [isLoading, contentData?.hasMore]);

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

  // Memoize category sections for map view to prevent re-renders
  const memoizedCategoryMap = useMemo(() => {
    if (!resourcesByCategory || Object.keys(resourcesByCategory).length === 0) return null;
    
    return Object.entries(resourcesByCategory).map(([category, resources], categoryIndex) => (
      <motion.div 
        key={`category-${category}-${categoryIndex}`}
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: categoryIndex * 0.1 }}
      >
        <div className="flex items-center mb-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + categoryIndex * 0.1 }}
            className="relative"
          >
            <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {/* Display proper category title with capitalization */}
              {category === 'Uncategorized' 
                ? 'Other Resources' 
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </h2>
            <motion.div 
              className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-brand-primary to-transparent"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5, delay: 0.6 + categoryIndex * 0.1 }}
            />
          </motion.div>
          <div className="h-[1px] flex-grow ml-4 bg-gradient-to-r from-brand-primary/20 to-transparent" />
        </div>
        
        <div className="relative">
          {/* Scroll indicators */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-white/80 dark:from-dark-bg-primary/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-l from-white/80 dark:from-dark-bg-primary/80 to-transparent z-10 pointer-events-none" />
          
          <div className="overflow-x-auto pb-4 hide-scrollbar">
            <motion.div 
              className="flex gap-5 min-w-max"
              drag="x"
              dragConstraints={{ left: -(resources.length * 330 - 1280), right: 0 }}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {resources.map((resource, index) => (
                <motion.a
                  href={`/resources/${resource.slug}`}
                  key={`resource-${resource.id}-${index}`}
                  className="group relative w-80 shrink-0"
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {categoryIndex === Object.keys(resourcesByCategory).length - 1 && 
                  index === resources.length - 1 && 
                  <div ref={lastResourceRef} className="absolute bottom-0 w-full h-1 opacity-0"></div>}
                  
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  
                  <div className="h-full neo-glass rounded-xl overflow-hidden backdrop-blur-md flex flex-col shadow-sm border border-white/20 dark:border-white/5 transition-all duration-300 group-hover:shadow-md group-hover:border-brand-primary/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="p-6 flex-grow relative z-10">
                      <div className="mb-2">
                        <motion.span 
                          className="rounded-full bg-gradient-to-r from-brand-primary/30 to-brand-primary/20 px-3 py-1 text-xs font-medium text-brand-primary dark:text-brand-light border border-brand-primary/30 dark:border-brand-light/30"
                          whileHover={{ scale: 1.05 }}
                        >
                          {/* Format category for display consistently */}
                          {formatCategoryForDisplay(category)}
                        </motion.span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3 group-hover:text-brand-primary transition-colors duration-300">
                        {resource.title}
                      </h3>
                      
                      <p className="text-light-text-secondary dark:text-dark-text-secondary">
                        {resource.excerpt}
                      </p>
                    </div>
                    
                    <div className="p-4 mt-auto relative">
                      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
                      <motion.div
                        className="rounded-lg overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="relative group-hover:shadow-sm transition-shadow duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-primary/80 rounded-md" />
                          <div className="relative px-4 py-2.5 text-center text-white font-medium">
                            Explore Resource
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    ));
  }, [resourcesByCategory, containerVariants, itemVariants, formatCategoryForDisplay, lastResourceRef]);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div 
          className="neo-glass rounded-xl p-8 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <BackgroundPattern />
          <div className="relative z-10">
            <motion.div 
              className="inline-flex items-center justify-center mb-4 p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.2 }}
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </motion.div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Error loading resources
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
              {error.message || "Please try again later"}
            </p>
            <motion.button
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
            >
              Reload page
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Subtle background elements */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-brand-primary/5 to-transparent -z-10" />
      
      {/* Enhanced header with interactive animations */}
      <motion.div 
        className="neo-glass rounded-2xl p-6 md:p-8 mb-10 relative overflow-hidden border border-white/10 dark:border-white/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BackgroundPattern />
        
        <div className="relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="relative inline-block">
                Learning
                <motion.span 
                  className="absolute -bottom-1 left-0 h-[3px] bg-gradient-to-r from-brand-primary/80 to-transparent pointer-events-none" 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                />
              </span>{' '}
              <span className="text-gradient">Resources</span>
            </motion.h1>
            
            {/* Completely rebuilt toggle buttons - ultra simple */}
            <div className="bg-white/30 dark:bg-dark-bg-accent/30 rounded-lg p-1 flex shadow-sm z-20 relative">
              <button 
                type="button"
                onClick={() => toggleView('grid')}
                className={`px-3 py-2 rounded-md ${
                  viewMode === 'grid' 
                    ? 'bg-brand-primary text-white' 
                    : 'text-light-text-secondary hover:bg-white/20'
                } transition-colors`}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:inline">Grid</span>
                </div>
              </button>
              <button 
                type="button"
                onClick={() => toggleView('map')}
                className={`px-3 py-2 rounded-md ${
                  viewMode === 'map' 
                    ? 'bg-brand-primary text-white' 
                    : 'text-light-text-secondary hover:bg-white/20'
                } transition-colors`}
              >
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="hidden sm:inline">Map</span>
                </div>
              </button>
            </div>
          </div>

          {/* Elevated search experience */}
          <motion.div 
            className="relative mb-6 z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-light-text-secondary/70 dark:text-dark-text-secondary/70 group-focus-within:text-brand-primary transition-colors duration-200">
                <SearchIcon />
              </div>
              <input
                type="text"
                className="w-full bg-white/50 dark:bg-dark-bg-secondary/40 border border-white/30 dark:border-dark-bg-accent/30 rounded-xl py-3 pl-10 pr-10 placeholder-light-text-secondary/60 dark:placeholder-dark-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all duration-200 shadow-sm backdrop-blur-sm"
                placeholder="Search resources, topics, or concepts..."
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
          </motion.div>
          
          <motion.p 
            className="text-xl text-light-text-secondary dark:text-dark-text-secondary max-w-2xl mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Curated guides, tutorials, and tools to accelerate your crypto journey
          </motion.p>
          
          {/* Enhanced category selector */}
          <motion.div 
            className="mt-2 relative z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <AnimatePresence>
              <motion.div 
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {resourceCategories
                  .slice(0, showAllCategories ? resourceCategories.length : 5)
                  .map((category) => (
                  <motion.button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all relative ${
                      selectedCategory === category
                        ? 'bg-brand-primary text-white shadow-sm' 
                        : 'bg-white/30 dark:bg-dark-bg-accent/30 backdrop-blur-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/40 dark:hover:bg-dark-bg-accent/40 border border-white/20 dark:border-white/10'
                    }`}
                    variants={itemVariants}
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
                
                {resourceCategories.length > 5 && (
                  <motion.button
                    className="rounded-full px-4 py-1.5 text-sm font-medium bg-white/30 dark:bg-dark-bg-accent/30 backdrop-blur-sm text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/40 dark:hover:bg-dark-bg-accent/40 border border-white/20 dark:border-white/10"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    variants={itemVariants}
                  >
                    {showAllCategories ? 'Show less' : `+${resourceCategories.length - 5} more`}
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Display mode: Grid or Knowledge Map */}
      {isLoading && page === 1 ? (
        <ResourceListSkeleton count={6} />
      ) : !allResources?.length ? (
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
              <LightbulbIcon />
            </motion.div>
            <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mt-2">No resources found</h3>
            <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
              No resources available matching your filters at the moment.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Simple view mode indicator for debugging */}
          <div className="mb-4 text-xs text-light-text-secondary">Current view: {viewMode}</div>
          
          {/* Extra simple view switching with pure conditional rendering */}
          {viewMode === 'grid' ? (
            <div className="grid-view-container">
              <motion.div
                className="space-y-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  {allResources.map((resource, index) => (
                    <motion.a 
                      href={`/resources/${resource.slug}`}
                      key={resource.id}
                      className="group relative"
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {index === allResources.length - 1 && (
                        <div ref={lastResourceRef} className="absolute bottom-0 w-full h-1 opacity-0"></div>
                      )}
                      
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                      
                      <div className="relative neo-glass rounded-xl overflow-hidden backdrop-blur-md flex flex-col h-full shadow-sm border border-white/20 dark:border-white/5 transition-all duration-300 group-hover:shadow-md group-hover:border-brand-primary/30">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="p-6 flex-grow relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <motion.span 
                              className="rounded-full bg-gradient-to-r from-brand-primary/30 to-brand-primary/20 px-3 py-1 text-xs font-medium text-brand-primary dark:text-brand-light border border-brand-primary/30 dark:border-brand-light/30"
                              whileHover={{ scale: 1.05 }}
                            >
                              {/* Use the helper functions to display the proper category */}
                              {formatCategoryForDisplay(getResourceCategory(resource))}
                            </motion.span>
                            
                            {/* Enhanced resource difficulty indicator */}
                            <div className="flex space-x-1.5">
                              {[1, 2, 3].map((level) => (
                                <motion.div
                                  key={level}
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.1 * level }}
                                  className={`w-2 h-2 rounded-full ${
                                    level <= (resource.difficulty || 1)
                                      ? 'bg-brand-primary'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary group-hover:text-brand-primary transition-colors duration-300">
                            {resource.title}
                          </h2>
                          
                          <p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary">
                            {resource.excerpt}
                          </p>
                        </div>
                        
                        <div className="p-4 mt-auto relative">
                          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
                          <motion.div
                            className="rounded-lg overflow-hidden"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="relative group-hover:shadow-sm transition-shadow duration-300">
                              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-primary/80 rounded-md" />
                              <div className="relative px-4 py-2.5 text-center text-white font-medium">
                                Explore Resource
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </motion.div>
                
                {/* Enhanced loading indicator */}
                <div className="mt-8 text-center">
                  {isLoading && (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-brand-primary/80"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          delay: 0
                        }}
                      />
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-brand-primary/80"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          delay: 0.2
                        }}
                      />
                      <motion.div 
                        className="w-3 h-3 rounded-full bg-brand-primary/80"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          delay: 0.4
                        }}
                      />
                    </div>
                  )}
                  {!contentData?.hasMore && allResources.length > 0 && (
                    <motion.p 
                      className="text-light-text-secondary dark:text-dark-text-secondary py-2 px-4 rounded-full inline-flex items-center bg-white/30 dark:bg-dark-bg-secondary/30 backdrop-blur-sm shadow-sm border border-white/10 dark:border-white/5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <svg className="w-4 h-4 mr-2 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      You've explored all our resources
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="map-view-container">
              <motion.div
                className="space-y-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Display message if no categories are available after grouping */}
                {Object.keys(resourcesByCategory).length === 0 ? (
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
                        <LightbulbIcon />
                      </motion.div>
                      <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mt-2">No resources found</h3>
                      <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
                        No categorized resources available at the moment.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  // Render the memoized category map
                  memoizedCategoryMap
                )}
                
                {/* Enhanced loading indicator */}
                {isLoading && (
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-brand-primary/80"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        delay: 0
                      }}
                    />
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-brand-primary/80"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        delay: 0.2
                      }}
                    />
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-brand-primary/80"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        delay: 0.4
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 