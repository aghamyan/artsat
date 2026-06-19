"use client";

import { useState, useEffect } from "react";
import type { ProductReviewWithAuthor, ProductRating } from "@/lib/types";
import RatingDistribution from "./RatingDistribution";
import ReviewCard from "./ReviewCard";

interface Props {
  productId: string;
}

export default function ReviewsSection({ productId }: Props) {
  const [data, setData] = useState<{ reviews: ProductReviewWithAuthor[]; total: number; rating: ProductRating | null } | null>(null);
  const [sort, setSort] = useState<"newest" | "helpful">("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reviews?product_id=${productId}&sort=${sort}&page=${page}&limit=5`)
      .then((r) => r.json())
      .then((json) => { setData(json.data); setLoading(false); });
  }, [productId, sort, page]);

  if (loading && !data) {
    return <div className="py-8 text-center text-gray-400 text-sm">Loading reviews...</div>;
  }

  const { reviews = [], total = 0, rating = null } = data ?? {};
  const totalPages = Math.ceil(total / 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">
          Customer Reviews {total > 0 && <span className="text-gray-400 font-normal text-base">({total})</span>}
        </h2>
        {total > 1 && (
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as "newest" | "helpful"); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="helpful">Most Helpful</option>
          </select>
        )}
      </div>

      {rating && rating.review_count > 0 && (
        <RatingDistribution rating={rating} className="mb-8" />
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No approved reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
