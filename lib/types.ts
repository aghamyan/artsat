// Central TypeScript types — mirror the database schema exactly

export type UserRole = "customer" | "admin" | "staff";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "cash_on_delivery" | "bank_transfer" | "stripe";
export type DiscountType = "percentage" | "fixed";
export type EmailType =
  | "order_confirmation"
  | "admin_alert"
  | "status_update"
  | "low_stock";
export type ProductLabel = "new" | "sale" | "bestseller" | "limited";

// ── Database row types ────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number; // cents
  compare_price: number | null; // cents
  material: string | null;
  care_instructions: string | null;
  is_active: boolean;
  is_featured: boolean;
  label: ProductLabel | null;
  tags: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price_delta: number; // cents
  stock: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  variant_id: string;
  quantity: number;
  added_at: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  items: CartItem[];
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minimum_amount: number;
  max_uses: number | null;
  uses_count: number;
  one_per_customer: boolean;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  guest_token: string | null;
  shipping_full_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_postal_code: string | null;
  shipping_country: string;
  shipping_notes: string | null;
  subtotal: number; // cents
  shipping_fee: number; // cents
  discount_amount: number; // cents
  total: number; // cents
  discount_code_id: string | null;
  discount_code_used: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  stripe_payment_intent_id: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_sku: string;
  variant_size: string | null;
  variant_color: string | null;
  unit_price: number; // cents
  quantity: number;
  total_price: number; // cents
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  order_id: string | null;
  email_type: EmailType;
  recipient: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

// ── Enriched / composed types ─────────────────────────────────

export interface ProductWithImages extends Product {
  images: ProductImage[];
  primary_image: ProductImage | null;
}

export interface ProductWithVariants extends ProductWithImages {
  variants: ProductVariant[];
  category: Category | null;
}

export interface CartItemEnriched extends CartItem {
  product: Product;
  variant: ProductVariant;
  images: ProductImage[];
  unit_price: number; // cents (product.price + variant.price_delta)
  line_total: number; // cents
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// ── API request / response shapes ────────────────────────────

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code?: string;
  country: string;
  notes?: string;
}

export interface CheckoutRequest {
  items: Array<{ variant_id: string; quantity: number }>;
  shipping: ShippingAddress;
  payment_method: PaymentMethod;
  discount_code?: string;
  cart_id?: string;
}

export interface CheckoutResult {
  order_id: string;
  order_number: string;
  total: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface ApiSuccess<T> {
  data: T;
}

// ── Filter / sort types for product listing ───────────────────

export interface ProductFilters {
  category?: string;
  size?: string[];
  color?: string[];
  min_price?: number;
  max_price?: number;
  label?: ProductLabel;
  search?: string;
  in_stock?: boolean;
}

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "featured";

export interface ProductListParams extends ProductFilters {
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
}
