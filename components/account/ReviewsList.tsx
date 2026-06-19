import Link from "next/link";
import { format } from "date-fns";
import type { ProductReview } from "@/lib/types";

interface ReviewWithProduct extends ProductReview {
  product?: { name: string; slug: string; images?: Array<{ url: string; is_primary: boolean }> };
}

interface Props {
  reviews: ReviewWithProduct[];
}

export default function ReviewsList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-2">No reviews yet</p>
        <p className="text-sm">After purchasing products, you can leave reviews here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {review.product && (
                <Link
                  href={`/products/${review.product.slug}`}
                  className="text-sm font-medium text-gray-800 hover:underline"
                >
                  {review.product.name}
                </Link>
              )}
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm font-medium mt-2">{review.title}</p>
              {review.comment && <p className="text-sm text-gray-600 mt-1">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(review.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <div className="shrink-0">
              {review.is_approved ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Published</span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
