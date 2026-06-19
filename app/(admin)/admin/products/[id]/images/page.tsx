import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createServiceClient } from "@/lib/supabase-server";
import { getProductById } from "@/services/product.service";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SITE_NAME } from "@/lib/constants";
import type { ProductImage } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: `Images — ${product?.name ?? "Product"} | Admin | ${SITE_NAME}` };
}

export default async function ImagesPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const supabase = createServiceClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <Link
          href={`/admin/products/${id}/edit`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {product.name}
        </Link>
        <h1 className="text-2xl font-bold">Manage Images</h1>
        <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
      </div>

      <ImageUploader
        productId={id}
        initialImages={(images ?? []) as ProductImage[]}
      />
    </div>
  );
}
