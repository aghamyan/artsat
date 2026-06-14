import React from "react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export function Loading({
  className,
  size = "md",
  fullPage = false,
}: LoadingProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
  };

  const spinner = (
    <div
      className={cn(
        "rounded-full border-muted-foreground/30 border-t-foreground animate-spin",
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
