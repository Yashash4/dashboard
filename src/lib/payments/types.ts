export type PaymentProvider = "razorpay" | "xpay";
export type UserRegion = "india" | "international";
export type PaymentType =
  | "agent_purchase"
  | "subscription_new"
  | "subscription_upgrade";

export interface CreateOrderParams {
  userId: string;
  amount: number; // dollars or rupees (not cents/paise)
  paymentType: PaymentType;
  metadata: Record<string, any>;
  userEmail?: string;
  userName?: string;
}

export interface CreateOrderResult {
  provider: PaymentProvider;
  orderId: string;
  amount: number; // smallest unit (paise/cents)
  currency: string;
  providerData: any; // passed to client SDK
}

export interface VerifyPaymentParams {
  provider: PaymentProvider;
  orderId: string;
  paymentId: string;
  signature?: string;
  metadata: Record<string, any>;
}

export interface VerifyPaymentResult {
  verified: boolean;
  error?: string;
}

export interface RegionInfo {
  region: UserRegion;
  provider: PaymentProvider;
  currency: string;
}
