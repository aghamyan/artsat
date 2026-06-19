import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/services/category.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `New Product | Admin | ${SITE_NAME}`,
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold">New Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below. Variants can be managed after creation.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}
