import { NextResponse } from "next/server";
import { getServerProfile } from "@/lib/auth";
import { getProductReviews, createReview } from "@/services/review.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const sort = (searchParams.get("sort") ?? "newest") as "newest" | "helpful";

  const result = await getProductReviews(productId, page, limit, sort);
  return NextResponse.json({ data: result });
}

export async function POST(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { product_id, order_item_id, rating, title, comment } = body;

  if (!product_id || !order_item_id || !rating || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }
  if (title.length > 100) {
    return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
  }
  if (comment && comment.length > 1000) {
    return NextResponse.json({ error: "Comment must be 1000 characters or less" }, { status: 400 });
  }

  try {
    const review = await createReview(profile.id, { product_id, order_item_id, rating, title, comment });
    return NextResponse.json({ data: review }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit review";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
