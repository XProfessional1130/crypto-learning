import type { NextApiRequest } from 'next';

/**
 * Get the client IP address from a Next.js API request
 * Handles various forwarding headers for proxied requests
 */
export const getClientIp = (req: NextApiRequest): string => {
  // Try X-Forwarded-For first (standard for proxies)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Could be a comma-separated list if multiple proxies
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : forwarded[0].split(',')[0].trim();
    return ip;
  }
  
  // Try other common headers
  if (req.headers['x-real-ip']) {
    return String(req.headers['x-real-ip']);
  }
  
  // Fallback to socket remoteAddress
  return req.socket.remoteAddress || 'unknown';
};

/**
 * Check if a request is from a bot or crawler
 * Used to optimize API usage by not caching bot requests
 */
export const isBot = (req: NextApiRequest): boolean => {
  const userAgent = req.headers['user-agent']?.toLowerCase() || '';
  
  // Common bot user agent keywords
  const botPatterns = [
    'bot', 'spider', 'crawler', 'scraper', 'lighthouse', 
    'googlebot', 'bingbot', 'yandex', 'baidu'
  ];
  
  return botPatterns.some(pattern => userAgent.includes(pattern));
};

/**
 * Generate cache keys for API requests
 */
export const generateCacheKey = (
  base: string, 
  params: Record<string, any> = {}, 
  includeInKey: string[] = []
): string => {
  // Start with the base key
  let key = base;
  
  // Add included parameters to the key
  if (includeInKey.length > 0) {
    const parts = includeInKey
      .filter(param => param in params)
      .map(param => `${param}=${params[param]}`);
    
    if (parts.length > 0) {
      key += '_' + parts.join('_');
    }
  }
  
  return key;
}; 