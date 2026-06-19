"use client";

import { Loader2 } from "lucide-react";

export function PaymentProcessing() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <h2 className="text-lg font-semibold">Processing your payment...</h2>
      <p className="text-sm text-muted-foreground">
        Please do not close this page.
      </p>
    </div>
  );
}
