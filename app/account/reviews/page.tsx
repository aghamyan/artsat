import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerReviews } from "@/services/review.service";
import ReviewsList from "@/components/account/ReviewsList";
import { SITE_NAME } from "@/lib/constants";
import type { ProductReview } from "@/lib/types";

export const metadata: Metadata = {
  title: `My Reviews | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function MyReviewsPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const reviews = await getCustomerReviews(profile.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">My Reviews</h1>
      <ReviewsList reviews={reviews as unknown as ProductReview[]} />
    </div>
  );
}
