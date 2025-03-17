import { renderHook, act } from '@testing-library/react-hooks';
import { useAssistantChat } from '@/hooks/shared/useAssistantChat';
import * as useChatAPI from '@/hooks/shared/useChatAPI';
import * as useChatHistory from '@/hooks/shared/useChatHistory';
import * as usePersonality from '@/hooks/shared/usePersonality';
import { AIPersonality } from '@/types/ai';

// Mock the dependent hooks
jest.mock('@/hooks/shared/useChatAPI', () => ({
  useChatAPI: jest.fn()
}));

jest.mock('@/hooks/shared/useChatHistory', () => ({
  useChatHistory: jest.fn()
}));

jest.mock('@/hooks/shared/usePersonality', () => ({
  usePersonality: jest.fn()
}));

jest.mock('@/hooks/shared/useChat', () => ({
  useChat: jest.fn().mockReturnValue({
    messages: [],
    setMessages: jest.fn(),
    inputMessage: '',
    handleInputChange: jest.fn(),
    clearInput: jest.fn(),
    addUserMessage: jest.fn().mockReturnValue({ id: 'user-msg-1' }),
    addAssistantMessage: jest.fn().mockReturnValue({ id: 'assistant-msg-1' }),
    updateMessage: jest.fn(),
  })
}));

jest.mock('@/hooks/shared/useChatTyping', () => ({
  useChatTyping: jest.fn().mockReturnValue({
    isTyping: false,
    typingMessageId: null,
    typingContent: '',
    startTyping: jest.fn(),
    skipTypingAnimation: jest.fn(),
  })
}));

describe('useAssistantChat', () => {
  // Set up mock implementations for each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock useChatAPI implementation
    (useChatAPI.useChatAPI as jest.Mock).mockReturnValue({
      sendMessage: jest.fn().mockResolvedValue({
        messageId: 'msg-123',
        content: 'Test response'
      }),
      cancelRequest: jest.fn(),
      isProcessing: false
    });
    
    // Mock useChatHistory implementation
    (useChatHistory.useChatHistory as jest.Mock).mockReturnValue({
      threadId: null,
      setThreadId: jest.fn(),
      isLoadingThread: false,
      loadThread: jest.fn().mockResolvedValue([]),
      saveThread: jest.fn().mockResolvedValue(true),
      deleteThread: jest.fn().mockResolvedValue(true)
    });
    
    // Mock usePersonality implementation
    (usePersonality.usePersonality as jest.Mock).mockReturnValue({
      activePersonality: 'tobo' as AIPersonality,
      switchPersonality: jest.fn(),
      togglePersonality: jest.fn(),
      getPersonalityName: jest.fn().mockReturnValue('Tobot')
    });
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAssistantChat({
      userId: 'user-123'
    }));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.inputMessage).toBe('');
    expect(result.current.isTyping).toBe(false);
    expect(result.current.activePersonality).toBe('tobo');
    expect(result.current.threadId).toBeNull();
  });
  
  it('should send a message correctly', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({
      messageId: 'msg-123',
      content: 'Test response'
    });
    
    (useChatAPI.useChatAPI as jest.Mock).mockReturnValue({
      sendMessage: mockSendMessage,
      cancelRequest: jest.fn(),
      isProcessing: false
    });
    
    const onSendMock = jest.fn();
    
    const { result } = renderHook(() => useAssistantChat({
      userId: 'user-123',
      onSend: onSendMock
    }));
    
    await act(async () => {
      await result.current.sendMessage('Hello');
    });
    
    // Check that onSend was called
    expect(onSendMock).toHaveBeenCalled();
    
    // Check that the API was called with correct parameters
    expect(mockSendMessage).toHaveBeenCalledWith(
      'Hello',
      'tobo',
      null,
      []
    );
  });
  
  it('should handle API errors gracefully', async () => {
    const error = new Error('API Error');
    const mockSendMessage = jest.fn().mockRejectedValue(error);
    
    (useChatAPI.useChatAPI as jest.Mock).mockReturnValue({
      sendMessage: mockSendMessage,
      cancelRequest: jest.fn(),
      isProcessing: false
    });
    
    const onErrorMock = jest.fn();
    
    const { result } = renderHook(() => useAssistantChat({
      userId: 'user-123',
      onError: onErrorMock
    }));
    
    await act(async () => {
      await result.current.sendMessage('Hello');
    });
    
    // Check that onError was called with the error
    expect(onErrorMock).toHaveBeenCalledWith(error);
  });
  
  it('should load a thread correctly', async () => {
    const mockLoadThread = jest.fn().mockResolvedValue([
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'Hi there', personality: 'tobo' as AIPersonality }
    ]);
    
    const mockSetMessages = jest.fn();
    const mockSwitchPersonality = jest.fn();
    
    (useChatHistory.useChatHistory as jest.Mock).mockReturnValue({
      threadId: null,
      setThreadId: jest.fn(),
      isLoadingThread: false,
      loadThread: mockLoadThread,
      saveThread: jest.fn(),
      deleteThread: jest.fn()
    });
    
    (usePersonality.usePersonality as jest.Mock).mockReturnValue({
      activePersonality: 'haido' as AIPersonality,
      switchPersonality: mockSwitchPersonality,
      togglePersonality: jest.fn(),
      getPersonalityName: jest.fn()
    });
    
    const useChatMock = {
      messages: [],
      setMessages: mockSetMessages,
      inputMessage: '',
      handleInputChange: jest.fn(),
      clearInput: jest.fn(),
      addUserMessage: jest.fn(),
      addAssistantMessage: jest.fn(),
      updateMessage: jest.fn(),
    };
    
    jest.spyOn(require('@/hooks/shared/useChat'), 'useChat').mockReturnValue(useChatMock);
    
    const { result } = renderHook(() => useAssistantChat({
      userId: 'user-123'
    }));
    
    await act(async () => {
      await result.current.loadThread('thread-123');
    });
    
    // Check that loadThread was called
    expect(mockLoadThread).toHaveBeenCalledWith('thread-123');
    
    // Check that messages were set correctly
    expect(mockSetMessages).toHaveBeenCalled();
    
    // Check that personality was switched
    expect(mockSwitchPersonality).toHaveBeenCalledWith('tobo');
  });
  
  it('should switch personality correctly', () => {
    const mockSwitchPersonality = jest.fn();
    const mockSetThreadId = jest.fn();
    
    (usePersonality.usePersonality as jest.Mock).mockReturnValue({
      activePersonality: 'tobo' as AIPersonality,
      switchPersonality: mockSwitchPersonality,
      togglePersonality: jest.fn(),
      getPersonalityName: jest.fn()
    });
    
    (useChatHistory.useChatHistory as jest.Mock).mockReturnValue({
      threadId: 'thread-123',
      setThreadId: mockSetThreadId,
      isLoadingThread: false,
      loadThread: jest.fn(),
      saveThread: jest.fn(),
      deleteThread: jest.fn()
    });
    
    const { result } = renderHook(() => useAssistantChat({
      userId: 'user-123'
    }));
    
    act(() => {
      result.current.switchPersonality('haido' as AIPersonality);
    });
    
    // Check that personality was switched
    expect(mockSwitchPersonality).toHaveBeenCalledWith('haido');
    
    // Check that threadId was reset
    expect(mockSetThreadId).toHaveBeenCalledWith(null);
  });
}); 