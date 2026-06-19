import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `New Collection | Admin | ${SITE_NAME}` };

export default function NewCollectionPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/collections" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Collections
        </Link>
        <h1 className="text-2xl font-bold">New Collection</h1>
      </div>
      <CollectionForm />
    </div>
  );
}
