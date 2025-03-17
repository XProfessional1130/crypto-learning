'use client';

import { useState, useEffect } from 'react';
import { useResources } from '@/hooks/useResources';
import { ResourceListSkeleton } from '@/components/molecules/ResourceSkeleton';

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

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

export default function ResourcesPage() {
  const { data: resources, isLoading, error } = useResources();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debug logging
  console.log('Resources:', { resources, isLoading, error });

  // Extract unique resource types for filtering
  const resourceTypes = resources?.length 
    ? ['All', ...Array.from(new Set(resources.map(resource => resource.type)))]
    : ['All'];

  // Filter resources based on search term and selected type
  const filteredResources = resources?.filter(resource => {
    const matchesType = selectedType === 'All' || resource.type === selectedType;
    const matchesSearch = searchTerm === '' || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="neo-glass neo-glass-before rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Error loading resources: {error.message}
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with glassmorphic background */}
      <div className="neo-glass neo-glass-before rounded-2xl p-8 mb-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-300/10 dark:bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-300/10 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Learning <span className="text-gradient">Resources</span>
          </h1>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary">
            Curated guides, tutorials, and tools to accelerate your crypto journey
          </p>
        </div>
      </div>

      {/* Search and filters bar */}
      <div className="glass rounded-xl mb-8 p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search box */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XIcon />
            </button>
          )}
        </div>

        {/* Filter toggle for mobile */}
        <button 
          className="md:hidden btn btn-secondary" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon />
          Filters
        </button>

        {/* Filter buttons - visible on desktop or when toggled on mobile */}
        <div className={`flex-wrap gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          {resourceTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
                selectedType === type
                  ? 'neo-glass bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/30 text-brand-primary dark:text-brand-light'
                  : 'bg-white/50 dark:bg-dark-bg-accent/30 border border-white/10 dark:border-dark-bg-accent/20 text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/70 dark:hover:bg-dark-bg-accent/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <ResourceListSkeleton count={6} />
      ) : !filteredResources?.length ? (
        <div className="neo-glass neo-glass-before rounded-xl p-8 text-center">
          <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">No resources found</h3>
          <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
            No resources available matching your filters at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <div 
              key={resource.id} 
              className="neo-glass neo-glass-before rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] perspective-tilt backdrop-glow flex flex-col"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full neo-glass px-2.5 py-0.5 text-xs font-medium text-brand-primary dark:text-brand-light border border-brand-primary/20 dark:border-brand-light/20">
                    {resource.type}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                  {resource.title}
                </h2>
                <p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary">
                  {resource.description}
                </p>
              </div>
              <div className="border-t border-white/10 dark:border-dark-bg-accent/20 p-4 mt-auto">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center rounded-lg bg-brand-primary hover:bg-brand-dark text-white px-4 py-2 font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,181,176,0.5)]"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 