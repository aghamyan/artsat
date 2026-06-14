import { z } from "zod";

export const shippingAddressSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(8, "Phone number must be at least 8 characters")
    .regex(/^[\d\s\+\-\(\)]+$/, "Invalid phone number"),
  address_line1: z.string().min(5, "Please enter your full address"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().optional(),
  country: z.string().min(2, "Country is required").default("Armenia"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const checkoutFormSchema = z.object({
  shipping: shippingAddressSchema,
  payment_method: z.enum(["cash_on_delivery", "bank_transfer", "stripe"]),
  discount_code: z.string().optional(),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const cartItemSchema = z.object({
  variant_id: z.string().uuid("Invalid variant ID"),
  quantity: z
    .number()
    .int()
    .positive("Quantity must be a positive number")
    .max(10, "Maximum 10 items per variant"),
});

export const checkoutRequestSchema = z.object({
  items: z
    .array(cartItemSchema)
    .min(1, "Cart cannot be empty")
    .max(50, "Too many items"),
  shipping: shippingAddressSchema,
  payment_method: z.enum(["cash_on_delivery", "bank_transfer", "stripe"]),
  discount_code: z.string().max(50).optional(),
  cart_id: z.string().uuid().optional(),
});
