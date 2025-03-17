import Image from 'next/image';

interface FeatureCardProps {
  title: string;
  description: string;
  iconUrl?: string;
  iconAlt?: string;
}

/**
 * Server Component for displaying a feature card
 * 
 * Since this is a server component, it can be rendered on the server
 * without sending JavaScript to the client.
 */
export default function FeatureCardServer({
  title,
  description,
  iconUrl,
  iconAlt = 'Feature icon',
}: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      {iconUrl && (
        <div className="mb-4 flex justify-center">
          <Image 
            src={iconUrl} 
            alt={iconAlt} 
            width={64} 
            height={64}
            className="h-16 w-16 object-contain"
          />
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
} 