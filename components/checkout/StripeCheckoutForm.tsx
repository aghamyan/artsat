"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface StripeCheckoutFormProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  onSuccess?: () => void;
}

const paymentElementOptions: StripePaymentElementOptions = {
  layout: "tabs",
};

export function StripeCheckoutForm({
  orderId,
  orderNumber,
  amount,
  onSuccess,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/order-confirmation/${orderId}?payment=success`
      : `/order-confirmation/${orderId}?payment=success`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    // Trigger form validation
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Validation failed");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: successUrl,
      },
    });

    // confirmPayment redirects on success; if we get here it failed
    if (confirmError) {
      if (confirmError.type === "card_error" || confirmError.type === "validation_error") {
        setError(confirmError.message ?? "Your card was declined.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }

    setLoading(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border p-4">
        <PaymentElement options={paymentElementOptions} />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
        Order #{orderNumber} — Total: <strong>{formatPrice(amount)}</strong>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-base"
        disabled={!stripe || !elements || loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(amount)}`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}
