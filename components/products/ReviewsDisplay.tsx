import React from "react";
import { RatingStars } from "./RatingStars";
import type { ProductRating, ProductReview } from "@/lib/types";

interface ReviewsDisplayProps {
  rating: ProductRating | null;
  reviews: ProductReview[];
}

function StarBar({ count, total, label }: { count: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-muted-foreground">{count}</span>
    </div>
  );
}

export function ReviewsDisplay({ rating, reviews }: ReviewsDisplayProps) {
  if (!rating || rating.review_count === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        <p className="text-sm text-muted-foreground">
          No reviews yet. Be the first to leave a review!
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-8">
        {/* Summary */}
        <div className="space-y-3">
          <div className="text-5xl font-bold">{rating.average_rating.toFixed(1)}</div>
          <RatingStars
            rating={rating.average_rating}
            reviewCount={rating.review_count}
            size="md"
          />
          <p className="text-sm text-muted-foreground">
            Based on {rating.review_count} review{rating.review_count !== 1 ? "s" : ""}
          </p>

          {/* Star breakdown */}
          <div className="space-y-1.5 pt-1">
            <StarBar count={rating.star_5_count} total={rating.review_count} label="5 ★" />
            <StarBar count={rating.star_4_count} total={rating.review_count} label="4 ★" />
            <StarBar count={rating.star_3_count} total={rating.review_count} label="3 ★" />
            <StarBar count={rating.star_2_count} total={rating.review_count} label="2 ★" />
            <StarBar count={rating.star_1_count} total={rating.review_count} label="1 ★" />
          </div>
        </div>

        {/* Review list */}
        <div className="md:col-span-2 space-y-6">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="space-y-2 pb-6 border-b last:border-b-0">
              <div className="flex items-start justify-between">
                <div>
                  <RatingStars rating={review.rating} showCount={false} size="sm" />
                  <p className="font-semibold mt-1">{review.title}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
              {review.is_verified_purchase && (
                <span className="inline-block text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  Verified Purchase
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
