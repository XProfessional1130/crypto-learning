import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Define the shape of our RSS feed items
type CustomItem = {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  content: string;
  contentSnippet: string;
  isoDate: string;
  // Some RSS feeds might include these directly
  enclosure?: {
    url: string;
    type: string;
  };
  "media:content"?: any; // Using any here because the structure can vary
  categories?: any[]; // Using any for now to handle different category structures
};

type CustomFeed = {
  items: CustomItem[];
};

// Define common crypto categories and their related keywords
const categoryKeywords = {
  'Bitcoin': ['bitcoin', 'btc', 'satoshi', 'nakamoto'],
  'Ethereum': ['ethereum', 'eth', 'vitalik', 'buterin', 'ether'],
  'Altcoins': ['altcoin', 'solana', 'cardano', 'polkadot', 'avalanche', 'ada', 'sol', 'dot', 'avax'],
  'DeFi': ['defi', 'decentralized finance', 'uniswap', 'aave', 'compound', 'yield', 'farming', 'staking'],
  'Markets': ['market', 'price', 'rally', 'bull', 'bear', 'crash', 'surge', 'trading', 'traders'],
  'Regulation': ['regulation', 'sec', 'cftc', 'government', 'law', 'legal', 'compliance', 'ban'],
  'NFTs': ['nft', 'non-fungible', 'collectible', 'art', 'auction'],
  'Web3': ['web3', 'metaverse', 'dao', 'decentralized autonomous'],
  'Business': ['company', 'adoption', 'enterprise', 'corporate', 'partnership', 'acquisition']
};

export async function GET() {
  try {
    const parser: Parser<CustomFeed, CustomItem> = new Parser({
      customFields: {
        item: [
          ['dc:creator', 'creator'],
          ['content:encoded', 'content'],
          ['media:content', 'media:content'],
          ['enclosure', 'enclosure'],
          ['category', 'categories'],
        ],
      },
    });

    // Fetch RSS feed from CoinDesk
    const feed = await parser.parseURL('https://www.coindesk.com/arc/outboundfeeds/rss');
    
    // Extract categories from all items for our filter
    const extractedCategorySet = new Set<string>();
    
    // Process and format the news items
    const newsItems = feed.items.slice(0, 5).map((item: CustomItem) => {
      // Try multiple methods to extract image
      let imageUrl = null;
      
      // First check for media:content as it's usually the best quality image
      if (item['media:content']) {
        const mediaContent = item['media:content'];
        // Check different possible structures
        if (typeof mediaContent === 'object' && mediaContent !== null) {
          if (mediaContent.$ && mediaContent.$.url) {
            imageUrl = mediaContent.$.url;
          } else if (Array.isArray(mediaContent) && mediaContent.length > 0) {
            // Sometimes it's an array of media items
            const firstMedia = mediaContent[0];
            if (firstMedia && firstMedia.$ && firstMedia.$.url) {
              imageUrl = firstMedia.$.url;
            }
          } else if ('url' in mediaContent) {
            // Direct url property
            imageUrl = mediaContent.url;
          }
        }
      }
      
      // If no media:content image, check for enclosure
      if (!imageUrl && item.enclosure && item.enclosure.url && 
          (item.enclosure.type?.startsWith('image/') || !item.enclosure.type)) {
        imageUrl = item.enclosure.url;
      }
      
      // If still no image, try content parsing
      if (!imageUrl) {
        imageUrl = extractImageFromContent(item.content);
      }
      
      // Default image for CoinDesk if none found
      if (!imageUrl) {
        imageUrl = 'https://www.coindesk.com/resizer/86_-JpS2CQ6k9FxoRHIxg3nGcvo=/500x500/filters:quality(80):format(png):base64(0)/cloudfront-us-east-1.images.arcpublishing.com/coindesk/F6KQ7VEWHFGTBKP2FKTWMJOUXA.png';
      }

      // Extract original categories from the feed item
      const originalCategories: string[] = [];
      if (item.categories && Array.isArray(item.categories)) {
        item.categories.forEach(category => {
          if (typeof category === 'string') {
            originalCategories.push(category.trim());
          } else if (typeof category === 'object' && category !== null) {
            // Handle category objects that might have a text value
            if ('_' in category && typeof category._ === 'string') {
              originalCategories.push(category._.trim());
            }
          }
        });
      }
      
      // Determine categories for the article
      const categories = determineCategoriesFromContent(
        item.title || '', 
        item.contentSnippet || '', 
        originalCategories
      );
      
      // Add categories to our set for the filter options
      categories.forEach(cat => extractedCategorySet.add(cat));
      
      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        source: 'CoinDesk',
        date: formatDate(item.pubDate || ''),
        creator: item.creator,
        contentSnippet: item.contentSnippet?.substring(0, 120) + (item.contentSnippet?.length > 120 ? '...' : ''),
        imageUrl,
        categories
      };
    });

    // Convert the set to a sorted array for our filter options
    const allCategories = Array.from(extractedCategorySet).sort();

    return NextResponse.json({ 
      newsItems,
      categories: allCategories
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// Determine categories based on title, content, and any existing categories
function determineCategoriesFromContent(
  title = '', 
  content = '', 
  existingCategories: string[] = []
): string[] {
  const combinedText = `${title} ${content}`.toLowerCase();
  const detectedCategories = new Set<string>(existingCategories);
  
  // Check for keywords in the combined text
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    if (keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))) {
      detectedCategories.add(category);
    }
  });
  
  // Always add a default category if none detected
  if (detectedCategories.size === 0) {
    detectedCategories.add('General');
  }
  
  return Array.from(detectedCategories);
}

// Extract image URL from HTML content
function extractImageFromContent(content: string): string | null {
  if (!content) return null;
  
  // Try multiple patterns to find images
  
  // Standard img tag
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = content.match(imgRegex);
  if (match && match[1]) {
    return match[1];
  }
  
  // Image in figure
  const figureRegex = /<figure.*?><img.*?src="([^">]+)".*?<\/figure>/i;
  const figureMatch = content.match(figureRegex);
  if (figureMatch && figureMatch[1]) {
    return figureMatch[1];
  }
  
  // Background image in style
  const styleRegex = /background-image:url\(['"](.+?)['"]\)/i;
  const styleMatch = content.match(styleRegex);
  if (styleMatch && styleMatch[1]) {
    return styleMatch[1];
  }
  
  return null;
}

// Helper function to format date as '2 hours ago', 'Yesterday', etc.
function formatDate(dateString: string): string {
  const published = new Date(dateString);
  const now = new Date();
  
  const diffInMs = now.getTime() - published.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `${minutes}m ago`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours}h ago`;
  } else if (diffInDays < 2) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `${days}d ago`;
  } else {
    return published.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
} 