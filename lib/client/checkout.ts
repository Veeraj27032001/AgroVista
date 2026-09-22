'use client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export type CreateOrderResponse = { orderId: string; amount: number; currency: string; keyId: string };
export type CreateMandateResponse = { subscriptionId: string; keyId: string; autoRenew: true };

/** One-time payment (issue purchase, or a plain non-autopay subscription order). */
export async function runRazorpayCheckout(params: {
  order: CreateOrderResponse;
  type: 'issue' | 'subscription';
  description: string;
  prefillEmail: string;
  onSuccess: (result: { orderId: string; paymentId: string }) => void | Promise<void>;
  onDismiss?: () => void;
}): Promise<void> {
  if (typeof window.Razorpay === 'undefined') {
    throw new Error('Payment library failed to load. Check your internet connection and try again.');
  }

  const rzp = new window.Razorpay({
    key: params.order.keyId,
    amount: params.order.amount,
    currency: params.order.currency,
    name: 'AgroVista',
    description: params.description,
    order_id: params.order.orderId,
    prefill: { email: params.prefillEmail },
    theme: { color: '#4C7A3F' },
    handler: async (response: any) => {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          type: params.type
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.ok) {
        await params.onSuccess({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id });
      } else {
        throw new Error('Payment could not be confirmed. If money was deducted, contact support.');
      }
    },
    modal: { ondismiss: () => params.onDismiss?.() }
  });
  rzp.open();
}

/** Autopay mandate checkout — opens with subscription_id instead of order_id/amount. */
export async function runRazorpayMandateCheckout(params: {
  mandate: CreateMandateResponse;
  description: string;
  prefillEmail: string;
  onSuccess: (result: { subscriptionId: string; paymentId: string }) => void | Promise<void>;
  onDismiss?: () => void;
}): Promise<void> {
  if (typeof window.Razorpay === 'undefined') {
    throw new Error('Payment library failed to load. Check your internet connection and try again.');
  }

  const rzp = new window.Razorpay({
    key: params.mandate.keyId,
    subscription_id: params.mandate.subscriptionId,
    name: 'AgroVista',
    description: params.description,
    prefill: { email: params.prefillEmail },
    theme: { color: '#4C7A3F' },
    handler: async (response: any) => {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: response.razorpay_subscription_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          type: 'subscription'
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.ok) {
        await params.onSuccess({ subscriptionId: response.razorpay_subscription_id, paymentId: response.razorpay_payment_id });
      } else {
        throw new Error('Payment could not be confirmed. If money was deducted, contact support.');
      }
    },
    modal: { ondismiss: () => params.onDismiss?.() }
  });
  rzp.open();
}
