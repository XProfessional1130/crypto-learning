# Chat Component Refactoring

This directory contains the refactored chat components that were originally nested within `ChatModal.tsx`.

## Component Structure

- **MessageBubble.tsx**: Renders individual chat messages, including styling for user vs. assistant messages and typing animations
- **PersonalitySelector.tsx**: Provides the UI for switching between AI personalities (Tobot and Heido)
- **SuggestedPrompts.tsx**: Displays prompt suggestions for users to start conversations
- **utils.ts**: Contains shared utilities like formatMessageContent and sample prompts

## Swipe-to-Chat Functionality

The chat system now includes a streamlined mobile experience with a clear and simple swipe access feature:

1. **Visible Tab Indicator**: A bright, high-contrast tab with "CHAT" text appears on the right edge of the screen
2. **Simple Swipe Gesture**: Users can swipe from the right edge to instantly open the chat modal
3. **Clear Introduction**: New users receive a straightforward message explaining the swipe feature
4. **Easy Dismissal**: Users can hide the indicator by tapping the small "x" button 

The design prioritizes visibility and usability with a clear, unmistakable indicator.

## Refactoring Benefits

1. **Improved Maintainability**: Each component is now in its own file, making it easier to find and modify specific parts of the UI
2. **Reduced Duplication**: Common functions and constants have been extracted to shared files
3. **Better Organization**: Components are grouped by functionality
4. **Simpler Imports**: Components can be imported directly without duplicating code
5. **Enhanced Mobile UX**: The straightforward swipe tab makes the chat easily accessible across the site

## Usage

To use these components, import them from their respective files:

```jsx
import MessageBubble from '@/components/chat/MessageBubble';
import PersonalitySelector from '@/components/chat/PersonalitySelector';
import SuggestedPrompts from '@/components/chat/SuggestedPrompts';
import { formatMessageContent, samplePrompts } from '@/components/chat/utils';
```

## Hook Improvements

The `useAssistantChat` hook has also been refactored to:

1. Use a centralized error handling utility
2. Reduce code duplication in networking and state management
3. Simplify connection and streaming logic
4. Improve cleanup of resources
5. Better organize related functionality 