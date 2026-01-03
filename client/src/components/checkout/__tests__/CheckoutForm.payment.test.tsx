import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutForm } from '../CheckoutForm';
import { processPayUPayment } from '@/lib/payu-service';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Mock dependencies
vi.mock('@/lib/payu-service', () => ({
  processPayUPayment: vi.fn(),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('@/hooks/use-cart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: () => {
    const setLocation = vi.fn();
    return [, setLocation];
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

describe('CheckoutForm - Payment Integration', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    isAdmin: false,
  };

  const createMockCart = (items = [
    {
      id: 1,
      name: 'Test Product',
      price: 100,
      quantity: 2,
      imageUrl: 'test.jpg',
    },
  ]) => ({
    items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    clearCart: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
  });

  const mockCart = createMockCart();

  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ensure cart is always properly initialized
    const freshCart = createMockCart();
    Object.assign(mockCart, freshCart);
    mockCart.clearCart.mockClear();
    
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockUser,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      getAccessToken: vi.fn(() => 'test_token'),
    } as any);

    vi.mocked(useCart).mockReturnValue({
      cart: mockCart,
      clearCart: mockCart.clearCart,
      addItem: mockCart.addItem,
      removeItem: mockCart.removeItem,
      updateQuantity: mockCart.updateQuantity,
      isCartOpen: false,
      setIsCartOpen: vi.fn(),
    } as any);
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    } as any);
  });

  it('should create order and initiate payment on form submit', async () => {
    const user = userEvent.setup();
    const mockOrderResponse = { id: 123 };
    const mockPaymentData = {
      payu_url: 'https://test.payu.in/_payment',
    };

    vi.mocked(apiRequest).mockResolvedValue(mockOrderResponse);
    vi.mocked(processPayUPayment).mockResolvedValue(undefined);

    render(<CheckoutForm />);

    // Fill in form fields
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '9876543210');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'Mumbai');
    await user.type(screen.getByLabelText(/pin code/i), '400001');

    // Select state (you may need to adjust based on your actual form)
    // This is a simplified version

    // Submit form
    const submitButton = screen.getByRole('button', { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"items"'),
      });
    });

    await waitFor(() => {
      expect(processPayUPayment).toHaveBeenCalledWith(123);
    });

    expect(mockCart.clearCart).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Order created!',
        description: 'Redirecting to payment gateway...',
      })
    );
  });

  it('should handle payment initiation failure gracefully', async () => {
    const user = userEvent.setup();
    const mockOrderResponse = { id: 123 };
    const paymentError = new Error('Payment initiation failed');

    vi.mocked(apiRequest).mockResolvedValue(mockOrderResponse);
    vi.mocked(processPayUPayment).mockRejectedValue(paymentError);

    render(<CheckoutForm />);

    // Fill form and submit (simplified)
    const submitButton = screen.getByRole('button', { name: /place order/i });
    
    // Note: This test may need adjustment based on form validation
    // For now, we'll test the error handling logic

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });

    // When payment fails, should show error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Order created',
          description: expect.stringContaining('Payment initiation failed'),
          variant: 'destructive',
        })
      );
    });
  });

  it('should clear cart after order creation', async () => {
    const user = userEvent.setup();
    const mockOrderResponse = { id: 123 };

    vi.mocked(apiRequest).mockResolvedValue(mockOrderResponse);
    vi.mocked(processPayUPayment).mockResolvedValue(undefined);

    render(<CheckoutForm />);

    const submitButton = screen.getByRole('button', { name: /place order/i });
    
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalled();
    });

    expect(mockCart.clearCart).toHaveBeenCalled();
  });

  it('should not proceed if cart is empty', async () => {
    const emptyCart = createMockCart([]);

    vi.mocked(useCart).mockReturnValue({
      cart: emptyCart,
      clearCart: emptyCart.clearCart,
      addItem: emptyCart.addItem,
      removeItem: emptyCart.removeItem,
      updateQuantity: emptyCart.updateQuantity,
      isCartOpen: false,
      setIsCartOpen: vi.fn(),
    } as any);

    render(<CheckoutForm />);

    const submitButton = screen.getByRole('button', { name: /place order/i });
    const user = userEvent.setup();
    
    await user.click(submitButton);

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cart is empty',
        variant: 'destructive',
      })
    );

    expect(apiRequest).not.toHaveBeenCalled();
    expect(processPayUPayment).not.toHaveBeenCalled();
  });
});

