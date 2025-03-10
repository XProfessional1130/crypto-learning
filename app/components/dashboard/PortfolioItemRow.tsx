import { useState } from 'react';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import { usePortfolio } from '@/lib/hooks/usePortfolio';

interface PortfolioItemRowProps {
  item: PortfolioItemWithPrice;
  preferredCurrency: 'USD' | 'BTC';
}

export default function PortfolioItemRow({ item, preferredCurrency }: PortfolioItemRowProps) {
  const { updateAmount, removeCoin } = usePortfolio();
  const [isEditing, setIsEditing] = useState(false);
  const [newAmount, setNewAmount] = useState(item.amount);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const saveAmount = async () => {
    if (newAmount !== item.amount) {
      const result = await updateAmount(item.id, newAmount);
      if (result.success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };
  
  const cancelEdit = () => {
    setNewAmount(item.amount);
    setIsEditing(false);
  };
  
  const handleDelete = async () => {
    const result = await removeCoin(item.id);
    if (result.success) {
      setIsDeleteOpen(false);
    }
  };
  
  const currencySymbol = preferredCurrency === 'USD' ? '$' : '₿';
  const value = preferredCurrency === 'USD' ? item.valueUsd : item.valueBtc;
  const price = preferredCurrency === 'USD' ? item.priceUsd : item.priceBtc;
  const decimals = preferredCurrency === 'USD' ? 2 : 8;
  
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {item.logoUrl && (
            <img 
              src={item.logoUrl} 
              alt={item.coinSymbol} 
              className="w-6 h-6 mr-2 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
              }}
            />
          )}
          <div>
            <div className="font-medium">{item.coinSymbol}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{item.coinName}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {currencySymbol}{price.toLocaleString(undefined, { 
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals 
        })}
      </td>
      
      <td className={`px-6 py-4 whitespace-nowrap text-right ${
        item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
      }`}>
        {item.priceChange24h > 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        ${item.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {isEditing ? (
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(parseFloat(e.target.value))}
            min={0.000001}
            step={0.000001}
            className="w-32 px-2 py-1 text-right border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        ) : (
          item.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {currencySymbol}{value.toLocaleString(undefined, { 
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals 
        })}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {item.percentage.toFixed(2)}%
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {isEditing ? (
          <div className="flex justify-end space-x-1">
            <button
              onClick={saveAmount}
              className="p-1 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex justify-end space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </td>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDeleteOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirmation</h3>
            <p className="mb-6">Are you sure you want to remove {item.coinSymbol}?</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded"
                onClick={handleDelete}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </tr>
  );
} 