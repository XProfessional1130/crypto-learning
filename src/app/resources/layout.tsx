import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Resources | Learning Crypto',
  description: 'Explore our curated collection of crypto learning resources, including guides, tutorials, and tools to help you navigate the world of cryptocurrency.',
  openGraph: {
    title: 'Learning Resources | Learning Crypto',
    description: 'Explore our curated collection of crypto learning resources, including guides, tutorials, and tools to help you navigate the world of cryptocurrency.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learning Resources | Learning Crypto',
    description: 'Explore our curated collection of crypto learning resources, including guides, tutorials, and tools to help you navigate the world of cryptocurrency.',
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 