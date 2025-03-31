# AI Chat Setup

How to set up the AI chat feature for Learning Crypto.

## Prerequisites

- OpenAI API key
- Supabase project
- Node.js and npm

## Setup Steps

### 1. Install Dependencies

```bash
npm install openai ai
```

### 2. Configure Environment

Add to `.env.local`:

```
OPENAI_API_KEY=your-openai-api-key
```

### 3. Create Database Table

Run migration:

```bash
npx supabase db run --file supabase/migrations/20240313_chat_messages.sql
```

Or run SQL directly in Supabase SQL editor.

### 4. Test

1. Start server: `npm run dev`
2. Go to `http://localhost:3000/chat`
3. Send test messages

## AI Personalities

The platform has two AI assistants:

1. **Tobo** - Simple, friendly explanations
2. **Heido** - Detailed, formal analysis

Customize in `lib/config/ai-personalities.ts`.

## Customization

- Edit system prompts in `lib/config/ai-personalities.ts`
- Modify OpenAI parameters in `lib/services/openai.ts`

## Troubleshooting

If issues occur:
1. Check console errors
2. Verify API key
3. Confirm table creation
4. Inspect network requests

## Future Features

Potential enhancements:
- YouTube integration
- Article references
- Referral links
- Usage analytics
- Conversation history

## Cost Awareness

OpenAI API usage incurs costs. Monitor in OpenAI dashboard.

## Security

- Keep API key secure (server-side only)
- User conversations protected by Row Level Security
- Consider rate limiting 