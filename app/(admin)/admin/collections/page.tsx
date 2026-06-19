import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCollections } from "@/services/collection.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Collections | Admin | ${SITE_NAME}` };

export default async function AdminCollectionsPage() {
  const collections = await getCollections(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Button asChild>
          <Link href="/admin/collections/new">
            <Plus className="h-4 w-4 mr-1" /> New Collection
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
              <th className="px-4 py-3 text-left font-medium">Featured</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {collections.map((col) => (
              <tr key={col.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{col.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{col.slug}</td>
                <td className="px-4 py-3 text-right">{col.sort_order}</td>
                <td className="px-4 py-3">
                  {col.is_featured && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className={col.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {col.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/collections/${col.id}`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {collections.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No collections yet.</div>
        )}
      </div>
    </div>
  );
}
