import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase-server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://artsatclothing.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .is("deleted_at", null);

  const productUrls = (products ?? []).map(({ slug, updated_at }) => ({
    url: `${BASE_URL}/products/${slug}`,
    lastModified: new Date(updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...productUrls,
  ];
}
