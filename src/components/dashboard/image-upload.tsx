"use client";

import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { compressImage, uploadImage } from "@/lib/image";
import { cn } from "@/lib/utils";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: "avatars" | "covers" | "projects";
  shape?: "circle" | "wide";
  label: string;
  hint?: string;
}

const PRESETS = {
  avatars: { maxSize: 512, type: "image/jpeg", square: true }, // JPEG → embeddable in vCards
  covers: { maxSize: 1600, type: "image/webp", square: false },
  projects: { maxSize: 1200, type: "image/webp", square: false },
} as const;

/** Click-or-drop image picker with client-side compression and upload. */
export function ImageUpload({ value, onChange, folder, shape = "wide", label, hint }: Props) {

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressImage(file, PRESETS[folder]);
      const url = await uploadImage(blob, folder);
      onChange(url);
      toast.success("Image ready", { description: "Remember to save your changes." });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handle(e.dataTransfer.files?.[0]);
    },
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="sr-only"
      onChange={(e) => handle(e.target.files?.[0])}
      aria-label={label}
    />
  );

  if (shape === "circle") {
    return (
      <div className="flex items-center gap-5">
        <button
          type="button"
          {...dropProps}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-zinc-50 transition",
            dragging ? "border-brand bg-indigo-50" : "border-zinc-300 hover:border-zinc-400",
            value && "border-solid border-white shadow-md ring-1 ring-zinc-200",
          )}
          aria-label={value ? "Change photo" : "Upload photo"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value} alt="" className="size-full object-cover" />}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-zinc-500",
              value && "bg-black/40 text-white opacity-0 transition group-hover:opacity-100",
            )}
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          </span>
        </button>
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900">{label}</p>
          <p className="text-xs text-zinc-500">{hint ?? "Drag & drop or click. Square images work best."}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium shadow-xs hover:bg-zinc-50"
            >
              {value ? "Replace" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {input}
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-zinc-800">{label}</p>
      <div
        {...dropProps}
        className={cn(
          "relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition",
          dragging ? "border-brand bg-indigo-50" : "border-zinc-300 bg-zinc-50",
          value && "border-solid border-zinc-200",
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:bg-white"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur hover:bg-white"
                aria-label="Remove image"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 className="size-6 animate-spin text-zinc-700" />
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-700"
          >
            {busy ? <Loader2 className="size-6 animate-spin" /> : <UploadCloud className="size-7" />}
            <span className="text-sm font-medium">Drop an image or click to upload</span>
            <span className="text-xs text-zinc-400">{hint ?? "JPG, PNG, WebP or GIF up to 8 MB"}</span>
          </button>
        )}
      </div>
      {input}
    </div>
  );
}
