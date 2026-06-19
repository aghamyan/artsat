import { createServiceClient } from "@/lib/supabase-server";
import type { ProductImage } from "@/lib/types";

const STORAGE_BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadProductImage(
  productId: string,
  file: File,
  altText?: string
): Promise<ProductImage> {
  if (file.size > MAX_FILE_SIZE) throw new Error("Image must be under 5 MB");
  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error("Only JPG, PNG, and WebP images are allowed");

  const supabase = createServiceClient();

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${productId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Determine next sort_order
  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = existing?.length ? existing[0].sort_order + 1 : 0;
  const isPrimary = nextSortOrder === 0;

  const { data: imageRow, error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      alt_text: altText ?? null,
      is_primary: isPrimary,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  return imageRow as ProductImage;
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: img, error: fetchError } = await supabase
    .from("product_images")
    .select("url, product_id, is_primary")
    .eq("id", imageId)
    .single();

  if (fetchError || !img) throw new Error("Image not found");

  // Remove from storage
  const url = new URL(img.url);
  const pathParts = url.pathname.split(`/${STORAGE_BUCKET}/`);
  if (pathParts.length > 1) {
    await supabase.storage.from(STORAGE_BUCKET).remove([pathParts[1]]);
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);
  if (deleteError) throw new Error(deleteError.message);

  // If it was primary, promote the next image
  if (img.is_primary) {
    const { data: nextImg } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", img.product_id)
      .order("sort_order", { ascending: true })
      .limit(1);
    if (nextImg?.length) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", nextImg[0].id);
    }
  }
}

export async function setPrimaryImage(
  productId: string,
  imageId: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  if (error) throw new Error(error.message);
}

export async function reorderImages(
  orders: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = createServiceClient();
  await Promise.all(
    orders.map(({ id, sort_order }) =>
      supabase.from("product_images").update({ sort_order }).eq("id", id)
    )
  );
}

export async function updateImageAltText(
  imageId: string,
  altText: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("product_images")
    .update({ alt_text: altText })
    .eq("id", imageId);
  if (error) throw new Error(error.message);
}
