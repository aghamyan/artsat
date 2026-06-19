import type { ProductRating } from "@/lib/types";

interface Props {
  rating: ProductRating;
  className?: string;
}

export default function RatingDistribution({ rating, className = "" }: Props) {
  const bars: Array<{ stars: number; count: number }> = [
    { stars: 5, count: rating.star_5_count },
    { stars: 4, count: rating.star_4_count },
    { stars: 3, count: rating.star_3_count },
    { stars: 2, count: rating.star_2_count },
    { stars: 1, count: rating.star_1_count },
  ];

  return (
    <div className={`flex gap-8 ${className}`}>
      {/* Overall */}
      <div className="text-center shrink-0">
        <p className="text-4xl font-bold">{Number(rating.average_rating).toFixed(1)}</p>
        <div className="flex justify-center my-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-base ${i < Math.round(rating.average_rating) ? "text-yellow-400" : "text-gray-200"}`}>
              ★
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500">{rating.review_count} review{rating.review_count !== 1 ? "s" : ""}</p>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-1.5">
        {bars.map(({ stars, count }) => {
          const pct = rating.review_count > 0 ? (count / rating.review_count) * 100 : 0;
          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-3">{stars}</span>
              <span className="text-yellow-400 text-xs">★</span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
