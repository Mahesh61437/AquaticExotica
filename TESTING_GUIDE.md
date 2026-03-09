# PayU Payment Flow - Testing Guide

## Overview

Comprehensive test suite for PayU payment integration covering:
- PayU service utility functions
- CheckoutForm payment integration
- Payment success/failure pages

## Test Setup

### Dependencies Installed
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests

### Configuration Files
- `vitest.config.ts` - Vitest configuration
- `client/src/test/setup.ts` - Test setup and mocks

## Running Tests

### Run all tests
```bash
npm run test:run
```

### Run tests in watch mode
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

## Test Files

### 1. PayU Service Tests (`client/src/lib/__tests__/payu-service.test.ts`)

**Coverage:**
- ✅ `initiatePayUPayment()` - Payment initiation
  - Successfully initiates payment
  - Handles invalid payment data
  - Handles missing payu_url
  - Handles API errors
  - Handles non-Error exceptions

- ✅ `redirectToPayU()` - Form creation and submission
  - Creates form with correct fields
  - Appends form to document body
  - Handles empty values

- ✅ `processPayUPayment()` - Complete payment flow
  - Successfully processes payment
  - Handles initiation failures
  - Prevents redirect on failure

**Key Test Scenarios:**
```typescript
// Success case
initiatePayUPayment(123) → Returns payment data

// Error cases
Invalid data → Throws error
Missing payu_url → Throws error
API failure → Throws error
```

### 2. CheckoutForm Payment Tests (`client/src/components/checkout/__tests__/CheckoutForm.payment.test.tsx`)

**Coverage:**
- ✅ Order creation and payment initiation
- ✅ Payment initiation failure handling
- ✅ Cart clearing after order creation
- ✅ Empty cart validation

**Key Test Scenarios:**
```typescript
// Success flow
Submit form → Create order → Initiate payment → Redirect

// Error flow
Submit form → Create order → Payment fails → Show error → Redirect to confirmation

// Validation
Empty cart → Show error → Don't create order
```

### 3. Payment Success Page Tests (`client/src/pages/__tests__/PaymentSuccess.test.tsx`)

**Coverage:**
- ✅ Displays success message
- ✅ Extracts and displays transaction ID from URL
- ✅ Fetches and displays order details
- ✅ Shows loading state
- ✅ Navigation buttons functionality
- ✅ Order confirmation link

**Key Test Scenarios:**
```typescript
// URL params
?txnid=TXN123&order_id=123 → Display both IDs

// Order details
Order ID present → Fetch order → Display details

// Navigation
Buttons present → Can navigate to orders/shop/home
```

### 4. Payment Failure Page Tests (`client/src/pages/__tests__/PaymentFailure.test.tsx`)

**Coverage:**
- ✅ Displays failure message
- ✅ Shows error message from URL params
- ✅ Displays transaction ID
- ✅ Lists common failure reasons
- ✅ Provides troubleshooting tips
- ✅ Navigation buttons
- ✅ Contact support link

**Key Test Scenarios:**
```typescript
// Error display
?error_Message=Insufficient funds → Display error

// Transaction info
?txnid=TXN123&order_id=123 → Display both

// Help content
Common reasons → Displayed
Troubleshooting tips → Displayed
```

## Test Structure

### Mocking Strategy

**API Requests:**
```typescript
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
}));
```

**React Hooks:**
```typescript
vi.mock('@/hooks/use-cart', () => ({
  useCart: vi.fn(),
}));
```

**Routing:**
```typescript
vi.mock('wouter', () => ({
  useLocation: () => [, vi.fn()],
}));
```

## Writing New Tests

### Example Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const props = { /* ... */ };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Test Coverage Goals

### PayU Service
- ✅ All functions tested
- ✅ Success paths covered
- ✅ Error paths covered
- ✅ Edge cases handled

### CheckoutForm
- ✅ Payment flow integration
- ✅ Error handling
- ✅ User interactions
- ⚠️ Form validation (may need more tests)

### Payment Pages
- ✅ Success page rendering
- ✅ Failure page rendering
- ✅ URL parameter handling
- ✅ Navigation functionality

## Continuous Integration

### Pre-commit Hooks
Consider adding:
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:run"
    }
  }
}
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run
```

## Debugging Tests

### Run specific test file
```bash
npm test payu-service.test.ts
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Debug with UI
```bash
npm run test:ui
```

## Common Issues

### 1. Mock not working
- Ensure `vi.mock()` is called before imports
- Check mock path matches actual import path

### 2. DOM not available
- Ensure `jsdom` environment is set
- Check `vitest.config.ts` has `environment: 'jsdom'`

### 3. Async operations
- Use `waitFor()` for async updates
- Use `await` for async functions

### 4. Form submission
- Mock `form.submit()` to prevent actual navigation
- Use `userEvent` for user interactions

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach`/`afterEach` for cleanup
3. **Mocks**: Mock external dependencies
4. **Assertions**: Test behavior, not implementation
5. **Coverage**: Aim for >80% coverage on critical paths

## Next Steps

1. ✅ Basic test suite created
2. ⚠️ Add integration tests for full payment flow
3. ⚠️ Add E2E tests with Playwright/Cypress
4. ⚠️ Add performance tests
5. ⚠️ Add accessibility tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

