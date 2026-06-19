import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCollections } from "@/services/collection.service";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Collections | ${SITE_NAME}`,
  description: `Explore our curated collections at ${SITE_NAME}.`,
};

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><a href="/" className="hover:text-foreground">Home</a></li>
          <li>/</li>
          <li className="text-foreground font-medium">Collections</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-8">Collections</h1>

      {collections.length === 0 && (
        <p className="text-muted-foreground">No collections yet. Check back soon!</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.slug}`}
            className="group block rounded-xl overflow-hidden border hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-[4/3] bg-secondary">
              {col.image_url ? (
                <Image
                  src={col.image_url}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-4xl font-bold opacity-10">
                  {col.name[0]}
                </div>
              )}
            </div>
            <div className="p-5">
              <h2 className="font-bold text-lg group-hover:underline">{col.name}</h2>
              {col.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {col.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
