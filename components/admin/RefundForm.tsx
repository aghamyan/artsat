"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import type { RefundReason } from "@/lib/types";

interface RefundFormProps {
  orderId: string;
  orderTotal: number;
  orderNumber: string;
}

export function RefundForm({ orderId, orderTotal, orderNumber }: RefundFormProps) {
  const router = useRouter();
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<RefundReason>("requested_by_customer");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const refundAmount =
      refundType === "full"
        ? undefined
        : Math.round(parseFloat(amount) * 100);

    if (refundType === "partial") {
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        toast.error("Please enter a valid refund amount");
        setLoading(false);
        return;
      }
      if (refundAmount! > orderTotal) {
        toast.error("Refund cannot exceed order total");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, amount: refundAmount, reason }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Refund failed");
      }

      toast.success("Refund processed successfully");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md bg-muted p-4 text-sm">
        <p><strong>Order:</strong> #{orderNumber}</p>
        <p><strong>Order Total:</strong> {formatPrice(orderTotal)}</p>
      </div>

      <div className="space-y-2">
        <Label>Refund Type</Label>
        <Select
          value={refundType}
          onValueChange={(v) => setRefundType(v as "full" | "partial")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Refund ({formatPrice(orderTotal)})</SelectItem>
            <SelectItem value="partial">Partial Refund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {refundType === "partial" && (
        <div className="space-y-2">
          <Label htmlFor="amount">Refund Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={(orderTotal / 100).toFixed(2)}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Reason</Label>
        <Select
          value={reason}
          onValueChange={(v) => setReason(v as RefundReason)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
            <SelectItem value="duplicate">Duplicate Order</SelectItem>
            <SelectItem value="fraudulent">Fraudulent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        variant="destructive"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Processing Refund..." : "Process Refund"}
      </Button>
    </form>
  );
}
