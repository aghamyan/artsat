import React from "react";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, ArrowRight } from "lucide-react";
import { getFeaturedProducts, getNewArrivals } from "@/services/product.service";
import { ProductGrid } from "@/components/products/ProductGrid";
import { HeroButtons } from "@/components/hero/HeroButtons";

const MARQUEE_ITEMS = [
  "Free Shipping Over $75",
  "արծաթ · SS 2026",
  "30-Day Easy Returns",
  "Artsat Clothing",
  "Armenian Craftsmanship",
  "Free Shipping Over $75",
  "արծաթ · SS 2026",
  "30-Day Easy Returns",
  "Artsat Clothing",
  "Armenian Craftsmanship",
];

const HERITAGE_PILLARS = [
  {
    armenian: "Ա",
    title: "Armenian Heritage",
    body: "Born from the ancient mountains of the Caucasus. Every thread carries centuries of Armenian craft tradition.",
  },
  {
    armenian: "Բ",
    title: "Pure Materials",
    body: "We source only the finest fabrics — as enduring and refined as silver itself. Quality felt in every touch.",
  },
  {
    armenian: "Գ",
    title: "Timeless Design",
    body: "Clothes that outlast seasons. Designed to be worn a thousand times, each wearing as perfect as the first.",
  },
];

const USPS = [
  { icon: Truck, title: "Free Shipping", body: "On all orders over $75" },
  { icon: RotateCcw, title: "Easy Returns", body: "Hassle-free within 30 days" },
  { icon: ShieldCheck, title: "Secure Payment", body: "Your data is always protected" },
];

function ArmenianOrnament({ className }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      x1: +(50 + 8 * Math.cos(angle)).toFixed(2),
      y1: +(50 + 8 * Math.sin(angle)).toFixed(2),
      x2: +(50 + 46 * Math.cos(angle)).toFixed(2),
      y2: +(50 + 46 * Math.sin(angle)).toFixed(2),
    };
  });

  const innerRings = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 * Math.PI) / 180;
    return {
      cx: +(50 + 20 * Math.cos(angle)).toFixed(2),
      cy: +(50 + 20 * Math.sin(angle)).toFixed(2),
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      {spokes.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="currentColor"
          strokeWidth="0.4"
        />
      ))}
      {innerRings.map((r, i) => (
        <circle
          key={i}
          cx={r.cx}
          cy={r.cy}
          r="3.5"
          stroke="currentColor"
          strokeWidth="0.4"
          fill="none"
        />
      ))}
    </svg>
  );
}

