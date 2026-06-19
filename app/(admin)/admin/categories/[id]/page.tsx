import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategoryById, getCategories } from "@/services/category.service";
import { SITE_NAME } from "@/lib/constants";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cat = await getCategoryById(id);
  return { title: `Edit ${cat?.name ?? "Category"} | Admin | ${SITE_NAME}` };
}

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const [category, categories] = await Promise.all([getCategoryById(id), getCategories(false)]);
  if (!category) notFound();
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/categories" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Categories
        </Link>
        <h1 className="text-2xl font-bold">Edit Category</h1>
      </div>
      <CategoryForm category={category} parentCategories={categories.filter(c => c.id !== id)} />
    </div>
  );
}
