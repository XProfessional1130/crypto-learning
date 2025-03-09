'use client';

import { useResources } from '@/lib/hooks/useResources';
import { ResourceListSkeleton } from '@/app/components/molecules/ResourceSkeleton';

export default function ResourcesPage() {
  const { data: resources, isLoading, error } = useResources();

  if (isLoading) {
    return <ResourceListSkeleton count={5} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
          Error loading resources
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
          Please try again later
        </p>
      </div>
    );
  }

  if (!resources?.length) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
          No resources available
        </h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
          Check back later for new content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="p-6 rounded-lg bg-white/50 dark:bg-dark-bg-secondary/50 backdrop-blur-sm shadow-sm"
        >
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
            {resource.title}
          </h2>
          <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
            {resource.description}
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full text-sm bg-brand-100 dark:bg-brand-900 text-brand-900 dark:text-brand-100">
              {resource.type}
            </span>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              Learn More →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
} 