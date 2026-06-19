"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Khachkar-inspired 6-petal rosette — matches the Armenian cross-stone decorative motif
function KhachkarRosette({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  const petals = [0, 60, 120, 180, 240, 300].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return {
      cx: +(10 + 4.5 * Math.cos(a)).toFixed(2),
      cy: +(10 + 4.5 * Math.sin(a)).toFixed(2),
    };
  });

  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      {petals.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r="1.8"
          stroke="currentColor"
          strokeWidth="0.6"
          fill="none"
        />
      ))}
    </svg>
  );
}

const CORNER_ANCHORS = [
  "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
  "top-0 right-0 translate-x-1/2 -translate-y-1/2",
  "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
  "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
] as const;

interface ArmBtnProps {
  href: string;
  accentColor: string;
  glowColor?: string;
  baseDelay: number;
  primary?: boolean;
  btnClassName: string;
  children: React.ReactNode;
}

function ArmBtn({
  href,
  accentColor,
  glowColor,
  baseDelay: d,
  primary,
  btnClassName,
  children,
}: ArmBtnProps) {
  const traceBase: React.CSSProperties = {
    backgroundColor: accentColor,
    animationDuration: "950ms",
    animationTimingFunction: "ease-out",
    animationFillMode: "both",
  };

  return (
    <div className="relative">
      {/* Khachkar rosettes bloom at each corner as the trace begins */}
      {CORNER_ANCHORS.map((pos, i) => (
        <KhachkarRosette
          key={i}
          className={`absolute ${pos} w-5 h-5 animate-armenian-corner pointer-events-none z-10`}
          style={{
            color: accentColor,
            animationDelay: `${d + i * 55}ms`,
            animationFillMode: "both",
          }}
        />
      ))}

      {/* Border trace — draws clockwise: top → right → bottom → left */}
      {/* Top: grows left → right */}
      <div
        className="absolute top-0 left-0 w-full h-px origin-left animate-armenian-trace-h pointer-events-none z-10"
        style={{ ...traceBase, animationDelay: `${d + 40}ms` }}
      />
      {/* Right: grows top → bottom */}
      <div
        className="absolute top-0 right-0 w-px h-full origin-top animate-armenian-trace-v pointer-events-none z-10"
        style={{ ...traceBase, animationDelay: `${d + 270}ms` }}
      />
      {/* Bottom: grows right → left */}
      <div
        className="absolute bottom-0 right-0 w-full h-px origin-right animate-armenian-trace-h pointer-events-none z-10"
        style={{ ...traceBase, animationDelay: `${d + 500}ms` }}
      />
      {/* Left: grows bottom → top */}
      <div
        className="absolute bottom-0 left-0 w-px h-full origin-bottom animate-armenian-trace-v pointer-events-none z-10"
        style={{ ...traceBase, animationDelay: `${d + 730}ms` }}
      />

      {/* Garnet/pomegranate glow radiates behind the secondary button */}
      {glowColor && (
        <div
          className="absolute inset-0 -m-6 pointer-events-none blur-2xl rounded-full animate-armenian-garnet-glow"
          style={{
            backgroundColor: glowColor,
            animationDelay: `${d + 880}ms`,
            animationFillMode: "both",
          }}
        />
      )}

      {/* The button itself materializes after the trace completes */}
      <Link
        href={href}
        className={`${btnClassName} relative animate-armenian-btn-emerge`}
        style={{ animationDelay: `${d + 880}ms`, animationFillMode: "both" }}
      >
        {/* Gold manuscript shimmer sweeps through primary button */}
        {primary && (
          <span
            className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-[#D4AF37]/25 to-transparent animate-armenian-gold-sweep pointer-events-none"
            style={{
              animationDelay: `${d + 1150}ms`,
              animationFillMode: "both",
            }}
          />
        )}
        {children}
      </Link>
    </div>
  );
}

export function HeroButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {/* Primary CTA — gold trace, manuscript shimmer */}
      <ArmBtn
        href="/products"
        accentColor="#C9A227"
        baseDelay={800}
        primary
        btnClassName="group inline-flex items-center justify-center gap-2 h-12 px-10 text-xs tracking-[0.2em] uppercase font-medium cursor-pointer transition-all duration-300 bg-gradient-to-r from-[#8A8AA0] via-[#C8C9DC] to-[#8A8AA0] text-[#07070F] hover:from-[#A0A2B8] hover:via-[#DCDDF0] hover:to-[#A0A2B8] overflow-hidden"
      >
        Shop Collection
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </ArmBtn>

      {/* Secondary CTA — garnet trace, pomegranate glow */}
      <ArmBtn
        href="/products?label=new"
        accentColor="#8B1A2B"
        glowColor="#8B1A2B"
        baseDelay={1300}
        btnClassName="inline-flex items-center justify-center h-12 px-10 text-xs tracking-[0.2em] uppercase font-medium cursor-pointer transition-all duration-300 border border-[#2C2C44] text-[#8A8AA0] hover:border-[#6A6A82] hover:text-[#C0C1D8]"
      >
        New Arrivals
      </ArmBtn>
    </div>
  );
}
