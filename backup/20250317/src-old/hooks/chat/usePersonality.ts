import { useState, useCallback } from 'react';
import { AIPersonality } from '@/types/ai';

interface UsePersonalityOptions {
  initialPersonality?: AIPersonality;
  onPersonalityChange?: (personality: AIPersonality) => void;
}

/**
 * usePersonality - Handles AI personality switching and management
 * Manages the active personality and provides switching functionality
 */
export function usePersonality({
  initialPersonality = 'tobo',
  onPersonalityChange,
}: UsePersonalityOptions = {}) {
  // Personality state
  const [activePersonality, setActivePersonality] = useState<AIPersonality>(initialPersonality);
  
  // Switch personality
  const switchPersonality = useCallback((personality: AIPersonality) => {
    if (personality === activePersonality) return;
    
    setActivePersonality(personality);
    
    // Call the change callback if provided
    if (onPersonalityChange) {
      onPersonalityChange(personality);
    }
  }, [activePersonality, onPersonalityChange]);
  
  // Toggle between personalities
  const togglePersonality = useCallback(() => {
    const newPersonality = activePersonality === 'tobo' ? 'heido' : 'tobo';
    switchPersonality(newPersonality);
  }, [activePersonality, switchPersonality]);
  
  // Get personality display name
  const getPersonalityName = useCallback((personality: AIPersonality = activePersonality) => {
    return personality === 'tobo' ? 'Tobot' : 'Haido';
  }, [activePersonality]);
  
  return {
    activePersonality,
    switchPersonality,
    togglePersonality,
    getPersonalityName,
  };
} 