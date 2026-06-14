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
