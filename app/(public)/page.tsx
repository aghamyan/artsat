import React from "react";
import Link from "next/link";
import { getFeaturedProducts, getNewArrivals } from "@/services/product.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [featured, newArrivals] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(4),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center bg-neutral-950 text-white">
        <div className="max-w-2xl text-center px-6">
          <p className="text-sm tracking-[0.3em] uppercase text-neutral-400 mb-4">
            New Season
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
            Artsat Clothing
          </h1>
          <p className="text-lg text-neutral-300 mb-8">
            Premium everyday essentials crafted for those who value quality and simplicity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-neutral-100 h-12 px-8">
              <Link href="/products">Shop Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 h-12 px-8">
              <Link href="/products?label=new">New Arrivals</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">New Arrivals</h2>
            <Link href="/products?label=new" className="text-sm underline text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto border-t">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Best Sellers</h2>
            <Link href="/products?label=bestseller" className="text-sm underline text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {/* USPs */}
      <section className="py-16 bg-muted">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
          {[
            { title: "Free Shipping", body: "On orders over $75" },
            { title: "Easy Returns", body: "30-day hassle-free returns" },
            { title: "Secure Payment", body: "Your data is always protected" },
          ].map(({ title, body }) => (
            <div key={title}>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
