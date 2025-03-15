import { AIPersonality } from '@/types/ai';

interface SamplePrompt {
  text: string;
  personality: 'tobo' | 'heido';
}

// Sample prompts for the chat
export const samplePrompts: SamplePrompt[] = [
  { text: "What is cryptocurrency?", personality: 'tobo' },
  { text: "How does Bitcoin work?", personality: 'tobo' },
  { text: "What is a blockchain?", personality: 'tobo' },
  { text: "Explain Ethereum to me.", personality: 'tobo' },
  { text: "What is DeFi?", personality: 'tobo' },
  { text: "How do I buy Bitcoin?", personality: 'tobo' },
  { text: "What is a crypto wallet?", personality: 'tobo' },
  { text: "Explain NFTs to me.", personality: 'tobo' },
  { text: "What is a smart contract?", personality: 'tobo' },
  { text: "What are the risks of crypto investing?", personality: 'tobo' },
  { text: "What's the difference between coins and tokens?", personality: 'heido' },
  { text: "How do I stay safe in crypto?", personality: 'heido' },
  { text: "Explain mining to me.", personality: 'heido' },
  { text: "What is staking?", personality: 'heido' },
  { text: "How do decentralized exchanges work?", personality: 'heido' },
  { text: "What are layer 2 solutions?", personality: 'heido' },
  { text: "Explain proof of stake vs proof of work.", personality: 'heido' },
  { text: "What is a crypto market cycle?", personality: 'heido' },
  { text: "How do I do my own research (DYOR)?", personality: 'heido' },
  { text: "What is a seed phrase?", personality: 'heido' }
];

// Filter prompts by personality
export const getPromptsByPersonality = (personality: AIPersonality): string[] => {
  return samplePrompts
    .filter(prompt => prompt.personality === personality || prompt.personality === 'tobo')
    .map(prompt => prompt.text);
};

// Format message content for display
export const formatMessageContent = (content: string): string => {
  // Handle code blocks with proper syntax highlighting
  const formattedContent = content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      return `<pre class="code-block ${language || ''}"><code>${escapeHtml(code.trim())}</code></pre>`;
    })
    // Format single backtick code snippets
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Format links
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
    // Format bullet points
    .replace(/^\s*[-*+]\s+(.*)$/gm, '<li>$1</li>')
    // Format numbered lists
    .replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li value="$1">$2</li>')
    // Handle paragraphs
    .split('\n\n').map(paragraph => {
      if (paragraph.trim().startsWith('<li>') && paragraph.trim().endsWith('</li>')) {
        return `<ul>${paragraph}</ul>`;
      }
      return `<p>${paragraph}</p>`;
    }).join('');

  return formattedContent;
};

// Helper to escape HTML for code blocks
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}; 