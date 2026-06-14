import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Order Confirmed | ${SITE_NAME}`,
  robots: { index: false },
};

interface SuccessPageProps {
  searchParams: Promise<{ order?: string; id?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-6" />
      <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-muted-foreground mb-2">
        Thank you for your order. We&apos;ll send you a confirmation email shortly.
      </p>
      {params.order && (
        <p className="text-sm font-mono bg-muted inline-block px-3 py-1 rounded mb-8">
          Order #{params.order}
        </p>
      )}

      {params.id && (
        <div className="mb-8">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/account/orders/${params.id}`}>View Order Details</Link>
          </Button>
        </div>
      )}

      <Button asChild size="lg" className="w-full">
        <Link href="/products">Continue Shopping</Link>
      </Button>
    </div>
  );
}
