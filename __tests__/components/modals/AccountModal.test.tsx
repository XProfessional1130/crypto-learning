import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountModal from '@/app/components/modals/AccountModal';
import useSubscription from '@/lib/hooks/useSubscription';
import { User } from '@supabase/supabase-js';

// Mock the useSubscription hook
jest.mock('@/lib/hooks/useSubscription', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('AccountModal', () => {
  // Mock user data
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01'
  } as User;
  
  // Mock subscription data
  const mockSubscription = {
    id: 'sub_test123',
    stripe_subscription_id: 'sub_stripe123',
    user_id: 'test-user-id',
    plan_id: 'monthly',
    status: 'active',
    current_period_start: '2023-01-01T00:00:00.000Z',
    current_period_end: '2023-02-01T00:00:00.000Z',
    cancel_at_period_end: false
  };
  
  // Mock hook return functions
  const mockCancelSubscription = jest.fn().mockResolvedValue({ success: true, message: 'Subscription canceled' });
  const mockReactivateSubscription = jest.fn().mockResolvedValue({ success: true, message: 'Subscription reactivated' });
  const mockOpenCustomerPortal = jest.fn().mockResolvedValue({ success: true, url: 'https://example.com/portal' });
  const mockChangeBillingPlan = jest.fn().mockResolvedValue({ success: true, message: 'Plan changed', planId: 'yearly' });
  
  const mockOnSignOut = jest.fn().mockResolvedValue(undefined);
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default hook implementation
    (useSubscription as jest.Mock).mockReturnValue({
      subscription: mockSubscription,
      isLoading: false,
      error: null,
      cancelSubscription: mockCancelSubscription,
      reactivateSubscription: mockReactivateSubscription,
      openCustomerPortal: mockOpenCustomerPortal,
      changeBillingPlan: mockChangeBillingPlan
    });
    
    // Mock window.location.href for customer portal
    delete window.location;
    window.location = { href: '' } as Location;
    
    // Mock the Dialog implementation for Headless UI
    jest.mock('@headlessui/react', () => ({
      Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      'Dialog.Panel': ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      'Dialog.Title': ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>
    }));
  });
  
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    
    // Modal should not be present in the DOM
    expect(container.firstChild).toBeNull();
  });
  
  it('should display user information when open', () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Check for user email
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('should display loading state while subscription is loading', () => {
    (useSubscription as jest.Mock).mockReturnValue({
      subscription: null,
      isLoading: true,
      error: null,
      cancelSubscription: mockCancelSubscription,
      reactivateSubscription: mockReactivateSubscription,
      openCustomerPortal: mockOpenCustomerPortal,
      changeBillingPlan: mockChangeBillingPlan
    });
    
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Should show loading UI
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
  
  it('should display "No Subscription" message when user has no subscription', () => {
    (useSubscription as jest.Mock).mockReturnValue({
      subscription: null,
      isLoading: false,
      error: null,
      cancelSubscription: mockCancelSubscription,
      reactivateSubscription: mockReactivateSubscription,
      openCustomerPortal: mockOpenCustomerPortal,
      changeBillingPlan: mockChangeBillingPlan
    });
    
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(screen.getByText('No Subscription')).toBeInTheDocument();
    expect(screen.getByText(/You don't have an active subscription/)).toBeInTheDocument();
    expect(screen.getByText('View Plans')).toBeInTheDocument();
  });
  
  it('should display subscription details when user has an active subscription', () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Use getAllByText and check that at least one element with "Monthly" exists
    expect(screen.getAllByText('Monthly').length).toBeGreaterThan(0);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  
  it('should handle canceling a subscription', async () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click cancel button
    const cancelButton = screen.getByText('Cancel Subscription');
    fireEvent.click(cancelButton);
    
    // Verify the cancelSubscription function was called
    expect(mockCancelSubscription).toHaveBeenCalled();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Subscription canceled')).toBeInTheDocument();
    });
  });
  
  it('should handle reactivating a subscription', async () => {
    // Mock a subscription that is set to cancel
    (useSubscription as jest.Mock).mockReturnValue({
      subscription: { ...mockSubscription, cancel_at_period_end: true },
      isLoading: false,
      error: null,
      cancelSubscription: mockCancelSubscription,
      reactivateSubscription: mockReactivateSubscription,
      openCustomerPortal: mockOpenCustomerPortal,
      changeBillingPlan: mockChangeBillingPlan
    });
    
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click reactivate button
    const reactivateButton = screen.getByText('Reactivate Subscription');
    fireEvent.click(reactivateButton);
    
    // Verify the reactivateSubscription function was called
    expect(mockReactivateSubscription).toHaveBeenCalled();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Subscription reactivated')).toBeInTheDocument();
    });
  });
  
  it('should handle opening the customer portal', async () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click billing history button
    const portalButton = screen.getByText('Billing History');
    fireEvent.click(portalButton);
    
    // Verify the openCustomerPortal function was called
    expect(mockOpenCustomerPortal).toHaveBeenCalled();
    
    // Verify redirect happened
    await waitFor(() => {
      expect(window.location.href).toBe('https://example.com/portal');
    });
  });
  
  it('should handle changing subscription plan', async () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click the Annual button
    const annualButton = screen.getByText(/Annual/);
    fireEvent.click(annualButton);
    
    // Confirmation dialog should appear
    expect(screen.getByText('Confirm Plan Change')).toBeInTheDocument();
    
    // Click confirm button
    const confirmButton = screen.getByText('Confirm Change');
    fireEvent.click(confirmButton);
    
    // Verify the changeBillingPlan function was called with 'yearly'
    expect(mockChangeBillingPlan).toHaveBeenCalledWith('yearly');
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Plan changed')).toBeInTheDocument();
    });
  });
  
  it('should display existing plan message when trying to switch to current plan', async () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click the Monthly button (same as current plan)
    const monthlyButtons = screen.getAllByText('Monthly');
    // Find the button (not the badge) with "Monthly" text
    const monthlyButton = monthlyButtons.find(el => el.tagName.toLowerCase() === 'button');
    expect(monthlyButton).toBeTruthy();
    if (monthlyButton) {
      fireEvent.click(monthlyButton);
    }
    
    // Should display info message without showing confirmation dialog
    await waitFor(() => {
      // Use a more flexible approach to find the message
      const infoMessages = document.querySelectorAll('.bg-blue-50, .dark\\:bg-blue-900\\/20');
      let foundMessage = false;
      infoMessages.forEach(el => {
        if (el.textContent && el.textContent.includes('already on')) {
          foundMessage = true;
        }
      });
      expect(foundMessage).toBe(true);
    });
  });
  
  it('should handle sign out', () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click sign out button
    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);
    
    // Verify the onSignOut function was called
    expect(mockOnSignOut).toHaveBeenCalled();
  });
  
  it('should handle close button', () => {
    render(
      <AccountModal 
        user={mockUser}
        onSignOut={mockOnSignOut}
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Find and click close button (it's an SVG so we'll look for its container)
    const closeButton = document.querySelector('button svg[stroke="currentColor"]')?.closest('button');
    expect(closeButton).not.toBeNull();
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    // Verify the onClose function was called
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 