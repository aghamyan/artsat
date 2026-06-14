import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createProduct, updateProduct, softDeleteProduct } from "@/services/admin.service";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";

export async function POST(req: NextRequest) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await createProduct(parsed.data, profile.id);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/products]", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { id: string } & Record<string, unknown>;
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    const parsed = updateProductSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const product = await updateProduct(id, parsed.data, profile.id);
    return NextResponse.json(product);
  } catch (err) {
    console.error("[PATCH /api/admin/products]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  let profile;
  try {
    profile = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  try {
    await softDeleteProduct(id, profile.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/products]", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
