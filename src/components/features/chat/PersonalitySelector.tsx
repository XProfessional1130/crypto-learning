import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { AIPersonality } from '@/types/ai';
import { personalityImages } from './MessageBubble';

interface PersonalitySelectorProps {
  activePersonality: AIPersonality;
  onSwitchPersonality: (personality: 'tobo' | 'heido') => void;
  buttonDimensions: {
    toboWidth: number;
    heidoWidth: number;
    heidoLeft: number;
  };
  selectorKey: number;
  firstToggleRef: React.RefObject<HTMLButtonElement>;
  secondToggleRef: React.RefObject<HTMLButtonElement>;
}

const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  activePersonality, 
  onSwitchPersonality,
  buttonDimensions,
  selectorKey,
  firstToggleRef,
  secondToggleRef,
}) => {
  return (
    <div className="hidden sm:flex neo-glass px-1 py-1 rounded-full items-center transition-all duration-300 relative overflow-hidden ml-2">
      {/* Sliding background indicator with improved animation */}
      <motion.div 
        className="absolute rounded-full bg-brand-primary/30 backdrop-blur-md border border-brand-primary/40 shadow-[0_0_8px_rgba(77,181,176,0.3)]"
        initial={false}
        animate={{
          x: activePersonality === 'tobo' ? 0 : buttonDimensions.heidoLeft,
          width: activePersonality === 'tobo' ? buttonDimensions.toboWidth : buttonDimensions.heidoWidth,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 30,
          mass: 1
        }}
        style={{
          height: '100%',
          top: '0%',
        }}
        key={`selector-${selectorKey}`}
      />
      
      {/* Tobo Button */}
      <button
        ref={firstToggleRef}
        onClick={() => onSwitchPersonality('tobo')}
        className="z-10 px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-300 relative"
      >
        <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border border-white/30 shadow-sm transition-all duration-300 ${
          activePersonality === 'tobo' 
            ? 'bg-brand-100 dark:bg-brand-800/50 scale-110 shadow-[0_0_10px_rgba(77,181,176,0.3)]' 
            : 'bg-gray-100/70 dark:bg-gray-800/30'
        }`}>
          <Image 
            src={personalityImages.tobo} 
            alt="Tobo" 
            width={24} 
            height={24} 
            className={`object-cover transition-transform duration-300 ${activePersonality === 'tobo' ? 'scale-110' : 'scale-100 opacity-80'}`}
          />
        </div>
        <div>
          <div className={`font-medium transition-all duration-300 ${activePersonality === 'tobo' ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Tobot</div>
        </div>
      </button>
      
      {/* Haido Button (renamed from Heido) */}
      <button
        ref={secondToggleRef}
        onClick={() => onSwitchPersonality('heido')}
        className="z-10 px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-300"
      >
        <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border border-white/30 shadow-sm transition-all duration-300 ${
          activePersonality === 'heido' 
            ? 'bg-brand-100 dark:bg-brand-800/50 scale-110 shadow-[0_0_10px_rgba(77,181,176,0.3)]' 
            : 'bg-gray-100/70 dark:bg-gray-800/30'
        }`}>
          <Image 
            src={personalityImages.heido} 
            alt="Haido" 
            width={24} 
            height={24}
            className={`object-cover transition-transform duration-300 ${activePersonality === 'heido' ? 'scale-110' : 'scale-100 opacity-80'}`}
          />
        </div>
        <div>
          <div className={`font-medium transition-all duration-300 ${activePersonality === 'heido' ? 'text-brand-primary dark:text-brand-light' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>Haido</div>
        </div>
      </button>
    </div>
  );
};

export default PersonalitySelector; 