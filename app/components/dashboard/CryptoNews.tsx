export default function CryptoNews() {
  // Mock news data
  const newsItems = [
    {
      id: 1,
      title: 'Bitcoin Hits New All-Time High',
      source: 'CryptoNews',
      date: '3 hours ago',
      url: '#'
    },
    {
      id: 2,
      title: 'Ethereum Upgrade Scheduled for Next Month',
      source: 'BlockchainTimes',
      date: '5 hours ago',
      url: '#'
    },
    {
      id: 3,
      title: 'Major Bank Announces Crypto Custody Services',
      source: 'FinanceDaily',
      date: '8 hours ago',
      url: '#'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Latest Crypto News</h2>
      
      <div className="space-y-4">
        {newsItems.map(item => (
          <a 
            key={item.id}
            href={item.url}
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-medium mb-1">{item.title}</h3>
            <div className="flex text-sm text-gray-500 dark:text-gray-400">
              <span>{item.source}</span>
              <span className="mx-2">•</span>
              <span>{item.date}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
} 