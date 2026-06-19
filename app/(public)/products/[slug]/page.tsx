import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductRating,
} from "@/services/product.service";
import { ProductDetail } from "@/components/products/ProductDetail";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import ReviewsSection from "@/components/products/ReviewsSection";
import { RecommendedProducts } from "@/components/products/RecommendedProducts";
import { AnalyticsTracker } from "@/components/products/AnalyticsTracker";
import { SITE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  const title = product.meta_title ?? `${product.name} | ${SITE_NAME}`;
  const description =
    product.meta_description ??
    product.description?.substring(0, 160) ??
    `Shop ${product.name} at ${SITE_NAME}`;

  return {
    title,
    description,
    keywords: product.meta_keywords ?? undefined,
    openGraph: {
      title: product.meta_title ?? product.name,
      description,
      images: product.images.find((i) => i.is_primary)
        ? [{ url: product.images.find((i) => i.is_primary)!.url }]
        : [],
      type: "website",
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/products/${product.slug}`,
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

  const [related, rating] = await Promise.all([
    getRelatedProducts(product.id, product.category_id, product.price),
    getProductRating(product.id),
  ]);

  const isInStock = product.variants?.some((v) => v.stock > 0) ?? false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Analytics tracker (client component — fires on mount) */}
      <AnalyticsTracker productId={product.id} event="views" />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><a href="/" className="hover:text-foreground">Home</a></li>
          <li>/</li>
          <li><a href="/products" className="hover:text-foreground">Shop</a></li>
          {product.category && (
            <>
              <li>/</li>
              <li>
                <a
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-foreground"
                >
                  {product.category.name}
                </a>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main product detail */}
      <ProductDetail product={product} rating={rating} />

      {/* Reviews */}
      <section className="mt-12">
        <ReviewsSection productId={product.id} />
      </section>

      {/* AI Recommendations */}
      <RecommendedProducts productId={product.id} />

      {/* Related products */}
      <RelatedProducts products={related} />

      {/* Structured data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.sku,
            image: product.images.map((img) => img.url),
            brand: { "@type": "Brand", name: "Artsat" },
            offers: {
              "@type": "Offer",
              price: (product.price / 100).toFixed(2),
              priceCurrency: "USD",
              availability: isInStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/products/${product.slug}`,
            },
            ...(rating && rating.review_count > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: rating.average_rating,
                    reviewCount: rating.review_count,
                  },
                }
              : {}),
          }),
        }}
      />
    </div>
  );
}
