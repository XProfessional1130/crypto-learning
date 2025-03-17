export type AIPersonality = 'tobo' | 'heido';

export interface AIPersonalityConfig {
  name: AIPersonality;
  displayName: string;
  description: string;
  instructions: string;
  tone: string;
}

export interface ChatRequest {
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  personality: AIPersonality;
  userId: string;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  personality: AIPersonality;
}

// Assistant-specific types
export interface AssistantChatRequest {
  message: string;
  threadId: string | null;
  personality: AIPersonality;
  userId: string;
}

export interface ThreadInfo {
  threadId: string;
  assistantId: string;
  personality: AIPersonality;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
} 