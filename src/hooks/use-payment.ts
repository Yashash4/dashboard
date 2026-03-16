"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { PaymentType } from "@/lib/payments/types";

interface UsePaymentOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface PaymentParams {
  amount: number;
  paymentType: PaymentType;
  metadata: Record<string, any>;
}

export function usePayment(options: UsePaymentOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load payment SDK"));
      document.body.appendChild(script);
    });
  }, []);

  const openRazorpay = useCallback(
    (orderData: any, params: PaymentParams): Promise<void> => {
      return new Promise((resolve, reject) => {
        const rzpOptions = {
          key: orderData.providerData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: orderData.providerData.name,
          description: orderData.providerData.description,
          order_id: orderData.orderId,
          prefill: orderData.providerData.prefill,
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  provider: "razorpay",
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  metadata: {
                    payment_type: params.paymentType,
                    amount: params.amount,
                    ...params.metadata,
                  },
                }),
              });

              const verifyData = await verifyRes.json();

              if (!verifyRes.ok) {
                throw new Error(
                  verifyData.error || "Payment verification failed"
                );
              }

              toast.success("Payment successful!");
              options.onSuccess?.();
              resolve();
            } catch (err: any) {
              const msg = err.message || "Payment verification failed";
              toast.error(msg);
              options.onError?.(msg);
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("cancelled"));
            },
          },
          theme: { color: "#6b8f71" },
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on("payment.failed", (response: any) => {
          const msg =
            response?.error?.description || "Payment failed. Please try again.";
          toast.error(msg);
          options.onError?.(msg);
          reject(new Error(msg));
        });
        rzp.open();
      });
    },
    [options]
  );

  const initiatePayment = useCallback(
    async (params: PaymentParams): Promise<boolean> => {
      setIsProcessing(true);
      try {
        // 1. Create order
        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || "Failed to create order");
        }

        // 2. Open Razorpay checkout
        await loadRazorpayScript();
        await openRazorpay(orderData, params);

        return true;
      } catch (err: any) {
        if (err.message !== "cancelled") {
          const msg = err.message || "Payment failed";
          toast.error(msg);
          options.onError?.(msg);
        }
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [loadRazorpayScript, openRazorpay, options]
  );

  return { initiatePayment, isProcessing };
}
