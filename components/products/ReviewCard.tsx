import { format } from "date-fns";
import type { ProductReviewWithAuthor } from "@/lib/types";

interface Props {
  review: ProductReviewWithAuthor;
}

export default function ReviewCard({ review }: Props) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-200"}`}>
                  ★
                </span>
              ))}
            </div>
            {review.is_verified_purchase && (
              <span className="text-xs text-green-600 font-medium">Verified Purchase</span>
            )}
          </div>
          <p className="text-sm font-semibold">{review.title}</p>
          {review.comment && (
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">
          {review.author_name ?? "Anonymous"} · {format(new Date(review.created_at), "MMM d, yyyy")}
        </p>
        {review.helpful_count > 0 && (
          <p className="text-xs text-gray-400">{review.helpful_count} found this helpful</p>
        )}
      </div>
    </div>
  );
}
