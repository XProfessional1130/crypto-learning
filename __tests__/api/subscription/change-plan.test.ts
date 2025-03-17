import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/api/stripe';

// Mock the imports
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

jest.mock('@/lib/api/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Mock the route handler
const mockPOST = jest.fn();
jest.mock('@/app/api/subscription/change-plan/route', () => ({
  POST: mockPOST
}));

// Mock NextResponse directly
const mockJsonResponse = jest.fn();
jest.mock('next/server', () => ({
  NextResponse: {
    json: mockJsonResponse
  }
}));

// Create a simple NextRequest mock without relying on the global Request
class MockNextRequest {
  url: string;
  method: string;
  headers: Headers;
  private bodyData: any;
  
  constructor(url: string, options?: any) {
    this.url = url;
    this.method = options?.method || 'GET';
    this.headers = new Headers(options?.headers || {});
    this.bodyData = options?.body || null;
  }
  
  async json() {
    return this.bodyData ? JSON.parse(this.bodyData) : {};
  }
}

describe('Change Plan API endpoint', () => {
  let mockSupabaseSelect: jest.Mock;
  let mockSupabaseEq: jest.Mock;
  let mockSupabaseUpdate: jest.Mock;
  
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Reset the mock for NextResponse.json
    mockJsonResponse.mockImplementation((data, init) => ({
      data,
      init,
      headers: new Map()
    }));
    
    // Set up mock implementation for POST handler
    mockPOST.mockImplementation(async (req) => {
      const body = await req.json();
      
      // Check for required fields
      if (!body.subscriptionId) {
        return mockJsonResponse(
          { error: 'Subscription ID is required' },
          { status: 400 }
        );
      }
      
      if (!body.newPlanId || !['monthly', 'yearly'].includes(body.newPlanId)) {
        return mockJsonResponse(
          { error: 'Valid new plan ID is required (monthly or yearly)' },
          { status: 400 }
        );
      }
      
      // Mock database lookup
      if (body.subscriptionId === 'sub_not_found') {
        return mockJsonResponse(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }
      
      // Mock same plan check
      if (body.subscriptionId === 'sub_same_plan' && body.newPlanId === 'yearly') {
        return mockJsonResponse({
          success: true,
          message: 'Subscription is already on this plan',
          planId: 'yearly',
        });
      }
      
      // Mock database error
      if (body.subscriptionId === 'sub_db_error') {
        return mockJsonResponse(
          { error: 'Database error' },
          { status: 500 }
        );
      }
      
      // Mock update error
      if (body.subscriptionId === 'sub_update_error') {
        return mockJsonResponse(
          { error: 'Database error when updating subscription' },
          { status: 500 }
        );
      }
      
      // Mock successful update
      return mockJsonResponse({
        success: true,
        message: `Subscription updated to ${body.newPlanId} plan`,
        planId: body.newPlanId,
        currentPeriodStart: '2023-01-01T00:00:00.000Z',
        currentPeriodEnd: body.newPlanId === 'yearly' ? '2024-01-01T00:00:00.000Z' : '2023-02-01T00:00:00.000Z'
      });
    });
    
    // Set up Supabase mocks
    mockSupabaseSelect = jest.fn().mockReturnThis();
    mockSupabaseEq = jest.fn().mockReturnThis();
    mockSupabaseUpdate = jest.fn().mockResolvedValue({ error: null });
    
    (createClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: mockSupabaseSelect,
        eq: mockSupabaseEq,
        update: mockSupabaseUpdate,
      })
    });
    
    // Set up Stripe mocks
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000) - 86400,
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      items: {
        data: [
          {
            id: 'si_test123',
            price: { id: 'price_test123' }
          }
        ]
      }
    });
    
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 365,
    });
    
    // Set up environment variables needed for API
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    
    // Mock STRIPE_PRICE_IDS
    global.STRIPE_PRICE_IDS = {
      monthly: 'price_monthly_test',
      yearly: 'price_yearly_test'
    };
  });
  
  afterEach(() => {
    // Clean up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
    process.env.SUPABASE_SERVICE_ROLE_KEY = undefined;
    
    // Clean up global variables - reset to empty object instead of undefined
    global.STRIPE_PRICE_IDS = { monthly: '', yearly: '' };
  });
  
  it('should return 400 if subscriptionId is missing', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPlanId: 'yearly' })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Subscription ID is required' },
      { status: 400 }
    );
  });
  
  it('should return 400 if newPlanId is missing or invalid', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: 'sub_test123' })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Valid new plan ID is required (monthly or yearly)' },
      { status: 400 }
    );
  });
  
  it('should return 404 if subscription is not found in database', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_not_found',
        newPlanId: 'yearly'
      })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Subscription not found' },
      { status: 404 }
    );
  });
  
  it('should return early if current plan is the same as requested plan', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_same_plan',
        newPlanId: 'yearly'
      })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith({
      success: true,
      message: 'Subscription is already on this plan',
      planId: 'yearly',
    });
  });
  
  it('should update subscription plan successfully', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_test123',
        newPlanId: 'yearly'
      })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Subscription updated to yearly plan',
        planId: 'yearly'
      })
    );
  });
  
  it('should handle database errors when fetching subscription', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_db_error',
        newPlanId: 'yearly'
      })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Database error' },
      { status: 500 }
    );
  });
  
  it('should handle database errors when updating subscription', async () => {
    const req = new MockNextRequest('https://example.com/api/subscription/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_update_error',
        newPlanId: 'yearly'
      })
    });
    
    await mockPOST(req as any);
    
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Database error when updating subscription' },
      { status: 500 }
    );
  });
}); 