import { Suspense } from 'react';
import ServerCard from '../ui/ServerCard';
import FeatureCardServer from './FeatureCardServer';
import FeatureInteractions from './FeatureInteractions';

/**
 * Example Server Component Page
 * 
 * This page demonstrates how to:
 * 1. Fetch data directly in a server component
 * 2. Use multiple server components together
 * 3. Integrate client components for interactive elements
 */
export default async function ServerComponentExample() {
  // In a real application, this would be a database or API call
  // Since this is a server component, we can use async/await directly
  const features = await fetchFeatures();
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Server Component Example
      </h1>
      
      {/* Static content in a server component */}
      <ServerCard className="mb-8" variant="elevated" padding="lg">
        <h2 className="text-2xl font-semibold mb-4">
          About Server Components
        </h2>
        <p className="mb-4">
          Server Components render exclusively on the server and send only HTML to the client.
          This reduces JavaScript bundle size and improves performance.
        </p>
        <p>
          They can fetch data directly and access backend resources without additional API calls.
        </p>
      </ServerCard>
      
      {/* Grid of feature cards using server components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => (
          <Suspense key={feature.id} fallback={<FeatureCardSkeleton />}>
            <FeatureCardServer
              title={feature.title}
              description={feature.description}
              iconUrl={feature.iconUrl}
            />
          </Suspense>
        ))}
      </div>
      
      {/* Client component for interactive elements */}
      <FeatureInteractions features={features} />
    </div>
  );
}

// Skeleton loader for feature cards
function FeatureCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md animate-pulse">
      <div className="mb-4 flex justify-center">
        <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  );
}

// Mock data fetching function
async function fetchFeatures() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 1,
      title: 'Reduced Bundle Size',
      description: 'Server components don\'t ship any JavaScript to the client, reducing the bundle size.',
      iconUrl: '/icons/bundle.svg',
    },
    {
      id: 2,
      title: 'Improved Performance',
      description: 'Faster page loads and better SEO with server-rendered content.',
      iconUrl: '/icons/performance.svg',
    },
    {
      id: 3,
      title: 'Direct Backend Access',
      description: 'Access databases and backend resources directly without API calls.',
      iconUrl: '/icons/database.svg',
    },
    {
      id: 4,
      title: 'Incremental Adoption',
      description: 'Mix server and client components to progressively enhance your app.',
      iconUrl: '/icons/incremental.svg',
    },
    {
      id: 5,
      title: 'Automatic Code Splitting',
      description: 'Only necessary client components are hydrated, saving resources.',
      iconUrl: '/icons/code-split.svg',
    },
    {
      id: 6,
      title: 'Streaming Rendering',
      description: 'Stream UI as it becomes available, improving perceived performance.',
      iconUrl: '/icons/streaming.svg',
    },
  ];
} 