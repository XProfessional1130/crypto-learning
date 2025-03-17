import { Newspaper } from 'lucide-react';

type NewsItem = {
  title: string;
  link: string;
  source: string;
  date: string;
  contentSnippet?: string;
  creator?: string;
  imageUrl?: string | null;
  categories?: string[];
};

interface CryptoNewsServerProps {
  newsItems?: NewsItem[];
}

/**
 * Server Component for CryptoNews
 * 
 * This component fetches and renders the news data.
 * It handles the data fetching on the server but leaves
 * interactivity to a client wrapper component.
 */
export default async function CryptoNewsServer({ newsItems: propNewsItems }: CryptoNewsServerProps) {
  // If news items are not provided as props, fetch them server-side
  const newsItems = propNewsItems || await fetchNewsServerSide();
  
  // Extract all unique categories from news items
  const categories = extractCategories(newsItems);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Newspaper className="w-5 h-5 mr-2 text-brand-primary" />
          Crypto News
        </h2>
      </div>
      
      {/* This section will be replaced with interactive elements in the client component */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Server rendered news items. Interactive filters will be handled by a client component.
        </p>
      </div>
      
      {/* Static news display */}
      <div className="space-y-4">
        {newsItems.map((item, index) => (
          <NewsItemCard key={index} item={item} />
        ))}
      </div>
      
      {/* Additional data passed to client */}
      <input 
        type="hidden" 
        id="news-categories-data" 
        value={JSON.stringify(categories)} 
      />
    </div>
  );
}

function NewsItemCard({ item }: { item: NewsItem }) {
  const date = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  return (
    <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-4">
        {item.imageUrl && (
          <div className="hidden sm:block flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <a 
            href={item.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-base font-medium text-gray-900 dark:text-white hover:text-brand-primary dark:hover:text-brand-primary"
          >
            {item.title}
          </a>
          
          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className="mr-2">{item.source}</span>
            <span>•</span>
            <span className="ml-2">{date}</span>
          </div>
          
          {item.contentSnippet && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {item.contentSnippet}
            </p>
          )}
          
          {item.categories && item.categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.categories.slice(0, 3).map((category, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to extract categories
function extractCategories(newsItems: NewsItem[]): string[] {
  const categorySet = new Set<string>();
  
  newsItems.forEach(item => {
    if (item.categories && item.categories.length > 0) {
      item.categories.forEach(category => {
        categorySet.add(category);
      });
    }
  });
  
  return Array.from(categorySet);
}

// Server-side fetch function
async function fetchNewsServerSide(): Promise<NewsItem[]> {
  try {
    // In a real implementation, this would directly access your database or API
    // without going through a fetch request
    const response = await fetch('https://your-api-endpoint/crypto-news', {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
} 