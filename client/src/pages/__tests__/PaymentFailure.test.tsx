import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentFailure from '../PaymentFailure';

// Mock dependencies
vi.mock('wouter', () => ({
  useLocation: () => {
    const setLocation = vi.fn();
    return [, setLocation];
  },
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PaymentFailure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = {
      search: '',
    };
  });

  it('should display failure message', () => {
    render(<PaymentFailure />);

    expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    expect(screen.getByText(/your payment could not be processed/i)).toBeInTheDocument();
  });

  it('should display error message from URL params', () => {
    (window as any).location = {
      search: '?error_Message=Insufficient funds',
    };

    render(<PaymentFailure />);

    expect(screen.getByText(/insufficient funds/i)).toBeInTheDocument();
  });

  it('should display transaction ID from URL params', () => {
    (window as any).location = {
      search: '?txnid=TXN123456&order_id=123',
    };

    render(<PaymentFailure />);

    expect(screen.getByText(/TXN123456/i)).toBeInTheDocument();
    expect(screen.getByText(/Order ID:/i)).toBeInTheDocument();
    // Use getAllByText since "123" appears multiple times
    const orderIdElements = screen.getAllByText(/123/i);
    expect(orderIdElements.length).toBeGreaterThan(0);
  });

  it('should display common reasons for payment failure', () => {
    render(<PaymentFailure />);

    expect(screen.getByText(/common reasons for payment failure/i)).toBeInTheDocument();
    expect(screen.getByText(/insufficient funds in your account/i)).toBeInTheDocument();
    expect(screen.getByText(/card has been declined/i)).toBeInTheDocument();
  });

  it('should display troubleshooting tips', () => {
    render(<PaymentFailure />);

    expect(screen.getByText(/what you can do/i)).toBeInTheDocument();
    expect(screen.getByText(/check your payment method/i)).toBeInTheDocument();
    expect(screen.getByText(/try a different payment method/i)).toBeInTheDocument();
  });

  it('should have navigation buttons', () => {
    render(<PaymentFailure />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
  });

  it('should have contact support link', () => {
    render(<PaymentFailure />);

    const supportLink = screen.getByRole('link', { name: /contact support/i });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', '/contact');
  });

  it('should handle order_id in URL for retry', () => {
    (window as any).location = {
      search: '?order_id=123',
    };

    render(<PaymentFailure />);

    expect(screen.getByText(/Order ID:/i)).toBeInTheDocument();
  });
});

