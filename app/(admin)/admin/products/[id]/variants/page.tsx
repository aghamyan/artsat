import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProductById } from "@/services/product.service";
import { VariantManager } from "@/components/admin/VariantManager";
import { SITE_NAME } from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: `Variants — ${product?.name ?? "Product"} | Admin | ${SITE_NAME}` };
}

export default async function VariantsPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div>
        <Link
          href={`/admin/products/${id}/edit`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Back to {product.name}
        </Link>
        <h1 className="text-2xl font-bold">Manage Variants</h1>
        <p className="text-sm text-muted-foreground mt-1">{product.name}</p>
      </div>

      <VariantManager productId={id} initialVariants={product.variants} />
    </div>
  );
}
