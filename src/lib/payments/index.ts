export * from "./types";
export { detectRegion, detectRegionClient } from "./detect-region";

import { detectRegion } from "./detect-region";
import {
  isRazorpayConfigured,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "./razorpay";
import {
  isXPayConfigured,
  createXPayOrder,
  verifyXPayPayment,
} from "./xpay";
import type {
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  RegionInfo,
} from "./types";

/**
 * Resolve which provider + currency to use for this request.
 * If XPay isn't configured, international falls back to Razorpay (USD).
 */
export function resolveProvider(request?: Request): RegionInfo {
  const info = detectRegion(request);

  // If preferred provider isn't configured, fall back
  if (info.provider === "xpay" && !isXPayConfigured()) {
    // International but XPay not ready → use Razorpay with USD
    if (isRazorpayConfigured()) {
      return { region: "international", provider: "razorpay", currency: "USD" };
    }
  }

  if (info.provider === "razorpay" && !isRazorpayConfigured()) {
    // India but Razorpay not configured → try XPay
    if (isXPayConfigured()) {
      return { region: "india", provider: "xpay", currency: "INR" };
    }
  }

  return info;
}

/**
 * Create a payment order using the auto-detected provider.
 */
export async function createOrder(
  params: CreateOrderParams,
  request?: Request
): Promise<CreateOrderResult> {
  const { provider, currency } = resolveProvider(request);

  if (provider === "razorpay") {
    return createRazorpayOrder(params, currency);
  }

  return createXPayOrder(params, currency);
}

/**
 * Verify a payment with the specified provider.
 */
export function verifyPayment(
  params: VerifyPaymentParams
): VerifyPaymentResult {
  if (params.provider === "razorpay") {
    return verifyRazorpayPayment(params);
  }

  return verifyXPayPayment(params);
}
