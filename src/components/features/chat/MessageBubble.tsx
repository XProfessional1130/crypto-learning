import React from 'react';
import Image from 'next/image';
import { ChatMessage } from '@/types';
import styles from '@/styles/chat.module.css';

// Personality profile images
export const personalityImages = {
  tobo: '/images/avatars/tobo-avatar.svg',
  heido: '/images/avatars/heido-avatar.svg',
};

interface MessageBubbleProps {
  message: ChatMessage;
  isTyping: boolean;
  typingMessageId: string | null;
  formatMessageContent: (content: string, isBeingTyped: boolean) => string;
  isDarkMode: boolean;
  onSkipTyping: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isTyping,
  typingMessageId,
  formatMessageContent,
  isDarkMode,
  onSkipTyping
}) => {
  // Check if this message is currently being typed
  const isBeingTyped = isTyping && typingMessageId === message.id;

  return (
    <div
      className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        {message.role === 'assistant' && (
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 flex items-center justify-center bg-brand-100 dark:bg-brand-800/50">
              <Image
                src={personalityImages[message.personality as keyof typeof personalityImages] || personalityImages.tobo}
                alt={message.personality === 'tobo' ? 'Tobot' : 'Haido'}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`${styles.messageBubble} ${
            message.role === 'user'
              ? isDarkMode 
                ? styles.userMessageBubble
                : styles.userMessageBubbleLight
              : isDarkMode
                ? styles.assistantMessageBubble
                : styles.assistantMessageBubbleLight
          } ${message.role === 'user' ? 'ml-2' : ''} relative`}
        >
          <div className={`${styles['message-content']} ${styles.smoothMessage} ${
            message.role === 'user' ? 'text-brand-primary-dark' : isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {isBeingTyped ? (
              // When typing is in progress, determine whether to show dots or content
              message.content && message.content.trim().length > 5 ? (
                // Only show content when there's a reasonable amount of text
                <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content, true) }} />
              ) : (
                // Otherwise show the bouncing dots (during initial connection or first few chars)
                <span className="inline-block">
                  <div className={styles.bouncingDots}>
                    <div className={`${styles.dot} ${styles.dot1}`}></div>
                    <div className={`${styles.dot} ${styles.dot2}`}></div>
                    <div className={`${styles.dot} ${styles.dot3}`}></div>
                  </div>
                </span>
              )
            ) : (
              // When not typing, just show the message content
              <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content || '', false) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 