export default async function HomePage() {
  const [featured, newArrivals] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(4),
  ]);

  return (
    <div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07070F]">

        {/* Depth gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(18,18,46,0.65) 0%, transparent 70%)",
          }}
        />

        {/* Rotating Armenian ornament */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <ArmenianOrnament className="w-[min(640px,90vw)] h-[min(640px,90vw)] text-[#9A9BB6] opacity-[0.05] animate-spin-slow" />
        </div>

        {/* Side accent lines */}
        <div className="absolute top-1/2 left-0 w-1/5 h-px bg-gradient-to-r from-transparent to-[#9A9BB6]/10 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-1/5 h-px bg-gradient-to-l from-transparent to-[#9A9BB6]/10 -translate-y-1/2" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

          <p
            className="animate-fade-up text-[10px] tracking-[0.7em] uppercase mb-8 text-[#5A5A72]"
            style={{ animationDelay: "100ms" }}
          >
            արծաթ &nbsp;·&nbsp; silver
          </p>

          <h1
            className="silver-shimmer-text animate-fade-up font-display italic leading-none tracking-tight mb-5"
            style={{
              fontSize: "clamp(5rem, 13vw, 10rem)",
              animationDelay: "300ms",
            }}
          >
            Artsat
          </h1>

          <div
            className="animate-fade-up w-16 h-px mx-auto mb-8 bg-gradient-to-r from-transparent via-[#6A6A82] to-transparent"
            style={{ animationDelay: "450ms" }}
          />

          <p
            className="animate-fade-up text-base sm:text-lg leading-relaxed max-w-sm mx-auto mb-3 font-light text-[#9A9AB4]"
            style={{ animationDelay: "550ms" }}
          >
            Armenian craftsmanship.<br />Silver-grade quality.
          </p>

          <p
            className="animate-fade-up text-[10px] tracking-[0.35em] uppercase mb-12 text-[#4A4A62]"
            style={{ animationDelay: "650ms" }}
          >
            SS 2026 Collection
          </p>

          <HeroButtons />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 text-[#3A3A52]">
          <span className="text-[9px] tracking-[0.5em] uppercase">Discover</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#3A3A52] to-transparent" />
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────── */}
      <div className="bg-[#07070F] border-t border-[#1A1A2C] overflow-hidden py-3.5">
        <div className="flex animate-marquee whitespace-nowrap">
          {MARQUEE_ITEMS.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-5 text-[10px] tracking-[0.3em] uppercase text-[#4A4A62] px-8"
            >
              {item}
              <span className="silver-text text-sm leading-none" aria-hidden="true">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── EDITORIAL BRAND STORY ────────────────────────────────── */}
      <section className="bg-[#0C0C18] py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          {/* Visual panel */}
          <div className="relative aspect-[4/5] md:aspect-auto md:h-[520px] bg-[#111124] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#181832] to-[#07070F]" />

            {/* Floating ornament */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ArmenianOrnament className="w-56 h-56 text-[#9A9BB6] opacity-10 animate-float" />
            </div>

            {/* Panel caption */}
            <div className="absolute inset-0 flex items-end p-8">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#4A4A62] mb-2">SS 2026</p>
                <p className="silver-text font-display text-3xl italic">The Silver Collection</p>
              </div>
            </div>

            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#2E2E46]" aria-hidden="true" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#2E2E46]" aria-hidden="true" />
          </div>

          {/* Story text */}
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase text-[#4A4A62] mb-6">Our Story</p>
            <h2
              className="font-display text-4xl sm:text-5xl italic font-normal leading-tight mb-6"
              style={{ color: "#B8B9D2" }}
            >
              Born from the<br />mountains of Armenia
            </h2>
            <div className="w-12 h-px bg-gradient-to-r from-[#6A6A82] to-transparent mb-8" />
            <p className="text-base leading-relaxed mb-5 font-light text-[#9A9AB4]">
              Artsat —{" "}
              <span className="font-sans">արծաթ</span> — is the Armenian word
              for silver. A metal revered for millennia for its purity, its
              luster, and its enduring beauty.
            </p>
            <p className="text-base leading-relaxed mb-10 font-light text-[#7A7A96]">
              We built our brand on those same principles. Every garment is
              crafted with the precision of a silversmith: patient, deliberate,
              and built to last.
            </p>
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#7A7A96] hover:text-[#C0C1D8] transition-colors duration-200 cursor-pointer border-b border-[#2E2E46] hover:border-[#6A6A82] pb-1"
            >
              Explore the collection
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ─────────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-24 px-6 bg-[#0F0F1E]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] tracking-[0.5em] uppercase text-[#9A9AAB] mb-3">
                  Just Dropped
                </p>
                <h2 className="font-display text-4xl sm:text-5xl italic font-normal text-foreground">
                  New Arrivals
                </h2>
                <div className="mt-3 w-14 h-0.5 bg-gradient-to-r from-[#9A9AAB] to-transparent" />
              </div>
              <Link
                href="/products?label=new"
                className="group hidden sm:flex items-center gap-1.5 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <ProductGrid products={newArrivals} />
            <div className="mt-10 sm:hidden text-center">
              <Link
                href="/products?label=new"
                className="text-xs tracking-[0.2em] uppercase text-muted-foreground underline underline-offset-4"
              >
                View All New Arrivals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── HERITAGE PILLARS ─────────────────────────────────────── */}
      <section className="bg-[#07070F] py-24 px-6 border-t border-[#16162A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.6em] uppercase text-[#4A4A62] mb-4">
              The Artsat Way
            </p>
            <h2 className="silver-text font-display text-4xl sm:text-5xl italic font-normal">
              What We Stand For
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[#1A1A2C]">
            {HERITAGE_PILLARS.map(({ armenian, title, body }) => (
              <div key={title} className="bg-[#07070F] p-10 flex flex-col gap-6">
                <span className="silver-text font-display text-7xl leading-none select-none">
                  {armenian}
                </span>
                <div>
                  <div className="w-8 h-px bg-[#2E2E46] mb-4" />
                  <h3 className="text-[11px] tracking-[0.25em] uppercase mb-3 font-medium text-[#C0C1D8]">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed font-light text-[#9A9AB4]">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-24 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] tracking-[0.5em] uppercase text-[#9A9AAB] mb-3">
                  Most Loved
                </p>
                <h2 className="font-display text-4xl sm:text-5xl italic font-normal text-foreground">
                  Best Sellers
                </h2>
                <div className="mt-3 w-14 h-0.5 bg-gradient-to-r from-[#9A9AAB] to-transparent" />
              </div>
              <Link
                href="/products?label=bestseller"
                className="group hidden sm:flex items-center gap-1.5 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <ProductGrid products={featured} />
            <div className="mt-10 sm:hidden text-center">
              <Link
                href="/products?label=bestseller"
                className="text-xs tracking-[0.2em] uppercase text-muted-foreground underline underline-offset-4"
              >
                View All Best Sellers
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── USP STRIP ────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0C0C18] border-t border-[#1A1A2C]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {USPS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center text-center gap-4">
              <div className="relative w-14 h-14" aria-hidden="true">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C8C9DC] via-[#A0A1B4] to-[#C8C9DC]" />
                <div className="absolute inset-[1.5px] rounded-full bg-[#0C0C18] flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#9A9AB4]" strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C0C1D8] mb-1">
                  {title}
                </p>
                <p className="text-sm text-[#9A9AB4] font-light">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BRAND MANIFESTO ──────────────────────────────────────── */}
      <section className="relative bg-[#07070F] py-32 px-6 overflow-hidden">

        {/* Background ornament */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <ArmenianOrnament className="w-[min(700px,95vw)] h-[min(700px,95vw)] text-[#9A9BB6] opacity-[0.03]" />
        </div>

        {/* Corner frame */}
        <div className="absolute top-10 left-10 w-12 h-12 border-t border-l border-[#22223A]" aria-hidden="true" />
        <div className="absolute top-10 right-10 w-12 h-12 border-t border-r border-[#22223A]" aria-hidden="true" />
        <div className="absolute bottom-10 left-10 w-12 h-12 border-b border-l border-[#22223A]" aria-hidden="true" />
        <div className="absolute bottom-10 right-10 w-12 h-12 border-b border-r border-[#22223A]" aria-hidden="true" />

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-[10px] tracking-[0.6em] uppercase text-[#3A3A52] mb-10">
            Artsat · <span className="font-sans">արծաթ</span>
          </p>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl italic font-normal leading-snug mb-3 text-[#B0B1C8]">
            Designed to endure.
          </h2>
          <h2 className="silver-shimmer-text font-display text-4xl sm:text-5xl md:text-6xl italic font-normal leading-snug mb-10">
            Made to be worn.
          </h2>

          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#2E2E46]" />
            <span className="text-[#3A3A52] text-xs" aria-hidden="true">◆</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#2E2E46]" />
          </div>

          <p className="text-base leading-relaxed max-w-lg mx-auto mb-12 font-light text-[#9A9AB4]">
            Every piece in our collection is built on the principle that great
            clothing should feel as good on day 1,000 as it does on day one.
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#7A7A96] hover:text-[#C0C1D8] transition-colors duration-300 cursor-pointer border-b border-[#2E2E46] hover:border-[#6A6A82] pb-1"
          >
            Explore the Full Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
