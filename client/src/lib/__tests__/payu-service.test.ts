import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initiatePayUPayment,
  redirectToPayU,
  processPayUPayment,
  type PayUPaymentData,
} from '../payu-service';
import { apiRequest } from '../queryClient';

// Mock the apiRequest function
vi.mock('../queryClient', () => ({
  apiRequest: vi.fn(),
}));

describe('PayU Service', () => {
  const mockPaymentData: PayUPaymentData = {
    key: 'test_merchant_key',
    txnid: 'TXN123456',
    amount: '1500.00',
    productinfo: 'Order #123',
    firstname: 'John',
    email: 'john@example.com',
    phone: '9876543210',
    hash: 'test_hash_value',
    surl: 'https://example.com/payment/success',
    furl: 'https://example.com/payment/failure',
    payu_url: 'https://test.payu.in/_payment',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initiatePayUPayment', () => {
    it('should successfully initiate payment and return payment data', async () => {
      vi.mocked(apiRequest).mockResolvedValue(mockPaymentData);

      const result = await initiatePayUPayment(123);

      expect(apiRequest).toHaveBeenCalledWith('/api/payments/initiate/123/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockPaymentData);
      expect(result.payu_url).toBe('https://test.payu.in/_payment');
    });

    it('should throw error if payment data is invalid', async () => {
      vi.mocked(apiRequest).mockResolvedValue({});

      await expect(initiatePayUPayment(123)).rejects.toThrow(
        'Invalid payment data received from server'
      );
    });

    it('should throw error if payu_url is missing', async () => {
      const invalidData = { ...mockPaymentData };
      delete (invalidData as any).payu_url;
      vi.mocked(apiRequest).mockResolvedValue(invalidData);

      await expect(initiatePayUPayment(123)).rejects.toThrow(
        'Invalid payment data received from server'
      );
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      vi.mocked(apiRequest).mockRejectedValue(new Error(errorMessage));

      await expect(initiatePayUPayment(123)).rejects.toThrow(errorMessage);
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(apiRequest).mockRejectedValue('String error');

      await expect(initiatePayUPayment(123)).rejects.toThrow(
        'Failed to initiate payment. Please try again.'
      );
    });
  });

  describe('redirectToPayU', () => {
    it('should create and submit form with correct fields', () => {
      const formSubmitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

      redirectToPayU(mockPaymentData);

      const form = document.querySelector('form') as HTMLFormElement;
      expect(form).toBeTruthy();
      expect(form.method.toLowerCase()).toBe('post');
      expect(form.action).toBe(mockPaymentData.payu_url);
      expect(form.style.display).toBe('none');

      // Check all required fields are present
      const fields = ['key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone', 'hash', 'surl', 'furl'];
      fields.forEach((field) => {
        const input = form.querySelector(`input[name="${field}"]`) as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.type).toBe('hidden');
        expect(input.value).toBe(mockPaymentData[field as keyof PayUPaymentData]);
      });

      expect(formSubmitSpy).toHaveBeenCalled();
      formSubmitSpy.mockRestore();
    });

    it('should append form to document body', () => {
      const formSubmitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

      redirectToPayU(mockPaymentData);

      const form = document.querySelector('form');
      expect(form?.parentNode).toBe(document.body);
      
      formSubmitSpy.mockRestore();
    });

    it('should handle empty values in payment data', () => {
      const formSubmitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
      const dataWithEmptyValues = {
        ...mockPaymentData,
        phone: '',
      };

      redirectToPayU(dataWithEmptyValues);

      const form = document.querySelector('form') as HTMLFormElement;
      const phoneInput = form.querySelector('input[name="phone"]') as HTMLInputElement;
      expect(phoneInput.value).toBe('');

      formSubmitSpy.mockRestore();
    });
  });

  describe('processPayUPayment', () => {
    it('should successfully process payment flow', async () => {
      vi.mocked(apiRequest).mockResolvedValue(mockPaymentData);
      const formSubmitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

      await processPayUPayment(123);

      expect(apiRequest).toHaveBeenCalled();
      expect(formSubmitSpy).toHaveBeenCalled();

      formSubmitSpy.mockRestore();
    });

    it('should throw error if payment initiation fails', async () => {
      const errorMessage = 'Payment initiation failed';
      vi.mocked(apiRequest).mockRejectedValue(new Error(errorMessage));

      await expect(processPayUPayment(123)).rejects.toThrow(errorMessage);
    });

    it('should not redirect if payment initiation fails', async () => {
      vi.mocked(apiRequest).mockRejectedValue(new Error('API Error'));
      const formSubmitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});

      await expect(processPayUPayment(123)).rejects.toThrow();

      // Form should not be created if initiation fails
      const form = document.querySelector('form');
      expect(form).toBeNull();

      formSubmitSpy.mockRestore();
    });
  });
});

