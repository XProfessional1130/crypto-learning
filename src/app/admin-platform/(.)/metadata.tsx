import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Platform | LC Platform',
  description: 'Secure admin platform for managing content and settings',
  robots: 'noindex,nofollow',
};

// Override the root layout to make admin a full-screen application
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

// Tell Next.js to use this as a root layout
export const layoutSegments = []; 