import crypto from "crypto";
import Razorpay from "razorpay";
import type {
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";

export function isRazorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

function descriptionFor(params: CreateOrderParams): string {
  switch (params.paymentType) {
    case "agent_purchase":
      return `Agent: ${params.metadata.agent_name || "Premium Agent"}`;
    case "subscription_new":
      return `Subscription: ${params.metadata.plan || "Pro"} Plan`;
    case "subscription_upgrade":
      return `Upgrade to ${params.metadata.plan || "Pro"} Plan`;
    default:
      return "ClawHQ Payment";
  }
}

export async function createRazorpayOrder(
  params: CreateOrderParams,
  currency: string
): Promise<CreateOrderResult> {
  const razorpay = getClient();
  const amountSmallest = Math.round(params.amount * 100);
  const receipt = `${params.paymentType}_${Date.now()}`.slice(0, 40);

  const order = await razorpay.orders.create({
    amount: amountSmallest,
    currency,
    receipt,
    notes: {
      user_id: params.userId,
      payment_type: params.paymentType,
      ...params.metadata,
    },
  });

  return {
    provider: "razorpay",
    orderId: order.id,
    amount: amountSmallest,
    currency,
    providerData: {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: order.id,
      name: "ClawHQ",
      description: descriptionFor(params),
      prefill: {
        email: params.userEmail,
        name: params.userName,
      },
    },
  };
}

export function verifyRazorpayPayment(
  params: VerifyPaymentParams
): VerifyPaymentResult {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return { verified: false, error: "Razorpay secret not configured" };
  }

  if (!params.orderId || !params.paymentId || !params.signature) {
    return { verified: false, error: "Missing Razorpay verification data" };
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  if (expected !== params.signature) {
    return { verified: false, error: "Signature verification failed" };
  }

  return { verified: true };
}
