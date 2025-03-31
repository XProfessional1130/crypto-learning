'use client';

interface SEOPreviewProps {
  url: string;
  title: string;
  description: string;
  image?: string;
}

export function SEOPreview({ url, title, description, image }: SEOPreviewProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-green-700 dark:text-green-500 text-sm truncate">
        {url}
      </div>
      <div className="text-blue-600 dark:text-blue-400 font-medium text-xl mt-1 truncate">
        {title}
      </div>
      <div className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
        {description}
      </div>
      {image && (
        <div className="mt-2">
          <img src={image} alt="Preview" className="h-20 rounded" />
        </div>
      )}
    </div>
  );
} 