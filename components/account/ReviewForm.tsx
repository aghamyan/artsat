"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  orderItemId: string;
  productName: string;
}

export default function ReviewForm({ productId, orderItemId, productName }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ rating: 0, title: "", comment: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRating = (r: number) => setForm((f) => ({ ...f, rating: r }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        order_item_id: orderItemId,
        rating: form.rating,
        title: form.title,
        comment: form.comment || undefined,
      }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to submit review");
      return;
    }

    router.push("/account/reviews?submitted=1");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <p className="text-sm text-gray-600">You are reviewing: <strong>{productName}</strong></p>

      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-2xl transition-colors ${star <= form.rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          maxLength={100}
          placeholder="Summarise your experience"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Review (optional)</label>
        <textarea
          name="comment"
          value={form.comment}
          onChange={handleChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
          maxLength={1000}
          rows={4}
          placeholder="Tell other shoppers what you think..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{form.comment.length}/1000</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-black text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {saving ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
