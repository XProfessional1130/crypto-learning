import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LearningCrypto Platform',
    short_name: 'LearningCrypto',
    description: 'Master cryptocurrency with personalized AI education',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#39817c',
    icons: [
      {
        src: '/logos/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logos/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logos/maskable-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    orientation: 'portrait',
    prefer_related_applications: false,
  };
} 