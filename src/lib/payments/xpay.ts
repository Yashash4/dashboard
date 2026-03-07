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
 * TODO: Implement when XPay API is ready.
 */
export async function createXPayOrder(
  params: CreateOrderParams,
  currency: string
): Promise<CreateOrderResult> {
  if (!isXPayConfigured()) {
    throw new Error("XPay is not configured");
  }

  // TODO: Replace with actual XPay API call
  // const client = getXPayClient();
  // const order = await client.createPaymentIntent({ ... });

  throw new Error("XPay integration pending — use Razorpay fallback");
}

/**
 * Verify an XPay payment.
 * TODO: Implement when XPay API is ready.
 */
export function verifyXPayPayment(
  params: VerifyPaymentParams
): VerifyPaymentResult {
  if (!isXPayConfigured()) {
    return { verified: false, error: "XPay is not configured" };
  }

  // TODO: Replace with actual XPay verification
  return { verified: false, error: "XPay verification not implemented" };
}
