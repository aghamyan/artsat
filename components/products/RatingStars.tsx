import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function RatingStars({
  rating,
  reviewCount,
  size = "sm",
  showCount = true,
}: RatingStarsProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : size === "md" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(iconSize, "shrink-0", {
              "fill-yellow-400 text-yellow-400": star <= Math.round(rating),
              "fill-muted text-muted-foreground": star > Math.round(rating),
            })}
          />
        ))}
      </div>
      {showCount && reviewCount !== undefined && (
        <span className={cn(textSize, "text-muted-foreground")}>
          {rating.toFixed(1)} ({reviewCount})
        </span>
      )}
    </div>
  );
}
