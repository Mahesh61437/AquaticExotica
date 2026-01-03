// PayU Payment Service
// Handles payment initiation and redirection to PayU

import { apiRequest } from "./queryClient";

export interface PayUPaymentData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  hash: string;
  surl: string;
  furl: string;
  payu_url: string;
}

/**
 * Initiates PayU payment by calling backend API
 * @param orderId - The order ID to initiate payment for
 * @returns Payment data from backend
 */
export async function initiatePayUPayment(orderId: number): Promise<PayUPaymentData> {
  try {
    const response = await apiRequest(`/api/payments/initiate/${orderId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response || !response.payu_url) {
      throw new Error("Invalid payment data received from server");
    }

    return response as PayUPaymentData;
  } catch (error) {
    console.error("PayU payment initiation error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to initiate payment. Please try again."
    );
  }
}

/**
 * Redirects user to PayU payment page by submitting a hidden form
 * @param paymentData - Payment data received from backend
 */
export function redirectToPayU(paymentData: PayUPaymentData): void {
  // Create form element
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentData.payu_url;
  form.style.display = "none";

  // Fields required by PayU
  const fields: (keyof PayUPaymentData)[] = [
    "key",
    "txnid",
    "amount",
    "productinfo",
    "firstname",
    "email",
    "phone",
    "hash",
    "surl",
    "furl",
  ];

  // Create hidden inputs for each field
  fields.forEach((field) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = field;
    input.value = paymentData[field] || "";
    form.appendChild(input);
  });

  // Append form to body and submit
  document.body.appendChild(form);
  form.submit();

  // Clean up: remove form after a short delay (form submission is async)
  setTimeout(() => {
    if (form.parentNode) {
      form.parentNode.removeChild(form);
    }
  }, 1000);
}

/**
 * Complete payment flow: initiate payment and redirect to PayU
 * @param orderId - The order ID to process payment for
 * @returns Promise that resolves when payment is initiated
 */
export async function processPayUPayment(orderId: number): Promise<void> {
  try {
    // Step 1: Initiate payment with backend
    const paymentData = await initiatePayUPayment(orderId);

    // Step 2: Redirect to PayU
    redirectToPayU(paymentData);
  } catch (error) {
    console.error("PayU payment processing error:", error);
    throw error;
  }
}

