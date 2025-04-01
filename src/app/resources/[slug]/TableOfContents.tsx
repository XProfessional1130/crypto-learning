'use client';

import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TableOfContentsProps {
  sections: Array<{
    id: string;
    title: string;
    level: number;
    index: number;
  }>;
  readingTime: number;
}

export function TableOfContents({ sections, readingTime }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-128px 0px -66%',
        threshold: 0.2
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="sticky top-24 neo-glass neo-glass-before rounded-xl">
      <div className="p-4 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary">
          <BookOpen className="w-4 h-4 text-brand-primary dark:text-brand-light" />
          <h2 className="text-sm font-medium">On this page</h2>
        </div>
        <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
          {sections.length} section{sections.length !== 1 ? 's' : ''} • {readingTime} min read
        </p>
      </div>
      
      <nav className="p-1.5">
        <div className="space-y-0.5 max-h-[calc(100vh-250px)] overflow-y-auto px-2 py-1">
          {sections.map(({ id, title, level, index }) => {
            const isActive = activeId === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setActiveId(id)}
                className={`
                  group relative flex items-start gap-2 rounded-md px-2 py-1.5
                  text-sm
                  transition-all duration-200
                  ${level === 3 ? 'pl-5 text-[13px]' : ''}
                  ${
                    isActive
                      ? 'text-brand-primary dark:text-brand-light bg-brand-primary/10 dark:bg-brand-light/10 font-medium'
                      : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-light hover:bg-brand-primary/5 dark:hover:bg-brand-light/5'
                  }
                `}
              >
                <span className={`
                  mt-0.5 flex h-3.5 w-3.5 flex-none items-center justify-center rounded-md
                  text-[10px] font-medium
                  ${
                    isActive
                      ? 'bg-brand-primary dark:bg-brand-light text-white dark:text-dark-bg-primary border-none'
                      : 'border border-light-border dark:border-dark-border bg-white/50 dark:bg-dark-bg-secondary/50 text-light-text-secondary dark:text-dark-text-secondary'
                  }
                `}>
                  {index}
                </span>
                <span className="flex-1">
                  {title}
                </span>
                {isActive && (
                  <span className="absolute inset-y-0 left-0 w-[2px] my-1 bg-brand-primary dark:bg-brand-light rounded-full" />
                )}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-light-border dark:border-dark-border bg-light-bg-secondary/30 dark:bg-dark-bg-secondary/30 rounded-b-xl">
        <a
          href="#"
          className="w-full flex items-center justify-center gap-1.5 text-xs text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary dark:hover:text-brand-light transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 15l7-7 7 7" />
          </svg>
          Back to top
        </a>
      </div>
    </div>
  );
} 