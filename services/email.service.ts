import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase-server";
import { ADMIN_EMAIL, FROM_EMAIL, FROM_NAME, SITE_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types";

const resend = new Resend(process.env.RESEND_API_KEY);

async function logEmail(
  orderId: string | null,
  emailType: string,
  recipient: string,
  status: "sent" | "failed",
  error?: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("email_logs").insert({
    order_id: orderId,
    email_type: emailType,
    recipient,
    status,
    error: error ?? null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}

/** Send order confirmation to the customer */
export async function sendOrderConfirmation(
  order: OrderWithItems
): Promise<void> {
  const recipient = order.guest_email ?? order.shipping_email;
  const orderUrl = order.guest_token
    ? `${SITE_URL}/orders/${order.id}?token=${order.guest_token}`
    : `${SITE_URL}/account/orders/${order.id}`;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          ${item.product_name} — ${[item.variant_size, item.variant_color].filter(Boolean).join(", ")}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">
          ${item.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">
          ${formatPrice(item.total_price)}
        </td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h1 style="font-size:24px;margin-bottom:4px;">Order Confirmed</h1>
      <p style="color:#666;">Thank you for your order, ${order.shipping_full_name}!</p>

      <p><strong>Order Number:</strong> ${order.order_number}</p>

      <h2 style="font-size:18px;margin-top:24px;">Items</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #111;">Item</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #111;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #111;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table style="width:100%;margin-top:16px;">
        <tr><td>Subtotal</td><td style="text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">${formatPrice(order.shipping_fee)}</td></tr>
        ${order.discount_amount > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-${formatPrice(order.discount_amount)}</td></tr>` : ""}
        <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${formatPrice(order.total)}</strong></td></tr>
      </table>

      <h2 style="font-size:18px;margin-top:24px;">Shipping To</h2>
      <p>
        ${order.shipping_full_name}<br/>
        ${order.shipping_address_line1}${order.shipping_address_line2 ? ", " + order.shipping_address_line2 : ""}<br/>
        ${order.shipping_city}${order.shipping_postal_code ? ", " + order.shipping_postal_code : ""}<br/>
        ${order.shipping_country}
      </p>

      <p style="margin-top:24px;">
        <a href="${orderUrl}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">
          View Order
        </a>
      </p>

      <p style="color:#666;font-size:12px;margin-top:32px;">
        If you have any questions, reply to this email or contact us.<br/>
        ${FROM_NAME}
      </p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipient,
      subject: `Order Confirmed — ${order.order_number}`,
      html,
    });
    await logEmail(order.id, "order_confirmation", recipient, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(order.id, "order_confirmation", recipient, "failed", msg);
    // Don't throw — order is already created, email failure is non-fatal
    console.error("[email] Order confirmation failed:", msg);
  }
}

/** Notify admin of a new order */
export async function sendAdminOrderAlert(
  order: OrderWithItems
): Promise<void> {
  const orderAdminUrl = `${SITE_URL}/admin/orders/${order.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h1 style="font-size:20px;">New Order: ${order.order_number}</h1>
      <p><strong>Customer:</strong> ${order.shipping_full_name} (${order.guest_email ?? order.shipping_email})</p>
      <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
      <p><strong>Items:</strong> ${order.items.length}</p>
      <p><strong>Payment:</strong> ${order.payment_method.replace(/_/g, " ")}</p>
      <p>
        <a href="${orderAdminUrl}" style="background:#111;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">
          View in Admin
        </a>
      </p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `New Order: ${order.order_number} — ${formatPrice(order.total)}`,
      html,
    });
    await logEmail(order.id, "admin_alert", ADMIN_EMAIL, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(order.id, "admin_alert", ADMIN_EMAIL, "failed", msg);
    console.error("[email] Admin alert failed:", msg);
  }
}

/** Phase 4: Send payment confirmation after Stripe webhook confirms payment */
export async function sendPaymentConfirmationEmail(orderId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: orderData } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .single();

  if (!orderData) return;

  const order = orderData as OrderWithItems;
  const recipient = order.guest_email ?? order.shipping_email;
  const orderUrl = order.guest_token
    ? `${SITE_URL}/order-confirmation/${order.id}?token=${order.guest_token}`
    : `${SITE_URL}/order-confirmation/${order.id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h1 style="font-size:24px;margin-bottom:4px;color:#16a34a;">✓ Payment Successful</h1>
      <p style="color:#666;">Your payment has been processed, ${order.shipping_full_name}!</p>
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      <p><strong>Amount Paid:</strong> ${formatPrice(order.total)}</p>

      <h2 style="font-size:18px;margin-top:24px;">Order Summary</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #111;">Item</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #111;">Qty</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #111;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #eee;">
                ${item.product_name}${item.variant_size ? ` — ${item.variant_size}` : ""}${item.variant_color ? ` / ${item.variant_color}` : ""}
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.total_price)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>

      <table style="width:100%;margin-top:16px;">
        <tr><td>Subtotal</td><td style="text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td>Shipping</td><td style="text-align:right;">${formatPrice(order.shipping_fee)}</td></tr>
        ${order.discount_amount > 0 ? `<tr><td>Discount</td><td style="text-align:right;">-${formatPrice(order.discount_amount)}</td></tr>` : ""}
        <tr><td><strong>Total</strong></td><td style="text-align:right;"><strong>${formatPrice(order.total)}</strong></td></tr>
      </table>

      <p style="margin-top:24px;">
        <a href="${orderUrl}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">
          View Order
        </a>
      </p>

      <p style="color:#666;font-size:12px;margin-top:32px;">
        ${FROM_NAME}
      </p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipient,
      subject: `Payment Confirmed — Order #${order.order_number}`,
      html,
    });
    await logEmail(order.id, "order_confirmation", recipient, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(order.id, "order_confirmation", recipient, "failed", msg);
    console.error("[email] Payment confirmation failed:", msg);
  }
}

/** Phase 4: Notify customer when payment fails */
export async function sendPaymentFailedEmail(
  orderId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, shipping_email, guest_email, shipping_full_name, total")
    .eq("id", orderId)
    .single();

  if (!order) return;

  const recipient = (order.guest_email ?? order.shipping_email) as string;
  const retryUrl = `${SITE_URL}/checkout?retry=${orderId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h1 style="font-size:24px;color:#dc2626;">Payment Failed</h1>
      <p>Hi ${order.shipping_full_name as string},</p>
      <p>Unfortunately your payment for Order #${order.order_number as string} could not be processed.</p>
      <p style="background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:12px;color:#dc2626;">
        ${errorMessage}
      </p>
      <p>You can retry your payment using the link below:</p>
      <p>
        <a href="${retryUrl}" style="background:#111;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Retry Payment
        </a>
      </p>
      <p style="color:#666;font-size:12px;margin-top:32px;">${FROM_NAME}</p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipient,
      subject: `Payment Failed — Order #${order.order_number as string}`,
      html,
    });
    await logEmail(orderId, "status_update", recipient, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(orderId, "status_update", recipient, "failed", msg);
    console.error("[email] Payment failed notification failed:", msg);
  }
}

