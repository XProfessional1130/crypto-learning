import React from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/chat.module.css';

// Type for sample prompts
interface SamplePrompt {
  text: string;
  personality: 'tobo' | 'heido';
}

interface SuggestedPromptsProps {
  prompts: SamplePrompt[];
  onPromptClick: (prompt: string, personality: 'tobo' | 'heido') => void;
  isDarkMode: boolean;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  prompts,
  onPromptClick,
  isDarkMode
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-6 flex flex-col items-center justify-center h-full max-w-4xl mx-auto"
    >
      <div className="w-full">
        <h3 className={`text-sm font-medium mb-6 text-center ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          What would you like to learn about today?
        </h3>
        
        <div className="relative">
          {/* Create a simpler row layout for desktop, similar to mobile but horizontal */}
          <div className="hidden md:flex flex-wrap justify-center gap-6 px-4">
            {prompts.map((prompt, i) => (
              <motion.button
                key={i}
                onClick={() => onPromptClick(prompt.text, prompt.personality)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: 0.2 + (i * 0.1) 
                }}
                className={`p-4 text-left rounded-xl backdrop-blur-md w-72 text-sm transition-all ${
                  isDarkMode 
                    ? styles.suggestionCardDark
                    : styles.suggestionCardLight
                } ${styles.suggestionCard}`}
              >
                <div className="flex">
                  <div className="mr-3 mt-0.5 text-brand-primary/80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="9" x2="15" y1="18" y2="18"></line>
                      <path d="M10 22h4"></path>
                      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8A6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
                    </svg>
                  </div>
                  <div>{prompt.text}</div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Mobile layout - stacked cards for better visibility */}
          <div className="md:hidden flex flex-col gap-3 items-center px-4">
            {prompts.map((prompt, i) => (
              <motion.button
                key={i}
                onClick={() => onPromptClick(prompt.text, prompt.personality)}
                initial={{ opacity: 0, y: 10 + (i * 5) }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 20,
                  delay: 0.2 + (i * 0.1) 
                }}
                className={`p-4 text-left rounded-2xl backdrop-blur-md w-full max-w-xs text-sm transition-all ${
                  isDarkMode 
                    ? styles.suggestionCardDark
                    : styles.suggestionCardLight
                } ${styles.suggestionCard}`}
              >
                <div className="flex">
                  <div className="mr-3 mt-0.5 text-brand-primary/80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="9" x2="15" y1="18" y2="18"></line>
                      <path d="M10 22h4"></path>
                      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8A6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
                    </svg>
                  </div>
                  <div>{prompt.text}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuggestedPrompts; 