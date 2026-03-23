import type {
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";

export function isXPayConfigured(): boolean {
  return !!process.env.XPAY_API_KEY;
}

/**
 * Create an XPay order.
 * XPay integration is not yet available. Callers should check
 * isXPayConfigured() and fall back to Razorpay before calling this.
 */
export async function createXPayOrder(
  _params: CreateOrderParams,
  _currency: string
): Promise<CreateOrderResult> {
  console.warn("[xpay] createXPayOrder called but XPay integration is not implemented yet");
  throw new Error("XPay payment provider is not yet available. Please use an alternative payment method.");
}

/**
 * Verify an XPay payment.
 * XPay integration is not yet available. Always returns unverified.
 */
export function verifyXPayPayment(
  _params: VerifyPaymentParams
): VerifyPaymentResult {
  console.warn("[xpay] verifyXPayPayment called but XPay integration is not implemented yet");
  return { verified: false, error: "XPay payment provider is not yet available" };
}
