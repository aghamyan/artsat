import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { getCollectionById, getCollectionProducts } from "@/services/collection.service";
import { SITE_NAME } from "@/lib/constants";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const col = await getCollectionById(id);
  return { title: `Edit ${col?.name ?? "Collection"} | Admin | ${SITE_NAME}` };
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const [collection, productIds] = await Promise.all([
    getCollectionById(id),
    getCollectionProducts(id),
  ]);
  if (!collection) notFound();

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/collections" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Collections
        </Link>
        <h1 className="text-2xl font-bold">Edit Collection</h1>
      </div>
      <CollectionForm collection={collection} productIds={productIds} />
    </div>
  );
}