/** Phase 4: Notify customer that a refund has been issued */
export async function sendRefundEmail(
  orderId: string,
  refundAmount: number,
  reason: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, shipping_email, guest_email, shipping_full_name")
    .eq("id", orderId)
    .single();

  if (!order) return;

  const recipient = (order.guest_email ?? order.shipping_email) as string;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h1 style="font-size:24px;">Refund Processed</h1>
      <p>Hi ${order.shipping_full_name as string},</p>
      <p>Your refund of <strong>${formatPrice(refundAmount)}</strong> for Order #${order.order_number as string} has been processed.</p>
      <p><strong>Reason:</strong> ${reason.replace(/_/g, " ")}</p>
      <p>Please allow 5-10 business days for the refund to appear on your statement.</p>
      <p style="color:#666;font-size:12px;margin-top:32px;">${FROM_NAME}</p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipient,
      subject: `Refund Processed — Order #${order.order_number as string}`,
      html,
    });
    await logEmail(orderId, "status_update", recipient, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(orderId, "status_update", recipient, "failed", msg);
    console.error("[email] Refund email failed:", msg);
  }
}

// ── Phase 6 automation emails ─────────────────────────────────

export interface AbandonedCartEmailParams {
  email: string;
  full_name: string;
  cart_id: string;
  items: unknown[];
}

export async function sendAbandonedCartEmail(
  params: AbandonedCartEmailParams
): Promise<void> {
  const { email, full_name, cart_id, items } = params;
  const recoveryLink = `${SITE_URL}/cart?recovery=${cart_id}`;
  const itemCount = Array.isArray(items) ? items.length : 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2 style="font-size:22px;">You left something behind, ${full_name}!</h2>
      <p>You have ${itemCount} item${itemCount !== 1 ? "s" : ""} waiting in your cart.</p>
      <p>
        <a href="${recoveryLink}"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Return to Cart
        </a>
      </p>
      <p style="color:#666;font-size:13px;">This offer expires in 48 hours.</p>
      <p style="color:#666;font-size:12px;">— The ${FROM_NAME} Team</p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `You left items in your cart!`,
      html,
    });
    await logEmail(null, "abandoned_cart", email, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(null, "abandoned_cart", email, "failed", msg);
    throw err;
  }
}

