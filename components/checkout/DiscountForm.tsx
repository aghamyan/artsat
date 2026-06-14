"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DiscountFormProps {
  subtotal: number;
  onApply: (code: string, amount: number) => void;
}

export function DiscountForm({ subtotal, onApply }: DiscountFormProps) {
  const [code, setCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid discount code.");
        return;
      }

      setAppliedCode(trimmed);
      setCode("");
      onApply(trimmed, data.discount_amount);
    } catch {
      setError("Could not validate discount code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemove() {
    setAppliedCode(null);
    setError(null);
    onApply("", 0);
  }

  return (
    <div className="space-y-3 rounded-lg border p-6">
      <h2 className="font-semibold text-lg">Discount Code</h2>

      {appliedCode ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
            {appliedCode}
          </Badge>
          <button
            type="button"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove discount code"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="font-mono uppercase"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleApply();
              }
            }}
            maxLength={50}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleApply}
            disabled={isLoading || !code.trim()}
            className="shrink-0"
          >
            {isLoading ? "Checking..." : "Apply"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
