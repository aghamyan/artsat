import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import type { ProductReview, ProductReviewWithAuthor, ProductRating } from "@/lib/types";

export interface ReviewListResult {
  reviews: ProductReviewWithAuthor[];
  total: number;
  rating: ProductRating | null;
}

export async function getProductReviews(
  productId: string,
  page = 1,
  limit = 10,
  sort: "newest" | "helpful" = "newest"
): Promise<ReviewListResult> {
  const supabase = await createServerSupabaseClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("product_reviews")
    .select(
      `*, author:profiles!customer_id(full_name)`,
      { count: "exact" }
    )
    .eq("product_id", productId)
    .eq("is_approved", true);

  if (sort === "helpful") {
    query = query.order("helpful_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw error;

  const { data: rating } = await supabase
    .from("product_ratings")
    .select("*")
    .eq("product_id", productId)
    .single();

  const reviews = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    author_name: (r.author as Record<string, unknown> | null)?.full_name ?? null,
    user_vote: null,
  })) as ProductReviewWithAuthor[];

  return { reviews, total: count ?? 0, rating: rating ?? null };
}

export async function getCustomerReviews(customerId: string): Promise<ProductReview[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*, product:products(name, slug, images:product_images(url, is_primary))")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ProductReview[];
}

export async function createReview(
  customerId: string,
  review: {
    product_id: string;
    order_item_id: string;
    rating: number;
    title: string;
    comment?: string;
  }
): Promise<ProductReview> {
  const supabase = createServiceClient();

  // Verify order_item belongs to this customer (use user_id on orders)
  const { data: orderItem } = await supabase
    .from("order_items")
    .select("id, product_id, orders!inner(user_id)")
    .eq("id", review.order_item_id)
    .single();

  if (!orderItem) throw new Error("Order item not found");

  const order = (orderItem as Record<string, unknown>).orders as Record<string, unknown>;
  if (order?.user_id !== customerId) throw new Error("Not authorized");

  // Check not already reviewed
  const { data: existing } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("order_item_id", review.order_item_id)
    .maybeSingle();

  if (existing) throw new Error("You have already reviewed this item");

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      ...review,
      customer_id: customerId,
      is_approved: false,
      is_verified_purchase: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ProductReview;
}

export async function moderateReview(
  reviewId: string,
  action: "approve" | "reject",
  notes?: string
): Promise<void> {
  const supabase = createServiceClient();
  // Rejected reviews must have non-null notes so the pending filter (notes IS NULL) excludes them
  const moderationNotes =
    action === "reject" ? (notes?.trim() || "Rejected") : (notes ?? null);

  const { error } = await supabase
    .from("product_reviews")
    .update({
      is_approved: action === "approve",
      moderation_notes: moderationNotes,
    })
    .eq("id", reviewId);

  if (error) throw error;
}

export async function getPendingReviews(
  page = 1,
  limit = 20
): Promise<{ reviews: ProductReview[]; total: number }> {
  const supabase = createServiceClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("product_reviews")
    .select(
      `*, product:products(name, slug), author:profiles!customer_id(full_name, email)`,
      { count: "exact" }
    )
    .eq("is_approved", false)
    .is("moderation_notes", null)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { reviews: (data ?? []) as unknown as ProductReview[], total: count ?? 0 };
}

export async function voteHelpful(
  reviewId: string,
  customerId: string,
  isHelpful: boolean
): Promise<void> {
  const supabase = createServiceClient();

  // Upsert vote
  const { error: voteError } = await supabase
    .from("review_helpful")
    .upsert(
      { review_id: reviewId, customer_id: customerId, is_helpful: isHelpful },
      { onConflict: "review_id,customer_id" }
    );

  if (voteError) throw voteError;

  // Recount from review_helpful
  const { count: helpfulCount } = await supabase
    .from("review_helpful")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId)
    .eq("is_helpful", true);

  const { count: unhelpfulCount } = await supabase
    .from("review_helpful")
    .select("*", { count: "exact", head: true })
    .eq("review_id", reviewId)
    .eq("is_helpful", false);

  await supabase
    .from("product_reviews")
    .update({
      helpful_count: helpfulCount ?? 0,
      unhelpful_count: unhelpfulCount ?? 0,
    })
    .eq("id", reviewId);
}
