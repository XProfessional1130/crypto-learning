'use client';

import { useState } from 'react';
import InteractiveCard from '../ui/InteractiveCard';

interface Feature {
  id: number;
  title: string;
  description: string;
  iconUrl?: string;
}

interface FeatureInteractionsProps {
  features: Feature[];
}

/**
 * Client Component for interactive features
 * 
 * This component demonstrates a client component that uses
 * the interactive version of our cards for user interactions.
 */
export default function FeatureInteractions({ features }: FeatureInteractionsProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Interactive Components (Client-side)
      </h2>
      
      <p className="text-center mb-6 max-w-2xl mx-auto">
        These cards use client components with hover effects and click handlers.
        Click on a card to select it.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.slice(0, 3).map((feature) => (
          <InteractiveCard
            key={feature.id}
            variant="outlined"
            padding="md"
            hoverEffect="elevate"
            onClick={() => setSelectedFeature(feature)}
            className={selectedFeature?.id === feature.id ? 'ring-2 ring-brand-primary' : ''}
          >
            <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {feature.description.substring(0, 80)}...
            </p>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Click to select
            </div>
          </InteractiveCard>
        ))}
      </div>
      
      {selectedFeature && (
        <div className="bg-gray-100 dark:bg-slate-700 p-6 rounded-lg mt-6">
          <h3 className="text-xl font-semibold mb-2">
            Selected: {selectedFeature.title}
          </h3>
          <p className="mb-4">{selectedFeature.description}</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={() => setSelectedFeature(null)}
          >
            Clear Selection
          </button>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100 rounded-lg">
        <h3 className="font-medium mb-2">Performance Note:</h3>
        <p>
          Notice how only the interactive parts of this page use client components.
          The static content and data display use server components for better performance.
        </p>
      </div>
    </div>
  );
} 