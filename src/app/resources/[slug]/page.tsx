import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Clock, ArrowLeft, BookOpen } from 'lucide-react';
import { TableOfContents } from './TableOfContents';

interface ResourcePageProps {
  params: {
    slug: string;
  };
}

// Function to estimate read time
function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Function to generate table of contents from HTML content
function generateTOC(content: string): { id: string; title: string; level: number; index: number }[] {
  const headings: { id: string; title: string; level: number; index: number }[] = [];
  const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/g;
  let index = 1;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    headings.push({ id, title, level, index: index++ });
  }

  return headings;
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });
  
  try {
    const { data: resource } = await supabase
      .from('content')
      .select('title, excerpt')
      .eq('slug', params.slug)
      .single();

    return {
      title: resource?.title || 'Resource Not Found',
      description: resource?.excerpt || 'Resource details',
    };
  } catch (error) {
    return {
      title: 'Resource Not Found',
      description: 'Resource not found',
    };
  }
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data: resource, error } = await supabase
      .from('content')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (error || !resource) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="neo-glass neo-glass-before rounded-xl p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Resource not found
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
              The requested resource could not be found
            </p>
            <a href="/resources" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-dark text-white font-medium transition-all duration-300">
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </a>
          </div>
        </div>
      );
    }

    const readingTime = getReadingTime(resource.content);
    const tableOfContents = generateTOC(resource.content);
    const hasTableOfContents = tableOfContents.length > 0;

    // Process content to add IDs to headings
    let processedContent = resource.content;
    const processHeadings = (content: string, headings: typeof tableOfContents) => {
      let processed = content;
      headings.forEach(({ id, title }) => {
        const plainTitle = title.replace(/<[^>]+>/g, '').trim();
        const regex = new RegExp(`(<h[2-3])([^>]*>)(${plainTitle})(</h[2-3]>)`, 'i');
        processed = processed.replace(regex, `$1 id="${id}"$2${plainTitle}$4`);
      });
      return processed;
    };

    processedContent = processHeadings(processedContent, tableOfContents);

    return (
      <div className="min-h-screen bg-gradient-to-b from-transparent to-light-bg-secondary/20 dark:to-dark-bg-secondary/20">
        {/* Back button */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <a 
            href="/resources" 
            className="inline-flex items-center gap-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-light transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </a>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
            {/* Main content */}
            <div className="min-w-0">
              <div className="neo-glass neo-glass-before rounded-2xl p-8 mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="rounded-full neo-glass px-2.5 py-0.5 text-xs font-medium text-brand-primary dark:text-brand-light border border-brand-primary/20">
                    {resource.type}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <Clock className="w-4 h-4" />
                    {readingTime} min read
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4 leading-tight break-words">
                  {resource.title}
                </h1>
                {resource.excerpt && (
                  <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
                    {resource.excerpt}
                  </p>
                )}
              </div>

              <div className="neo-glass neo-glass-before rounded-xl p-8 mb-8 overflow-hidden">
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none
                    [&>*]:font-sans
                    prose-headings:font-sans prose-headings:scroll-mt-32 prose-headings:font-semibold
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-p:leading-relaxed prose-p:mb-4 prose-p:break-words
                    prose-a:text-brand-primary prose-a:no-underline hover:prose-a:underline
                    prose-code:text-brand-primary prose-code:bg-brand-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:break-words
                    prose-pre:bg-light-bg-secondary/50 dark:prose-pre:bg-dark-bg-secondary/50 prose-pre:overflow-x-auto
                    prose-img:rounded-xl prose-img:shadow-lg prose-img:max-w-full prose-img:h-auto
                    prose-blockquote:border-l-4 prose-blockquote:border-brand-primary/30
                    prose-ul:list-disc prose-ol:list-decimal
                    [&_*]:break-words"
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                />
              </div>
            </div>

            {/* Sidebar with TOC */}
            {hasTableOfContents && (
              <div className="hidden lg:block">
                <TableOfContents 
                  sections={tableOfContents}
                  readingTime={readingTime}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Resource page error:', error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="neo-glass neo-glass-before rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Error: Failed to fetch resource
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
            Please try again later
          </p>
          <a href="/resources" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-dark text-white font-medium transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </a>
        </div>
      </div>
    );
  }
} 