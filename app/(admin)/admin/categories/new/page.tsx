import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategories } from "@/services/category.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `New Category | Admin | ${SITE_NAME}` };

export default async function NewCategoryPage() {
  const categories = await getCategories(false);
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/categories" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Categories
        </Link>
        <h1 className="text-2xl font-bold">New Category</h1>
      </div>
      <CategoryForm parentCategories={categories} />
    </div>
  );
}
