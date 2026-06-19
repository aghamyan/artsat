"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { ProductReview } from "@/lib/types";

interface ReviewWithMeta extends ProductReview {
  product?: { name: string; slug: string };
  author?: { full_name: string | null; email: string };
}

interface Props {
  reviews: ReviewWithMeta[];
  total: number;
}

export default function ReviewModerationPanel({ reviews: initial, total }: Props) {
  const [reviews, setReviews] = useState(initial);
  const [count, setCount] = useState(total);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);

  const moderate = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: rejectNotes[id] }),
    });
    setProcessing(null);

    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setCount((c) => c - 1);
      if (action === "reject") setRejecting(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{count} review{count !== 1 ? "s" : ""} pending moderation</p>

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">All caught up!</p>
          <p className="text-sm mt-1">No reviews pending moderation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium">
                    {review.product?.name ?? "Unknown product"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    by {review.author?.full_name ?? review.author?.email ?? "Anonymous"} · {format(new Date(review.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
              </div>

              <p className="text-sm font-semibold">{review.title}</p>
              {review.comment && <p className="text-sm text-gray-600 mt-1">{review.comment}</p>}

              {rejecting === review.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={rejectNotes[review.id] ?? ""}
                    onChange={(e) => setRejectNotes((n) => ({ ...n, [review.id]: e.target.value }))}
                    placeholder="Rejection reason (optional, not shown to customer)"
                    rows={2}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderate(review.id, "reject")}
                      disabled={processing === review.id}
                      className="bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setRejecting(null)}
                      className="text-xs text-gray-600 px-4 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => moderate(review.id, "approve")}
                    disabled={processing === review.id}
                    className="bg-green-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === review.id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setRejecting(review.id)}
                    disabled={processing === review.id}
                    className="bg-red-100 text-red-700 text-xs px-4 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
