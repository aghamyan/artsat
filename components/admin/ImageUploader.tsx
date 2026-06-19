"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Star, Trash2, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ProductImage } from "@/lib/types";

interface ImageUploaderProps {
  productId: string;
  initialImages: ProductImage[];
}

export function ImageUploader({ productId, initialImages }: ImageUploaderProps) {
  const [images, setImages] = useState<ProductImage[]>(
    [...initialImages].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [altInputs, setAltInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    setProgress(0);

    let done = 0;
    const newImages: ProductImage[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt_text", file.name.replace(/\.[^.]+$/, ""));

      try {
        const res = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        newImages.push(json.data);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }

      done++;
      setProgress(Math.round((done / files.length) * 100));
    }

    if (newImages.length) {
      setImages((prev) => [...prev, ...newImages]);
      toast.success(`${newImages.length} image(s) uploaded`);
    }

    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSetPrimary(imageId: string) {
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_primary", image_id: imageId }),
      });
      if (!res.ok) throw new Error("Failed");
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      toast.success("Primary image updated");
    } catch {
      toast.error("Failed to set primary image");
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_id: imageId }),
      });
      if (!res.ok) throw new Error("Failed");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
    }
  }

  async function handleUpdateAlt(imageId: string) {
    const altText = altInputs[imageId];
    if (altText === undefined) return;
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_alt", image_id: imageId, alt_text: altText }),
      });
      if (!res.ok) throw new Error("Failed");
      setImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, alt_text: altText } : img))
      );
      toast.success("Alt text saved");
    } catch {
      toast.error("Failed to update alt text");
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        className="rounded-xl border-2 border-dashed p-8 text-center hover:border-foreground/40 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload images</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP — max 5 MB each. Multiple files allowed.
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-lg overflow-hidden border">
              <div className="aspect-square relative">
                <Image
                  src={img.url}
                  alt={img.alt_text ?? "Product image"}
                  fill
                  className="object-cover"
                />
                {img.is_primary && (
                  <div className="absolute top-1 left-1">
                    <Badge variant="default" className="text-xs px-1.5 py-0.5 gap-1">
                      <Star className="h-2.5 w-2.5" /> Primary
                    </Badge>
                  </div>
                )}
              </div>

              <div className="p-2 space-y-2">
                <div className="flex items-center gap-1">
                  <Input
                    value={altInputs[img.id] ?? img.alt_text ?? ""}
                    onChange={(e) =>
                      setAltInputs((prev) => ({ ...prev, [img.id]: e.target.value }))
                    }
                    placeholder="Alt text"
                    className="h-7 text-xs flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleUpdateAlt(img.id)}
                  >
                    <span className="text-xs">✓</span>
                  </Button>
                </div>

                <div className="flex gap-1">
                  {!img.is_primary && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs gap-1"
                      onClick={() => handleSetPrimary(img.id)}
                    >
                      <Star className="h-3 w-3" /> Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No images yet. Upload some above.
        </p>
      )}
    </div>
  );
}
