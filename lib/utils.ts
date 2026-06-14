import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY_SYMBOL } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format cents to display currency string, e.g. 2900 → "$29.00" */
export function formatPrice(cents: number): string {
  return `${CURRENCY_SYMBOL}${(cents / 100).toFixed(2)}`;
}

/** Generate a cryptographically random guest token */
export function generateGuestToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a random session ID for guest carts */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Slugify a string for URL use */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parse a Postgres error message to extract user-friendly text */
export function parseDbError(message: string): string {
  const prefixes = [
    "VARIANT_NOT_FOUND",
    "PRODUCT_UNAVAILABLE",
    "INSUFFICIENT_STOCK",
    "STOCK_RACE",
    "INVALID_DISCOUNT",
    "DISCOUNT_MINIMUM_NOT_MET",
    "INVALID_QUANTITY",
  ];
  for (const prefix of prefixes) {
    if (message.startsWith(prefix + ":")) {
      return message.slice(prefix.length + 1).trim();
    }
  }
  return "An unexpected error occurred. Please try again.";
}

/** Truncate text to a max length with ellipsis */
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

/** Format a date string to a readable format */
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

/** Compute discount percentage for display */
export function discountPercent(price: number, comparePrice: number): number {
  if (comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}
