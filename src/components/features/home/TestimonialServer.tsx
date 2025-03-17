interface TestimonialServerProps {
  name: string;
  role: string;
  content: string;
}

/**
 * Server Component version of Testimonial
 * 
 * This component renders a testimonial with content, name, and role.
 * Since it's a server component, it has no client-side JavaScript overhead.
 */
export default function TestimonialServer({ 
  name, 
  role, 
  content 
}: TestimonialServerProps) {
  return (
    <div>
      <div className="backdrop-blur-sm bg-white/5 dark:bg-dark-bg-primary/10 border border-white/10 dark:border-dark-bg-accent/10 rounded-xl p-6 h-full">
        <div className="flex flex-col h-full justify-between">
          <div>
            <svg className="w-5 h-5 mb-2 text-brand-primary/30 dark:text-brand-primary/40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C21.145 6.022 19.845 7.785 19.17 10H22v11h-7.983zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.162 6.022 5.862 7.785 5.188 10H8v11H0z" />
            </svg>
            
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-base sm:text-lg font-light leading-relaxed">
              {content}
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 dark:border-dark-bg-accent/10 flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-brand-primary/80 to-brand-primary/60 flex items-center justify-center text-white text-sm">
              {name.charAt(0)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{name}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 