// Application-wide constants

export const SITE_NAME = "Artsat Clothing";
export const SITE_DESCRIPTION =
  "Premium clothing brand. Clean cuts, quality materials, built to last.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Money: ALL prices stored in cents. Never use floats.
export const CURRENCY = "USD";
export const CURRENCY_SYMBOL = "$";

// Shipping
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500; // $75
export const FLAT_SHIPPING_FEE_CENTS = 500; // $5

// Cart
export const CART_SESSION_COOKIE = "artsat_cart_session";
export const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Product listing
export const PRODUCTS_PER_PAGE = 24;
export const LOW_STOCK_THRESHOLD = 5;

// Sizes in display order
export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type ClothingSize = (typeof CLOTHING_SIZES)[number];

// Order status labels for UI
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  ready_for_pickup: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
  refunded: "bg-gray-100 text-gray-800",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

// Admin email for notifications
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@artsat.com";
export const FROM_EMAIL = process.env.FROM_EMAIL ?? "orders@artsat.com";
export const FROM_NAME = process.env.FROM_NAME ?? "Artsat Clothing";

// Stripe (Phase 4 scaffold)
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
