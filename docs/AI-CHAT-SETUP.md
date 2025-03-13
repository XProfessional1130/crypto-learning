# AI Chat Feature Setup Guide

This document explains how to set up the AI chat feature for the Learning Crypto platform.

## Prerequisites

- OpenAI API key
- Supabase account with your project set up
- Node.js and npm installed

## Setup Steps

### 1. Install Dependencies

The following dependencies are needed for the AI chat functionality:

```bash
npm install openai ai
```

### 2. Configure Environment Variables

Update your `.env.local` file with the following environment variables:

```
OPENAI_API_KEY=your-openai-api-key
```

Replace `your-openai-api-key` with your actual OpenAI API key.

### 3. Create the Supabase Table

Run the SQL migration script to create the necessary table:

```bash
npx supabase db run --file supabase/migrations/20240313_chat_messages.sql
```

Alternatively, you can run the SQL commands directly in the Supabase SQL editor.

### 4. Test the Integration

1. Start the development server:

```bash
npm run dev
```

2. Navigate to the chat page at `http://localhost:3000/chat`
3. Try sending messages to test the AI integration

## AI Personalities

The platform includes two AI personalities:

1. **Tobo** - Simple, concise explanations with a friendly tone
2. **Heido** - Detailed, analytical explanations with a formal tone

You can customize these personalities by editing the `lib/config/ai-personalities.ts` file.

## Customizing Responses

To customize how the AI responds:

1. Edit the system prompts in `lib/config/ai-personalities.ts`
2. Modify the OpenAI parameters in `lib/services/openai.ts`

## Troubleshooting

If you encounter issues:

1. Check the console logs for errors
2. Verify your OpenAI API key is valid
3. Ensure the Supabase table has been created correctly
4. Check network requests in your browser's developer tools

## Future Enhancements

For future development, consider adding:

- YouTube integration to reference relevant videos
- Article integration to reference website content
- Referral link integration for monetization
- Analytics to track popular topics
- Conversation history view

## API Usage Costs

Be aware that using OpenAI's API incurs costs based on usage. Monitor your usage in the OpenAI dashboard to avoid unexpected charges.

## Security Considerations

- The OpenAI API key should be kept secure and never exposed in client-side code
- User conversations are stored in Supabase and protected by Row Level Security
- Consider implementing rate limiting to prevent abuse 