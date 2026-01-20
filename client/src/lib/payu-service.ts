import { apiRequest } from "./queryClient";

// PayU payment parameters interface
export interface PayUPaymentParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  service_provider: string;
}

// PayU payment initiation request - No longer needed as backend fetches from order

// PayU payment initiation response
export interface PayUInitiateResponse {
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

// PayU payment status response
export interface PayUPaymentStatus {
  id: number;
  txnid: string;
  order_id: number;
  user_email: string;
  amount: string;
  status: "initiated" | "pending" | "success" | "failure" | "cancelled" | "refunded";
  verified: boolean;
  phone: string;
  mihpayid?: string;
  mode?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Initiate PayU payment and get payment parameters
 * Backend fetches order details and customer info from database
 */
export async function initiatePayUPayment(
  orderId: number
): Promise<PayUInitiateResponse> {
  try {
    const response = await apiRequest<PayUInitiateResponse>(`/api/payments/initiate/${orderId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response;
  } catch (error: any) {
    console.error("PayU payment initiation error:", error);
    throw new Error(error.error || error.message || "Failed to initiate payment");
  }
}

/**
 * Get payment status for an order
 */
export async function getPaymentStatus(orderId: number): Promise<PayUPaymentStatus> {
  try {
    const response = await apiRequest<PayUPaymentStatus>(`/api/payments/status/${orderId}/`, {
      method: "GET",
    });

    return response;
  } catch (error: any) {
    console.error("Get payment status error:", error);
    throw new Error(error.error || error.message || "Failed to get payment status");
  }
}

/**
 * Redirect to PayU hosted checkout page
 * Creates a hidden form and submits it to PayU
 */
export function redirectToPayU(paymentParams: PayUPaymentParams, payuUrl: string): void {
  // Create a form element
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payuUrl;
  form.style.display = "none";

  // Add all payment parameters as hidden inputs
  Object.entries(paymentParams).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  // Append form to body and submit
  document.body.appendChild(form);
  form.submit();

  // Clean up form after submission
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);
}

/**
 * Complete PayU payment flow
 * 1. Initiate payment with backend (backend fetches order and customer info)
 * 2. Redirect to PayU hosted checkout
 */
export async function processPayUPayment(
  orderId: number
): Promise<void> {
  try {
    // Step 1: Initiate payment and get parameters
    // Backend will fetch order details and customer info from database
    const response = await initiatePayUPayment(orderId);

    if (!response.hash) {
      throw new Error("Failed to initiate payment - invalid response");
    }

    // Step 2: Prepare payment parameters
    const paymentParams: PayUPaymentParams = {
      key: response.key,
      txnid: response.txnid,
      amount: response.amount,
      productinfo: response.productinfo,
      firstname: response.firstname,
      email: response.email,
      phone: response.phone,
      surl: response.surl,
      furl: response.furl,
      hash: response.hash,
      service_provider: "payu_paisa", // Default service provider
    };

    // Step 3: Redirect to PayU hosted checkout
    redirectToPayU(paymentParams, response.payu_url);
  } catch (error) {
    console.error("PayU payment processing error:", error);
    throw error;
  }
}

