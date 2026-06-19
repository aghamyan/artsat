"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShippingForm } from "./ShippingForm";
import { OrderReview } from "./OrderReview";
import { DiscountForm } from "./DiscountForm";
import { StripeCheckoutForm } from "./StripeCheckoutForm";
import { StripeProvider } from "@/components/common/StripeProvider";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/store/cart";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/validations/checkout";
import type { CheckoutResultWithStripe } from "@/lib/types";

type CheckoutStep = "details" | "stripe-payment";

export function CheckoutForm() {
  const router = useRouter();
  const { items, cartId, sessionId, getSubtotal, clearItems } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [step, setStep] = useState<CheckoutStep>("details");
  const [stripeData, setStripeData] = useState<{
    clientSecret: string;
    orderId: string;
    orderNumber: string;
    amount: number;
  } | null>(null);

  const subtotal = getSubtotal();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shipping: {
        full_name: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        postal_code: "",
        country: "Armenia",
        notes: "",
      },
      payment_method: "cash_on_delivery",
      discount_code: "",
      terms_accepted: undefined,
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const paymentMethod = watch("payment_method");

  async function onSubmit(values: CheckoutFormValues) {
    if (!items.length) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
          shipping: values.shipping,
          payment_method: values.payment_method,
          discount_code: discountCode || undefined,
          cart_id: cartId ?? undefined,
          session_id: sessionId,
        }),
      });

      const data = (await res.json()) as CheckoutResultWithStripe & {
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed. Please try again.");
      }

      // Stripe: move to payment step
      if (values.payment_method === "stripe" && data.client_secret) {
        setStripeData({
          clientSecret: data.client_secret,
          orderId: data.order_id,
          orderNumber: data.order_number,
          amount: data.total,
        });
        setStep("stripe-payment");
        return;
      }

      // Non-Stripe: go to success page
      clearItems();
      router.push(
        `/checkout/success?order=${data.order_number}&id=${data.order_id}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!items.length && step === "details") {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Your cart is empty.</p>
      </div>
    );
  }

  // Stripe payment step
  if (step === "stripe-payment" && stripeData) {
    return (
      <div className="max-w-lg mx-auto">
        <h2 className="text-xl font-semibold mb-6">Complete Payment</h2>
        <StripeProvider clientSecret={stripeData.clientSecret}>
          <StripeCheckoutForm
            orderId={stripeData.orderId}
            orderNumber={stripeData.orderNumber}
            amount={stripeData.amount}
            onSuccess={clearItems}
          />
        </StripeProvider>
        <Button
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => {
            setStep("details");
            setStripeData(null);
          }}
        >
          Back to details
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: form fields */}
        <div className="space-y-8">
          {/* Shipping */}
          <ShippingForm form={form} />

          {/* Payment method */}
          <div className="space-y-4 rounded-lg border p-6">
            <h2 className="font-semibold text-lg">Payment Method</h2>
            <Select
              value={paymentMethod}
              onValueChange={(v) =>
                setValue(
                  "payment_method",
                  v as CheckoutFormValues["payment_method"]
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">
                  Credit / Debit Card (Stripe)
                </SelectItem>
                <SelectItem value="cash_on_delivery">
                  Cash on Delivery
                </SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>

            {paymentMethod === "stripe" && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                You&apos;ll enter your card details securely on the next step.
                Powered by Stripe — we never store card data.
              </div>
            )}

            {paymentMethod === "bank_transfer" && (
              <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Bank Transfer Details</p>
                <p>Bank: Ameriabank</p>
                <p>Account: 1234567890</p>
                <p>Beneficiary: Artsat LLC</p>
                <p className="mt-2">
                  Please include your order number in the payment reference.
                  Orders are confirmed after payment is received.
                </p>
              </div>
            )}
          </div>

          {/* Discount code */}
          <DiscountForm
            subtotal={subtotal}
            onApply={(code, amount) => {
              setDiscountCode(code);
              setDiscountAmount(amount);
            }}
          />

          {/* Review */}
          <OrderReview items={items} />

          {/* Terms */}
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox
              id="terms"
              onCheckedChange={(checked) => {
                setValue(
                  "terms_accepted",
                  checked === true ? true : (undefined as unknown as true)
                );
              }}
            />
            <div>
              <Label
                htmlFor="terms"
                className="text-sm font-normal cursor-pointer"
              >
                I agree to the{" "}
                <a href="/terms" className="underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline">
                  Privacy Policy
                </a>
              </Label>
              {errors.terms_accepted && (
                <p className="text-xs text-destructive mt-1">
                  {errors.terms_accepted.message}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Processing..."
              : paymentMethod === "stripe"
              ? "Continue to Payment"
              : "Place Order"}
          </Button>
        </div>

        {/* Right: summary */}
        <div className="space-y-4">
          <CartSummary
            subtotal={subtotal}
            discountAmount={discountAmount}
            discountCode={discountCode || undefined}
          />
        </div>
      </div>
    </form>
  );
}
