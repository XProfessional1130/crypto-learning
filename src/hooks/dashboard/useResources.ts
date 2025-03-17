import { useState, useEffect } from 'react';

// Define the resource type
interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
}

// Mock data for resources
const mockResources: Resource[] = [
  {
    id: '1',
    title: 'Crypto Basics Guide',
    description: 'Learn the fundamentals of cryptocurrency and blockchain technology.',
    type: 'Guide',
    url: 'https://example.com/crypto-basics'
  },
  {
    id: '2',
    title: 'Technical Analysis Masterclass',
    description: 'Advanced techniques for analyzing crypto market trends and patterns.',
    type: 'Course',
    url: 'https://example.com/technical-analysis'
  },
  {
    id: '3',
    title: 'DeFi Explained',
    description: 'Comprehensive overview of decentralized finance protocols and applications.',
    type: 'Guide',
    url: 'https://example.com/defi-explained'
  },
  {
    id: '4',
    title: 'NFT Creation Workshop',
    description: 'Step-by-step tutorial on creating and selling your own NFTs.',
    type: 'Tutorial',
    url: 'https://example.com/nft-workshop'
  },
  {
    id: '5',
    title: 'Crypto Tax Calculator',
    description: 'Tool to help calculate your cryptocurrency tax obligations.',
    type: 'Tool',
    url: 'https://example.com/crypto-tax-calculator'
  },
  {
    id: '6',
    title: 'Web3 Development Fundamentals',
    description: 'Introduction to building applications on blockchain networks.',
    type: 'Course',
    url: 'https://example.com/web3-development'
  }
];

export function useResources() {
  const [data, setData] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate API call with a delay
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockResources);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch resources'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);

  return { data, isLoading, error };
} 