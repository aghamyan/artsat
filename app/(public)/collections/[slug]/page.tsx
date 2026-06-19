import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/services/collection.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SITE_NAME } from "@/lib/constants";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Collection Not Found" };
  return {
    title: `${collection.name} | ${SITE_NAME}`,
    description: collection.description ?? `Explore the ${collection.name} collection at ${SITE_NAME}.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><a href="/" className="hover:text-foreground">Home</a></li>
          <li>/</li>
          <li><a href="/collections" className="hover:text-foreground">Collections</a></li>
          <li>/</li>
          <li className="text-foreground font-medium">{collection.name}</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{collection.name}</h1>
        {collection.description && (
          <p className="text-muted-foreground mt-2 max-w-2xl">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {collection.product_count} product{collection.product_count !== 1 ? "s" : ""}
        </p>
      </div>

      {collection.products.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">
          No products in this collection yet.
        </p>
      ) : (
        <ProductGrid products={collection.products} />
      )}
    </div>
  );
}
