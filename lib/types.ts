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
export type RiskLevel = "low" | "medium" | "high";
export type RefundStatus = "pending" | "succeeded" | "failed";
export type RefundReason = "requested_by_customer" | "duplicate" | "fraudulent";
export type DiscountType = "percentage" | "fixed";
export type EmailType =
  | "order_confirmation"
  | "admin_alert"
  | "status_update"
  | "low_stock"
  | "review_invitation"
  | "return_update";

// ── Phase 3 enum-like types ───────────────────────────────────
export type AccountStatus = "active" | "suspended" | "deleted";
export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type AddressLabel = "home" | "work" | "other";
export type ReturnRequestType = "return" | "exchange";
export type ReturnReason = "size" | "color" | "damaged" | "defect" | "wrong_item" | "other";
export type ReturnStatus = "pending" | "approved" | "rejected" | "shipped_back" | "completed" | "cancelled";
export type ProductLabel = "new" | "sale" | "bestseller" | "limited";

// ── Database row types ────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  // Phase 3 additions
  date_of_birth: string | null;
  gender: Gender | null;
  preferred_language: string;
  phone_verified: boolean;
  email_verified: boolean;
  account_status: AccountStatus;
  deleted_at: string | null;
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
  // Phase 2 additions
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  sku: string | null;
  weight: number | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  average_rating: number;
  last_restocked_at: string | null;
  collection_ids: string[] | null;
  // Phase 7 AI additions
  description_generated: boolean;
  description_generated_by: string | null;
  ai_tags: string[];
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

// ── Phase 2 types ─────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  product_id: string;
  sort_order: number;
  created_at: string;
}

export interface ProductAnalytics {
  id: string;
  product_id: string;
  date: string;
  views: number;
  searches: number;
  add_to_cart: number;
  searches_from_query: string | null;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_id: string | null;
  order_item_id: string | null;
  rating: number;
  title: string;
  comment: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  unhelpful_count: number;
  is_approved: boolean;
  moderation_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductRating {
  product_id: string;
  average_rating: number;
  review_count: number;
  star_5_count: number;
  star_4_count: number;
  star_3_count: number;
  star_2_count: number;
  star_1_count: number;
  updated_at: string;
}

// ── Phase 3 types ─────────────────────────────────────────────

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: AddressLabel;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  is_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  variant_id: string | null;
  added_at: string;
}

export interface WishlistItemEnriched extends WishlistItem {
  product: Product;
  variant: ProductVariant | null;
  images: ProductImage[];
}

export interface ReviewHelpful {
  id: string;
  review_id: string;
  customer_id: string;
  is_helpful: boolean;
  created_at: string;
}

