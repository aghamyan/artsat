import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerOrderDetail } from "@/services/customer.service";
import ReviewForm from "@/components/account/ReviewForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Write Review | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const profile = await getServerProfile();
  if (!profile) return null;

  const order = await getCustomerOrderDetail(id, profile.id);
  if (!order) notFound();

  if (order.status !== "delivered") {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>You can only review products from delivered orders.</p>
      </div>
    );
  }

  const item = order.items?.find((i: { id: string }) => i.id === itemId);
  if (!item) notFound();

  const alreadyReviewed = !!order.reviews?.[itemId];
  if (alreadyReviewed) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>You have already reviewed this item.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Write a Review</h1>
      <ReviewForm
        productId={(item as { product_id?: string }).product_id ?? ""}
        orderItemId={itemId}
        productName={item.product_name}
      />
    </div>
  );
}
