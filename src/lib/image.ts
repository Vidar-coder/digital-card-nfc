"use client";

import { uploadImageAction } from "@/app/dashboard/actions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Downscale + re-encode in the browser before upload: keeps profile pages fast
 * on mobile data and strips EXIF (incl. GPS) from photos.
 */
export async function compressImage(
  file: File,
  { maxSize, type = "image/webp", quality = 0.85, square = false }: { maxSize: number; type?: string; quality?: number; square?: boolean },
): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Please choose a JPG, PNG, WebP or GIF image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 8 MB.");

  const bitmap = await createImageBitmap(file);
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = sh = side;
  }
  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (type === "image/jpeg") {
    ctx.fillStyle = "#ffffff"; // JPEG has no alpha
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), type, quality),
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Stores an image in Google Drive (Server Action → Apps Script → Drive) and
 * returns its public URL, which is what gets saved in the sheet.
 */
export async function uploadImage(blob: Blob, folder: "avatars" | "covers" | "projects"): Promise<string> {
  const res = await uploadImageAction(await blobToDataUrl(blob), folder);
  if (!res.ok) throw new Error(res.error);
  return res.data!.url;
}