export interface ReturnExchange {
  id: string;
  order_id: string;
  order_item_id: string;
  request_type: ReturnRequestType;
  reason: ReturnReason;
  reason_description: string | null;
  quantity: number;
  status: ReturnStatus;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  tracking_number: string | null;
  return_address: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmailPreferences {
  id: string;
  customer_id: string;
  order_notifications: boolean;
  marketing_emails: boolean;
  product_alerts: boolean;
  review_invitations: boolean;
  newsletter: boolean;
  updated_at: string;
}

// ── Phase 3 enriched / composed types ─────────────────────────

export interface ProductReviewWithAuthor extends ProductReview {
  author_name: string | null;
  user_vote: boolean | null; // from review_helpful
}

export interface ReturnExchangeWithItems extends ReturnExchange {
  order_item: OrderItem;
  order: Order;
}

export interface CustomerWithStats extends Profile {
  order_count: number;
  total_spent: number; // cents
  review_count: number;
}

// ── Cart types ────────────────────────────────────────────────

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
  // Phase 4 Stripe fields
  stripe_customer_id: string | null;
  stripe_session_id: string | null;
  stripe_charge_id: string | null;
  payment_intent_client_secret: string | null;
  amount_received: number | null;
  payment_metadata: Record<string, unknown> | null;
  risk_level: RiskLevel | null;
  sca_required: boolean;
  last_payment_error: string | null;
  refund_requested_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
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

export interface ProductWithRating extends ProductWithImages {
  rating: ProductRating | null;
}

export interface ProductFull extends ProductWithVariants {
  rating: ProductRating | null;
  reviews: ProductReview[];
}

export interface CollectionWithProducts extends Collection {
  products: ProductWithImages[];
  product_count: number;
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
  // Phase 2
  collections?: string[];
  min_rating?: number;
}

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "featured"
  | "rating"
  | "views";

export interface ProductListParams extends ProductFilters {
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
}

// ── CSV Import ────────────────────────────────────────────────

export interface CsvImportRow {
  name: string;
  description?: string;
  price: string;
  compare_price?: string;
  category?: string;
  sku?: string;
  material?: string;
  care_instructions?: string;
  label?: string;
  tags?: string;
  is_featured?: string;
  sizes?: string;
  colors?: string;
  color_hexes?: string;
  stock?: string;
}

export interface CsvImportResult {
  row: number;
  name: string;
  status: "success" | "error";
  product_id?: string;
  error?: string;
}

// ── Analytics ────────────────────────────────────────────────

export interface ProductAnalyticsSummary {
  product_id: string;
  product_name: string;
  total_views: number;
  total_searches: number;
  total_add_to_cart: number;
  period_days: number;
}

// ── Phase 4: Payment / Stripe types ──────────────────────────────────────────

export interface StripeWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  order_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  stripe_refund_id: string;
  amount: number; // cents
  reason: RefundReason;
  status: RefundStatus;
  requested_by: string | null;
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

export interface RefundWithOrder extends Refund {
  order: Order;
}

export interface CreatePaymentIntentResult {
  order_id: string;
  order_number: string;
  client_secret: string;
  amount: number;
}

export interface PaymentAnalytics {
  revenue: number;
  successful: number;
  failed: number;
  refund_amount: number;
  refund_rate: string;
  average_order_value: number;
  revenue_by_date: Array<{ date: string; revenue: number }>;
}

export interface CheckoutResultWithStripe extends CheckoutResult {
  client_secret?: string;
  payment_method: PaymentMethod;
}

// ── Phase 7: AI & Advanced Features ──────────────────────────

export type AIFeature =
  | "recommendation"
  | "chatbot"
  | "description"
  | "seo"
  | "forecast"
  | "segmentation"
  | "personalization"
  | "analytics";

export type CustomerSegmentLabel =
  | "vip"
  | "loyal"
  | "at_risk"
  | "new"
  | "high_potential";

export type SupportConversationStatus = "open" | "escalated" | "closed";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface SupportConversation {
  id: string;
  user_id: string | null;
  session_id: string | null;
  messages: ChatMessage[];
  status: SupportConversationStatus;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  conversation_id: string | null;
  user_id: string | null;
  subject: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerSegment {
  id: string;
  customer_id: string;
  segment: CustomerSegmentLabel;
  score: number | null;
  updated_at: string;
}

export interface CustomerSegmentWithProfile extends CustomerSegment {
  profile: Pick<Profile, "id" | "email" | "full_name">;
}

export interface ProductEmbedding {
  id: string;
  product_id: string;
  generated_at: string;
}

export interface AIUsageLog {
  id: string;
  feature: AIFeature;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
}

export interface AIGeneratedDescription {
  description: string;
  tokens_used: number;
}

export interface AISEOMetadata {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export interface AIProductTags {
  tags: string[];
}

export interface AIInventoryForecast {
  variant_id: string;
  forecast: Array<{
    week: number;
    predicted_units: number;
    confidence: number;
  }>;
  recommendation: string;
}

export interface AISimilarProduct {
  product_id: string;
  similarity: number;
}

export interface AIAnalyticsResult {
  answer: string;
  insights: string[];
  recommendation?: string;
}

export interface AISegmentResult {
  customer_id: string;
  segment: CustomerSegmentLabel;
  score: number;
  reasoning: string;
}

export interface AIPersonalizationResult {
  product_id: string;
  score: number;
  reason: string;
}
