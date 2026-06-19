"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderItem } from "@/lib/types";

const REASONS = [
  { value: "size", label: "Wrong size" },
  { value: "color", label: "Wrong color" },
  { value: "damaged", label: "Arrived damaged" },
  { value: "defect", label: "Product defect" },
  { value: "wrong_item", label: "Received wrong item" },
  { value: "other", label: "Other" },
];

interface Props {
  orderId: string;
  items: OrderItem[];
}

export default function ReturnForm({ orderId, items }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    order_item_id: "",
    request_type: "return" as "return" | "exchange",
    reason: "",
    reason_description: "",
    quantity: 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === form.order_item_id);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "quantity" ? Number(value) : value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_item_id || !form.reason) {
      setError("Please select an item and a reason");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to submit request");
      return;
    }

    router.push("/account/returns");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
        <select
          name="order_item_id"
          value={form.order_item_id}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Choose an item...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.product_name} {item.variant_size ? `(${item.variant_size})` : ""} — Qty {item.quantity}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
        <div className="flex gap-4">
          {(["return", "exchange"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="request_type"
                value={type}
                checked={form.request_type === type}
                onChange={handleChange}
              />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity (max {selectedItem.quantity})
          </label>
          <input
            type="number"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            min={1}
            max={selectedItem.quantity}
            className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <select
          name="reason"
          value={form.reason}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Select reason...</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (optional)</label>
        <textarea
          name="reason_description"
          value={form.reason_description}
          onChange={handleChange}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          placeholder="Provide any additional details..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-black text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {saving ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
