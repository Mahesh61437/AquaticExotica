import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import PaymentSuccess from '../PaymentSuccess';
import { apiRequest } from '@/lib/queryClient';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('wouter', () => ({
  useLocation: () => {
    const setLocation = vi.fn();
    return [, setLocation];
  },
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PaymentSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL search params
    delete (window as any).location;
    (window as any).location = {
      search: '',
    };
  });

  it('should display success message', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(<PaymentSuccess />);

    expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
    expect(screen.getByText(/your payment has been processed successfully/i)).toBeInTheDocument();
  });

  it('should display transaction ID from URL params', () => {
    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        search: '?txnid=TXN123456&order_id=123',
      },
    });

    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(<PaymentSuccess />);

    expect(screen.getByText(/TXN123456/i)).toBeInTheDocument();
    expect(screen.getByText(/Order ID:/i)).toBeInTheDocument();
  });

  it('should fetch and display order details when order ID is present', async () => {
    const mockOrder = {
      id: 123,
      totalAmount: '1500.00',
      status: 'paid',
    };

    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?order_id=123',
      },
    });

    vi.mocked(useQuery).mockReturnValue({
      data: mockOrder,
      isLoading: false,
    } as any);

    render(<PaymentSuccess />);

    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching order', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?order_id=123',
      },
    });

    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: true,
    } as any);

    render(<PaymentSuccess />);

    // Should show skeleton or loading state
    // Adjust based on your actual loading UI
  });

  it('should have navigation buttons', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(<PaymentSuccess />);

    expect(screen.getByRole('button', { name: /view my orders/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('should display order confirmation link when order ID exists', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        search: '?order_id=123',
      },
    });

    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    render(<PaymentSuccess />);

    const orderLink = screen.getByRole('link', { name: /view order details/i });
    expect(orderLink).toBeInTheDocument();
    expect(orderLink).toHaveAttribute('href', '/order-confirmation/123');
  });
});

