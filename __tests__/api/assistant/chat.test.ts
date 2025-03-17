import { NextRequest } from 'next/server';
import { AIPersonality } from '@/types/ai';
import * as openaiAssistant from '@/lib/api/openai-assistant';
import * as chatHistory from '@/lib/api/chat-history';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => {
      return {
        status: options?.status || 200,
        json: async () => data
      };
    })
  }
}));

// Mock the route module
jest.mock('@/app/api/assistant/chat/route', () => {
  // Import the actual implementation
  const actual = jest.requireActual('@/app/api/assistant/chat/route');
  
  // Return a modified version
  return {
    ...actual,
    POST: jest.fn(actual.POST)
  };
});

// Import the mocked version
import { POST } from '@/app/api/assistant/chat/route';

// Mock the OpenAI client and its methods
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    beta: {
      threads: {
        runs: {
          create: jest.fn().mockResolvedValue({ id: 'run-123' }),
          retrieve: jest.fn().mockResolvedValue({ status: 'completed' }),
        },
        messages: {
          list: jest.fn().mockResolvedValue({
            data: [
              {
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: { value: 'This is a test response' },
                  },
                ],
                assistant_id: 'assistant-123',
              },
            ],
          }),
        },
      },
    },
  }));
});

// Mock the helper functions
jest.mock('@/lib/api/openai-assistant', () => ({
  getAssistantId: jest.fn().mockReturnValue('assistant-123'),
  createThread: jest.fn().mockResolvedValue('thread-123'),
  addMessageToThread: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/api/chat-history', () => ({
  saveChatMessage: jest.fn().mockResolvedValue(undefined),
}));

// Helper to create mock requests
function createMockRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('Assistant Chat API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should return 400 if message is missing', async () => {
    const request = createMockRequest({
      userId: 'user-123',
      personality: 'tobo' as AIPersonality,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing message');
  });

  it('should return 400 if personality is missing', async () => {
    const request = createMockRequest({
      userId: 'user-123',
      message: 'Hello',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing personality');
  });

  it('should return 400 if userId is missing', async () => {
    const request = createMockRequest({
      message: 'Hello',
      personality: 'tobo' as AIPersonality,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing userId');
  });

  it('should process a message successfully with existing threadId', async () => {
    const request = createMockRequest({
      userId: 'user-123',
      message: 'Hello',
      personality: 'tobo' as AIPersonality,
      threadId: 'existing-thread-123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.content).toBe('This is a test response');
    expect(data.threadId).toBe('existing-thread-123');

    // Verify API calls
    expect(openaiAssistant.getAssistantId).toHaveBeenCalledWith('tobo');
    expect(openaiAssistant.addMessageToThread).toHaveBeenCalledWith('existing-thread-123', 'Hello');
    
    // Verify message saving
    expect(chatHistory.saveChatMessage).toHaveBeenCalledTimes(2);
  });

  it('should create a new thread if one does not exist', async () => {
    const request = createMockRequest({
      userId: 'user-123',
      message: 'Hello',
      personality: 'tobo' as AIPersonality,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.content).toBe('This is a test response');
    expect(data.threadId).toBe('thread-123');

    // Verify thread creation
    expect(openaiAssistant.createThread).toHaveBeenCalled();
  });

  it('should handle OpenAI error', async () => {
    // Mock a failure in the OpenAI client
    const openaiError = new Error('OpenAI API error');
    const mockCreate = openaiAssistant.createThread as jest.Mock;
    mockCreate.mockRejectedValueOnce(openaiError);

    const request = createMockRequest({
      userId: 'user-123',
      message: 'Hello',
      personality: 'tobo' as AIPersonality,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('OpenAI API error');
  });

  it('should handle run failure', async () => {
    // Mock OpenAI run failure
    const mockOpenAI = require('openai');
    const mockRetrieve = mockOpenAI().beta.threads.runs.retrieve as jest.Mock;
    mockRetrieve.mockResolvedValueOnce({ 
      status: 'failed', 
      last_error: { message: 'Run failed for some reason' } 
    });

    const request = createMockRequest({
      userId: 'user-123',
      message: 'Hello',
      personality: 'tobo' as AIPersonality,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // It's still a successful API response
    expect(data.status).toBe('failed');
    expect(data.error).toBe('Run failed for some reason');
  });
}); 