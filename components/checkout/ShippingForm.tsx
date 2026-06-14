"use client";

import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CheckoutFormValues } from "@/lib/validations/checkout";

interface ShippingFormProps {
  form: UseFormReturn<CheckoutFormValues>;
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ShippingForm({ form }: ShippingFormProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const se = errors.shipping;

  return (
    <div className="space-y-4 rounded-lg border p-6">
      <h2 className="font-semibold text-lg">Shipping Information</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            id="full_name"
            label="Full Name"
            required
            error={se?.full_name?.message}
          >
            <Input
              id="full_name"
              placeholder="John Doe"
              {...register("shipping.full_name")}
            />
          </Field>
        </div>

        <Field
          id="email"
          label="Email Address"
          required
          error={se?.email?.message}
        >
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("shipping.email")}
          />
        </Field>

        <Field
          id="phone"
          label="Phone Number"
          required
          error={se?.phone?.message}
        >
          <Input
            id="phone"
            type="tel"
            placeholder="+374 77 123456"
            {...register("shipping.phone")}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            id="address_line1"
            label="Address"
            required
            error={se?.address_line1?.message}
          >
            <Input
              id="address_line1"
              placeholder="Street address, building number"
              {...register("shipping.address_line1")}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field
            id="address_line2"
            label="Apartment / Floor / Unit"
            error={se?.address_line2?.message}
          >
            <Input
              id="address_line2"
              placeholder="Apt 4B, Floor 2 (optional)"
              {...register("shipping.address_line2")}
            />
          </Field>
        </div>

        <Field
          id="city"
          label="City"
          required
          error={se?.city?.message}
        >
          <Input
            id="city"
            placeholder="Yerevan"
            {...register("shipping.city")}
          />
        </Field>

        <Field
          id="postal_code"
          label="Postal Code"
          error={se?.postal_code?.message}
        >
          <Input
            id="postal_code"
            placeholder="0001 (optional)"
            {...register("shipping.postal_code")}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field
            id="notes"
            label="Delivery Notes"
            error={se?.notes?.message}
          >
            <Textarea
              id="notes"
              placeholder="Special instructions, gate code, etc. (optional)"
              rows={3}
              {...register("shipping.notes")}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
