import { renderHook, act } from '@testing-library/react-hooks';
import { useChatAPI } from '@/hooks/shared/useChatAPI';
import fetchMock from 'jest-fetch-mock';

// Mock fetch globally
fetchMock.enableMocks();

describe('useChatAPI', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should handle sending a message successfully', async () => {
    // Mock successful fetch response
    fetchMock.mockResponseOnce(JSON.stringify({
      status: 'completed',
      content: 'This is a test response',
      threadId: 'thread-123'
    }));

    // Mock callbacks
    const onErrorMock = jest.fn();
    const onMessageStartMock = jest.fn();
    const onMessageUpdateMock = jest.fn();
    const onMessageCompleteMock = jest.fn();

    // Render the hook
    const { result } = renderHook(() => useChatAPI({
      userId: 'user-123',
      onError: onErrorMock,
      onMessageStart: onMessageStartMock,
      onMessageUpdate: onMessageUpdateMock,
      onMessageComplete: onMessageCompleteMock
    }));

    // Send a message
    let response;
    await act(async () => {
      response = await result.current.sendMessage('Hello', 'tobo', 'thread-123', []);
    });

    // Check the fetch was called correctly
    expect(fetchMock).toHaveBeenCalledWith('/api/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user-123',
        message: 'Hello',
        personality: 'tobo',
        threadId: 'thread-123',
        messages: [],
      }),
      signal: expect.any(Object),
    });

    // Verify callbacks
    expect(onMessageStartMock).toHaveBeenCalled();
    expect(onMessageCompleteMock).toHaveBeenCalledWith(expect.any(String), 'This is a test response');
    expect(onErrorMock).not.toHaveBeenCalled();

    // Check the returned data
    expect(response).toEqual({
      messageId: expect.any(String),
      content: 'This is a test response'
    });
  });

  it('should handle API errors', async () => {
    // Mock error response
    fetchMock.mockRejectOnce(new Error('Network error'));

    // Mock callbacks
    const onErrorMock = jest.fn();
    const onMessageStartMock = jest.fn();
    const onMessageCompleteMock = jest.fn();

    // Render the hook
    const { result } = renderHook(() => useChatAPI({
      userId: 'user-123',
      onError: onErrorMock,
      onMessageStart: onMessageStartMock,
      onMessageComplete: onMessageCompleteMock
    }));

    // Send a message that will fail
    let response;
    await act(async () => {
      response = await result.current.sendMessage('Hello', 'tobo', null, []);
    });

    // Verify error handling
    expect(onErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Network error'
    }));
    expect(response).toBeNull();
  });

  it('should handle non-OK response', async () => {
    // Mock non-OK response
    fetchMock.mockResponseOnce(JSON.stringify({
      error: 'Bad request'
    }), { status: 400 });

    // Mock callbacks
    const onErrorMock = jest.fn();

    // Render the hook
    const { result } = renderHook(() => useChatAPI({
      userId: 'user-123',
      onError: onErrorMock
    }));

    // Send a message
    let response;
    await act(async () => {
      response = await result.current.sendMessage('Hello', 'tobo', null, []);
    });

    // Verify error handling
    expect(onErrorMock).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('API request failed')
    }));
    expect(response).toBeNull();
  });

  it('should handle canceling a request', async () => {
    // Mock a response that won't resolve immediately
    fetchMock.mockResponse(
      () => new Promise(resolve => setTimeout(() => resolve({ body: 'response' }), 1000))
    );

    // Render the hook
    const { result } = renderHook(() => useChatAPI({
      userId: 'user-123'
    }));

    // Start sending a message (don't await it)
    act(() => {
      result.current.sendMessage('Hello', 'tobo', null, []);
    });

    // Cancel the request
    act(() => {
      result.current.cancelRequest();
    });

    // Fetch should have been called once
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // After cancellation, isProcessing should be false
    expect(result.current.isProcessing).toBe(false);
  });

  it('should not allow multiple concurrent requests', async () => {
    // Mock console.warn
    const originalWarn = console.warn;
    console.warn = jest.fn();

    // Mock a slow response
    fetchMock.mockResponse(
      () => new Promise(resolve => setTimeout(() => resolve({ body: JSON.stringify({ content: 'response' }) }), 100))
    );

    // Render the hook
    const { result } = renderHook(() => useChatAPI({
      userId: 'user-123'
    }));

    // Start sending a message
    let firstPromise: Promise<any> | null = null;
    act(() => {
      firstPromise = result.current.sendMessage('First message', 'tobo', null, []);
    });

    // Try to send another message immediately
    let secondResponse: any;
    await act(async () => {
      secondResponse = await result.current.sendMessage('Second message', 'tobo', null, []);
    });

    // Second message should be ignored
    expect(secondResponse).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Already processing'));
    
    // Only one fetch call should have been made
    expect(fetchMock).toHaveBeenCalledTimes(1);
    
    // Wait for the first message to complete
    if (firstPromise) {
      await firstPromise;
    }

    // Restore console.warn
    console.warn = originalWarn;
  });
}); 