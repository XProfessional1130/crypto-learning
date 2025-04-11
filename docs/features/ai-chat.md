# AI Chat System

This document explains the AI chat functionality in the Learning Crypto Platform.

## Overview

The AI chat system allows users to interact with an AI assistant to learn about cryptocurrency concepts, get market insights, and receive personalized guidance. The system leverages OpenAI's API to provide intelligent responses while maintaining conversation context.

## Key Components

- OpenAI API integration for natural language processing
- Chat history persistence in Supabase
- Context-aware conversations that remember user interactions
- Cryptocurrency knowledge base for accurate information
- Multiple AI personalities for different user preferences

## AI Personalities

The platform has two AI assistants:

1. **Tobo** - Simple, friendly explanations for beginners
2. **Heido** - Detailed, formal analysis for advanced users

Personalities are customized in `lib/config/ai-personalities.ts`.

## Setup and Installation

### Prerequisites

- OpenAI API key
- Supabase project
- Node.js and npm

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install openai ai
   ```

2. **Configure Environment**
   Add to `.env.local`:
   ```
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Create Database Table**
   Run migration:
   ```bash
   npx supabase db run --file supabase/migrations/20240313_chat_messages.sql
   ```
   Or run SQL directly in Supabase SQL editor.

4. **Test Setup**
   - Start server: `npm run dev`
   - Go to `http://localhost:3000/chat`
   - Send test messages

## Database Schema

The chat system uses the following table structure:

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  personality TEXT CHECK (personality IN ('tobo', 'heido')),
  thread_id TEXT,
  assistant_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

Row Level Security (RLS) policies ensure that users can only access their own chat history.

## Customization

- Edit system prompts in `lib/config/ai-personalities.ts`
- Modify OpenAI parameters in `lib/services/openai.ts`
- Adjust the UI in `components/features/chat/`

## Troubleshooting

If issues occur:
1. Check console errors
2. Verify API key is valid
3. Confirm database table creation
4. Inspect network requests for API errors

## Cost Management

OpenAI API usage incurs costs based on token usage. Monitor your usage in the OpenAI dashboard to avoid unexpected charges. Consider implementing:

- Rate limiting for users
- Token caps per conversation
- Usage tracking by user tier

## Future Features

Planned enhancements:
- YouTube integration for referenced content
- Article references from Learning Crypto content
- Referral links for recommended products/services
- Usage analytics for admin dashboard
- Enhanced conversation history management 