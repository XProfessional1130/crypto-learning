/**
 * Format message content for display
 * Handles typing state and formatting special characters
 */
export const formatMessageContent = (content: string, isBeingTyped = false) => {
  // Handle undefined or null content
  if (!content) return '';
  
  // Trim the content to remove whitespace
  const trimmedContent = content.trim();
  
  // If this message is currently being typed, remove any ellipsis
  if (isBeingTyped) {
    // Remove all types of ellipsis from anywhere in the text
    return trimmedContent.replace(/\.{3,}|…/g, '');
  }
  
  // Process markdown formatting
  let formattedContent = trimmedContent;
  
  // Handle code blocks first (```code```)
  formattedContent = formattedContent.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-md my-3 overflow-x-auto"><code>$1</code></pre>'
  );
  
  // Handle horizontal rules (---, ***, ___)
  formattedContent = formattedContent.replace(
    /^(\*{3,}|-{3,}|_{3,})$/gm,
    '<hr class="my-4 border-t border-gray-300 dark:border-gray-700">'
  );
  
  // Replace headings with appropriate HTML tags
  // H1: # Heading
  formattedContent = formattedContent.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
  // H2: ## Heading
  formattedContent = formattedContent.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  // H3: ### Heading
  formattedContent = formattedContent.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>');
  // H4: #### Heading
  formattedContent = formattedContent.replace(/^#### (.*?)$/gm, '<h4 class="text-base font-bold mt-3 mb-1">$1</h4>');
  // H5: ##### Heading
  formattedContent = formattedContent.replace(/^##### (.*?)$/gm, '<h5 class="text-sm font-bold mt-2 mb-1">$1</h5>');
  // H6: ###### Heading
  formattedContent = formattedContent.replace(/^###### (.*?)$/gm, '<h6 class="text-xs font-bold mt-2 mb-1">$1</h6>');
  
  // Process lists - must be done before other inline formatting

  // Handle multi-line unordered lists
  // Find all consecutive lines starting with - or * and wrap them in <ul><li>...</li></ul>
  formattedContent = formattedContent.replace(
    /(^[*-] .*?$(\n^[*-] .*?$)*)/gm,
    (match) => {
      // Replace each line with <li>...</li>
      const listItems = match.split('\n').map(line => 
        `<li>${line.replace(/^[*-] /, '')}</li>`
      ).join('');
      return `<ul class="list-disc ml-5 my-2">${listItems}</ul>`;
    }
  );

  // Handle multi-line ordered lists
  // Find all consecutive lines starting with 1. 2. etc and wrap them in <ol><li>...</li></ol>
  formattedContent = formattedContent.replace(
    /(^[0-9]+\. .*?$(\n^[0-9]+\. .*?$)*)/gm,
    (match) => {
      // Replace each line with <li>...</li>
      const listItems = match.split('\n').map(line => 
        `<li>${line.replace(/^[0-9]+\. /, '')}</li>`
      ).join('');
      return `<ol class="list-decimal ml-5 my-2">${listItems}</ol>`;
    }
  );
  
  // Handle paragraph breaks
  formattedContent = formattedContent.replace(/\n\n/g, '</p><p class="mb-3">');
  
  // Replace **text** with <strong>text</strong> for bold formatting
  // Note: Must process bold before italic to avoid format interference
  formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace _text_ or *text* with <em>text</em> for italic formatting
  // We use a pattern that won't match inside already processed bold text
  formattedContent = formattedContent.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  formattedContent = formattedContent.replace(/\_(.*?)\_/g, '<em>$1</em>');
  
  // Replace `code` with <code>code</code> for inline code
  formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm font-mono">$1</code>');
  
  // Replace [text](url) with <a href="url">text</a> for links
  formattedContent = formattedContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-primary underline">$1</a>');
  
  // Wrap the content in paragraph tags if not already done
  if (!formattedContent.includes('<p') && !formattedContent.startsWith('<h') && !formattedContent.startsWith('<ul') && 
      !formattedContent.startsWith('<ol') && !formattedContent.startsWith('<pre')) {
    formattedContent = `<p>${formattedContent}</p>`;
  }
  
  // Return the formatted content with HTML tags for markdown
  return formattedContent;
};

// Sample prompts for new users
export const samplePrompts = [
  {
    text: "Explain blockchain technology in simple terms",
    personality: "tobo" as const
  },
  {
    text: "What's the difference between Bitcoin and Ethereum?",
    personality: "tobo" as const
  },
  {
    text: "How do smart contracts work?",
    personality: "heido" as const
  },
  {
    text: "What are NFTs and why are they valuable?",
    personality: "tobo" as const
  },
  {
    text: "Explain what DeFi (Decentralized Finance) is and its main applications",
    personality: "heido" as const
  },
  {
    text: "What are the environmental concerns with Bitcoin mining?",
    personality: "tobo" as const
  },
  {
    text: "How do cryptocurrency wallets work?",
    personality: "tobo" as const
  },
  {
    text: "What is the difference between a hot wallet and a cold wallet?",
    personality: "heido" as const
  },
  {
    text: "Explain how proof of stake works compared to proof of work",
    personality: "heido" as const
  },
  {
    text: "What are Layer 2 solutions and why are they important?",
    personality: "tobo" as const
  },
  {
    text: "What is the Metaverse and how is it related to crypto?",
    personality: "tobo" as const
  },
  {
    text: "How do stablecoins maintain their value?",
    personality: "heido" as const
  },
  {
    text: "What are the risks of investing in cryptocurrencies?",
    personality: "tobo" as const
  },
  {
    text: "Explain what 'gas fees' are in Ethereum",
    personality: "heido" as const
  },
  {
    text: "What is a DAO (Decentralized Autonomous Organization)?",
    personality: "heido" as const
  },
  {
    text: "How do blockchain bridges work?",
    personality: "tobo" as const
  }
]; 