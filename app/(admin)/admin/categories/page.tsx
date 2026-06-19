import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCategories } from "@/services/category.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Categories | Admin | ${SITE_NAME}`,
};

export default async function AdminCategoriesPage() {
  const categories = await getCategories(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4 mr-1" /> New Category
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-right font-medium">Sort</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                <td className="px-4 py-3 text-right">{cat.sort_order}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={cat.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/categories/${cat.id}`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No categories yet.</div>
        )}
      </div>
    </div>
  );
}
