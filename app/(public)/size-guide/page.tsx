import React from "react";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Size Guide | ${SITE_NAME}`,
  description: "Find your perfect fit with our clothing size guide.",
};

const MEASUREMENTS = [
  { size: "XS", chest: "32–34", waist: "26–28", hips: "34–36", height: "5'2–5'4" },
  { size: "S", chest: "34–36", waist: "28–30", hips: "36–38", height: "5'4–5'6" },
  { size: "M", chest: "36–38", waist: "30–32", hips: "38–40", height: "5'5–5'7" },
  { size: "L", chest: "38–40", waist: "32–34", hips: "40–42", height: "5'6–5'8" },
  { size: "XL", chest: "40–42", waist: "34–36", hips: "42–44", height: "5'7–5'9" },
  { size: "XXL", chest: "42–44", waist: "36–38", hips: "44–46", height: "5'8–5'10" },
];

export default function SizeGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav aria-label="breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><a href="/" className="hover:text-foreground">Home</a></li>
          <li>/</li>
          <li className="text-foreground font-medium">Size Guide</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-bold mb-2">Size Guide</h1>
      <p className="text-muted-foreground mb-8">
        All measurements are in inches. For the best fit, measure yourself and compare to the chart below.
      </p>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold">Size</th>
              <th className="px-5 py-3.5 text-center font-semibold">Chest</th>
              <th className="px-5 py-3.5 text-center font-semibold">Waist</th>
              <th className="px-5 py-3.5 text-center font-semibold">Hips</th>
              <th className="px-5 py-3.5 text-center font-semibold">Height</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MEASUREMENTS.map((row) => (
              <tr key={row.size} className="hover:bg-muted/20">
                <td className="px-5 py-3 font-bold">{row.size}</td>
                <td className="px-5 py-3 text-center">{row.chest}</td>
                <td className="px-5 py-3 text-center">{row.waist}</td>
                <td className="px-5 py-3 text-center">{row.hips}</td>
                <td className="px-5 py-3 text-center">{row.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <h2 className="text-foreground font-semibold text-base">How to Measure</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong className="text-foreground">Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
          <li><strong className="text-foreground">Waist:</strong> Measure around your natural waistline, at the narrowest point.</li>
          <li><strong className="text-foreground">Hips:</strong> Measure around the fullest part of your hips, about 8 inches below the waistline.</li>
        </ul>
        <p className="pt-2">
          If you&apos;re between sizes, we recommend sizing up for a relaxed fit or down for a more fitted look.
          Questions? <a href="mailto:support@artsat.com" className="underline hover:text-foreground">Contact us</a>.
        </p>
      </div>
    </div>
  );
}
