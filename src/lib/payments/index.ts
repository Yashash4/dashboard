export * from "./types";
export { detectRegion, detectRegionClient } from "./detect-region";

import { detectRegion } from "./detect-region";
import {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "./razorpay";
import type {
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  RegionInfo,
} from "./types";

/**
 * Resolve which currency to use for this request.
 * Always uses Razorpay — INR for India, USD for everyone else.
 */
export function resolveProvider(request?: Request): RegionInfo {
  const info = detectRegion(request);

  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured");
  }

  return info;
}

/**
 * Create a payment order via Razorpay.
 */
export async function createOrder(
  params: CreateOrderParams,
  request?: Request
): Promise<CreateOrderResult> {
  const { currency } = resolveProvider(request);
  return createRazorpayOrder(params, currency);
}

/**
 * Verify a payment with Razorpay.
 */
export function verifyPayment(
  params: VerifyPaymentParams
): VerifyPaymentResult {
  return verifyRazorpayPayment(params);
}
