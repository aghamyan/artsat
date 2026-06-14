import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/services/product.service";
import { ProductDetail } from "@/components/products/ProductDetail";
import { SITE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description: product.description ?? `Shop ${product.name} at ${SITE_NAME}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images.find((i) => i.is_primary)
        ? [{ url: product.images.find((i) => i.is_primary)!.url }]
        : [],
    },
    other: {
      "product:price:amount": String(product.price / 100),
      "product:price:currency": "USD",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <nav aria-label="breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><a href="/" className="hover:text-foreground">Home</a></li>
          <li>/</li>
          <li><a href="/products" className="hover:text-foreground">Shop</a></li>
          <li>/</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <ProductDetail product={product} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            offers: {
              "@type": "Offer",
              price: formatPrice(product.price),
              priceCurrency: "USD",
              availability:
                product.variants?.some((v) => v.stock > 0)
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
    </div>
  );
}
