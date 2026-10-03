"use client";

import { X } from "lucide-react";
import { useState } from "react";

/** Small chip input for string arrays (e.g. project technologies). */
export function TagInput({
  value,
  onChange,
  placeholder,
  id,
  max = 20,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  id?: string;
  max?: number;
}) {
  const [text, setText] = useState("");

  const commit = () => {
    const parts = text.split(",").map((t) => t.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.length < max) next.push(p.slice(0, 40));
    onChange(next);
    setText("");
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-xs focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pl-2 pr-1 text-xs font-medium text-zinc-700">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} aria-label={`Remove ${t}`} className="rounded p-0.5 hover:bg-zinc-200">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length ? "" : placeholder}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400"
      />
    </div>
  );
}
