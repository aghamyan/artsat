import React from "react";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Checkout | ${SITE_NAME}`,
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
