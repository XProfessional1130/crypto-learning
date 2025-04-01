import { Metadata } from 'next';
import { supabase } from '@/lib/api/supabase';

interface GenerateMetadataProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  // Fetch the resource
  const { data: resource } = await supabase
    .from('content')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .single();

  if (!resource) {
    return {
      title: 'Resource Not Found | Learning Crypto',
      description: 'The requested resource could not be found.',
    };
  }

  return {
    title: resource.seo_title || `${resource.title} | Learning Crypto`,
    description: resource.seo_description || resource.excerpt,
    openGraph: {
      title: resource.og_title || resource.seo_title || resource.title,
      description: resource.og_description || resource.seo_description || resource.excerpt,
      type: 'article',
      images: resource.og_image ? [{ url: resource.og_image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: resource.twitter_title || resource.og_title || resource.title,
      description: resource.twitter_description || resource.og_description || resource.excerpt,
      images: resource.twitter_image ? [resource.twitter_image] : resource.og_image ? [resource.og_image] : undefined,
    },
    alternates: {
      canonical: resource.canonical_url,
    },
  };
}

export default function ResourceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 