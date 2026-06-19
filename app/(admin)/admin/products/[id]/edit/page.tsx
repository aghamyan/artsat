import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/services/product.service";
import { getCategories } from "@/services/category.service";
import { SITE_NAME } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: `Edit ${product?.name ?? "Product"} | Admin | ${SITE_NAME}` };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Products
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link
              href={`/admin/products/${id}/variants`}
              className="text-muted-foreground hover:text-foreground underline"
            >
              Manage Variants
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href={`/admin/products/${id}/images`}
              className="text-muted-foreground hover:text-foreground underline"
            >
              Manage Images
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href={`/admin/products/${id}/analytics`}
              className="text-muted-foreground hover:text-foreground underline"
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>

      <ProductForm categories={categories} product={product} />
    </div>
  );
}
