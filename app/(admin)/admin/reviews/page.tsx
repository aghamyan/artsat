import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getPendingReviews } from "@/services/review.service";
import ReviewModerationPanel from "@/components/admin/ReviewModerationPanel";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Review Moderation | Admin | ${SITE_NAME}`,
};

export default async function AdminReviewsPage() {
  await requireAdmin();
  const { reviews, total } = await getPendingReviews(1, 20);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>
      <ReviewModerationPanel reviews={reviews as Parameters<typeof ReviewModerationPanel>[0]["reviews"]} total={total} />
    </div>
  );
}
