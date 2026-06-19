/**
 * Lightweight A/B testing framework.
 *
 * Variant assignment is deterministic: same userId + testId → same variant.
 * No network call needed to assign; only conversion tracking hits the API.
 *
 * Usage:
 *   const variant = getVariant('checkout-cta', userId);
 *   // variant === 'control' | 'variant_a' | ...
 */

export interface ABTest {
  id: string;
  name: string;
  variants: string[];
  /** Weights must sum to 1. Same order as variants array. */
  weights: number[];
}

/** Active tests — add new tests here. */
export const AB_TESTS: Record<string, ABTest> = {
  "checkout-cta": {
    id: "checkout-cta",
    name: "Checkout CTA Text",
    variants: ["control", "variant_a"],
    weights: [0.5, 0.5],
  },
  "product-card-layout": {
    id: "product-card-layout",
    name: "Product Card Layout",
    variants: ["control", "compact"],
    weights: [0.5, 0.5],
  },
};

/**
 * Deterministic hash that maps (userId, testId) → a number in [0, 1).
 * Uses a simple djb2-style hash so it works client-side without crypto.
 */
function deterministicRatio(userId: string, testId: string): number {
  const input = `${testId}:${userId}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash / 0xffffffff;
}

/**
 * Returns the variant name for a given user and test.
 * Falls back to 'control' if test is unknown.
 */
export function getVariant(testId: string, userId: string): string {
  const test = AB_TESTS[testId];
  if (!test) return "control";

  const ratio = deterministicRatio(userId, testId);
  let cumulative = 0;
  for (let i = 0; i < test.variants.length; i++) {
    cumulative += test.weights[i];
    if (ratio < cumulative) return test.variants[i];
  }
  return test.variants[test.variants.length - 1];
}

/**
 * Track a conversion event for an A/B test.
 * Sends to GA4 (if available) and optionally to the DB via the API route.
 */
export function trackVariantConversion(
  testId: string,
  userId: string,
  converted: boolean
): void {
  const variant = getVariant(testId, userId);

  // GA4 event
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "ab_test_conversion", {
      test_id: testId,
      variant,
      converted,
      user_id: userId,
    });
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
