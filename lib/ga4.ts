/**
 * GA4 tracking helpers.
 * All functions are no-ops if gtag is unavailable or GA4_ID is not set.
 * See components/analytics/GA4Provider.tsx for script injection.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  gtag("event", eventName, params ?? {});
}

// ── Ecommerce events ──────────────────────────────────────────

export function trackViewItem(product: {
  id: string;
  name: string;
  price: number; // cents
  category?: string;
}): void {
  trackEvent("view_item", {
    currency: "USD",
    value: product.price / 100,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price / 100,
        item_category: product.category,
      },
    ],
  });
}

export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number; // cents
  quantity: number;
}): void {
  trackEvent("add_to_cart", {
    currency: "USD",
    value: (product.price * product.quantity) / 100,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price / 100,
        quantity: product.quantity,
      },
    ],
  });
}

export function trackBeginCheckout(total: number): void {
  trackEvent("begin_checkout", {
    currency: "USD",
    value: total / 100,
  });
}

export function trackPurchase(order: {
  order_number: string;
  total: number; // cents
  items: { product_id: string; product_name: string; unit_price: number; quantity: number }[];
}): void {
  trackEvent("purchase", {
    transaction_id: order.order_number,
    currency: "USD",
    value: order.total / 100,
    items: order.items.map((i) => ({
      item_id: i.product_id,
      item_name: i.product_name,
      price: i.unit_price / 100,
      quantity: i.quantity,
    })),
  });
}

export function trackSearch(query: string): void {
  trackEvent("search", { search_term: query });
}