export interface ReviewInvitationEmailParams {
  email: string;
  full_name: string;
  order_id: string;
  order_number: string;
  items: {
    product_id: string;
    product_name: string;
    variant_size: string | null;
    variant_color: string | null;
  }[];
}

export async function sendReviewInvitationEmail(
  params: ReviewInvitationEmailParams
): Promise<void> {
  const { email, full_name, order_id, order_number, items } = params;
  const supabase = createServiceClient();

  const itemsHtml = items
    .map((item) => {
      const variant = [item.variant_size, item.variant_color]
        .filter(Boolean)
        .join(", ");
      const reviewLink = `${SITE_URL}/account/orders/${order_id}#review-${item.product_id}`;
      return `
        <li style="margin-bottom:8px;">
          <strong>${item.product_name}</strong>${variant ? ` (${variant})` : ""} —
          <a href="${reviewLink}" style="color:#111;">Write a review</a>
        </li>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2>How was your order, ${full_name}?</h2>
      <p>We hope you're enjoying your recent purchase from Order #${order_number}.</p>
      <p>Your review helps other shoppers — it only takes a minute!</p>
      <ul style="padding-left:20px;">
        ${itemsHtml}
      </ul>
      <p style="color:#666;font-size:12px;margin-top:24px;">— The ${FROM_NAME} Team</p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `How was your order? Share your thoughts!`,
      html,
    });
    // Log against the order so we can deduplicate
    const { data: orderRow } = await supabase
      .from("orders")
      .select("id")
      .eq("id", order_id)
      .single();
    await logEmail(orderRow?.id ?? null, "review_invitation", email, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(order_id, "review_invitation", email, "failed", msg);
    throw err;
  }
}

export interface PaymentRetryEmailParams {
  email: string;
  full_name: string;
  order_id: string;
  order_number: string;
  total: number;
}

export async function sendPaymentRetryEmail(
  params: PaymentRetryEmailParams
): Promise<void> {
  const { email, full_name, order_id, order_number, total } = params;
  const retryLink = `${SITE_URL}/retry-payment/${order_id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111;">
      <h2>Your payment didn't go through, ${full_name}</h2>
      <p>We were unable to process payment for Order <strong>#${order_number}</strong>
         (${formatPrice(total)}).</p>
      <p>This can happen due to an expired card, insufficient funds, or a temporary bank issue.</p>
      <p>
        <a href="${retryLink}"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
          Retry Payment
        </a>
      </p>
      <p style="color:#666;font-size:12px;">If you need help, reply to this email.<br>— The ${FROM_NAME} Team</p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: `Action needed: Payment failed for Order #${order_number}`,
      html,
    });
    await logEmail(order_id, "payment_retry", email, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(order_id, "payment_retry", email, "failed", msg);
    throw err;
  }
}

export interface LowStockAlertEmailParams {
  items: {
    sku: string;
    product_name: string;
    size: string | null;
    color: string | null;
    stock: number;
    reorder_level: number;
  }[];
}

export async function sendLowStockAlertEmail(
  params: LowStockAlertEmailParams
): Promise<void> {
  const { items } = params;

  const rowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-family:monospace;">${item.sku}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.size ?? "—"} / ${item.color ?? "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#dc2626;">${item.stock}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.reorder_level}</td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:sans-serif;max-width:700px;margin:0 auto;color:#111;">
      <h2>⚠️ Low Stock Alert — ${items.length} SKU${items.length !== 1 ? "s" : ""} need restocking</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f4f4f5;">
            <th style="padding:8px;text-align:left;">Product</th>
            <th style="padding:8px;text-align:left;">SKU</th>
            <th style="padding:8px;text-align:left;">Size / Color</th>
            <th style="padding:8px;text-align:center;">Stock</th>
            <th style="padding:8px;text-align:center;">Reorder Level</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin-top:16px;">
        <a href="${SITE_URL}/admin/products" style="color:#111;">View products in admin →</a>
      </p>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `Low Stock Alert — ${items.length} SKU${items.length !== 1 ? "s" : ""} need restocking`,
      html,
    });
    await logEmail(null, "low_stock", ADMIN_EMAIL, "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logEmail(null, "low_stock", ADMIN_EMAIL, "failed", msg);
    throw err;
  }
}
