"use client";

import { Check, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { saveThemeAction } from "@/app/dashboard/actions";
import { Card, CardHeader } from "@/components/ui/card";
import {
  FONT_OPTIONS,
  isHexColor,
  normalizeHexColor,
  readableOn,
  THEME_PRESET_GROUPS,
  THEME_PRESETS,
} from "@/lib/theme";
import type { AvatarShape, CardStyle, Theme, ThemePresetId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDashboard, useSectionSave } from "./dashboard-context";
import { SaveBar } from "./save-bar";

const COLOR_KEYS = ["primary", "secondary", "accent", "button", "background", "text"] as const;

const COLOR_FIELDS: { key: (typeof COLOR_KEYS)[number]; label: string; hint: string }[] = [
  { key: "primary", label: "Primary", hint: "Headings, accents, icons" },
  { key: "secondary", label: "Secondary", hint: "Gradients & links" },
  { key: "accent", label: "Accent", hint: "Highlights" },
  { key: "button", label: "Button", hint: "Save Contact & CTAs" },
  { key: "background", label: "Background", hint: "Page" },
  { key: "text", label: "Text", hint: "Body copy" },
];

const CARD_STYLES: { id: CardStyle; label: string; description: string }[] = [
  { id: "elevated", label: "Elevated", description: "Soft shadow cards" },
  { id: "outlined", label: "Outlined", description: "Border-only surfaces" },
  { id: "flat", label: "Flat", description: "Minimal, no shadow" },
  { id: "glass", label: "Glass", description: "Frosted blur panels" },
];

const AVATAR_SHAPES: { id: AvatarShape; label: string; radius: string }[] = [
  { id: "circle", label: "Circle", radius: "9999px" },
  { id: "rounded", label: "Rounded", radius: "30%" },
  { id: "square", label: "Square", radius: "4px" },
];

function colorPickerValue(hex: string): string {
  if (hex.length === 4) {
    return `#${[...hex.slice(1)].map((c) => c + c).join("")}`;
  }
  return hex;
}

function normalizeThemePatch(patch: Partial<Theme>): Partial<Theme> {
  const out = { ...patch };
  for (const key of COLOR_KEYS) {
    const v = out[key];
    if (typeof v === "string" && isHexColor(v)) out[key] = normalizeHexColor(v);
  }
  return out;
}

/** Free-typing hex field: local text state, commits only valid colors. */
function HexInput({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
  /** While focused, holds in-progress text; `null` means show `value` from props. */
  const [edit, setEdit] = useState<string | null>(null);
  const shown = edit ?? value;
  return (
    <input
      value={shown}
      onFocus={() => setEdit(value)}
      onBlur={() => setEdit(null)}
      onChange={(e) => {
        let v = e.target.value.trim();
        if (v && !v.startsWith("#")) v = `#${v}`;
        setEdit(v);
        if (isHexColor(v)) onCommit(normalizeHexColor(v));
      }}
      aria-invalid={edit !== null && !isHexColor(edit) ? true : undefined}
      className="h-8 w-[84px] rounded-md border border-zinc-200 px-2 font-mono text-xs uppercase text-zinc-700 focus:border-brand focus:outline-none aria-[invalid=true]:border-red-400"
      aria-label={label}
      maxLength={7}
      spellCheck={false}
    />
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-zinc-100 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-zinc-600 transition",
            value === o.id ? "bg-white text-zinc-900 shadow-xs" : "hover:text-zinc-900",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PresetTile({ id, active, onSelect }: { id: ThemePresetId; active: boolean; onSelect: () => void }) {
  const p = THEME_PRESETS[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group overflow-hidden rounded-xl border text-left transition hover:shadow-md",
        active ? "border-brand ring-2 ring-brand/25" : "border-zinc-200",
      )}
    >
      <div className="relative h-20 p-3" style={{ background: p.theme.background }}>
        <div
          className="h-6 w-full rounded-md"
          style={{ background: `linear-gradient(135deg, ${p.theme.primary}, ${p.theme.secondary})` }}
        />
        <div className="mt-2 flex gap-1.5">
          <span className="h-5 flex-1 rounded" style={{ background: p.theme.button }} />
          <span className="h-5 w-5 rounded" style={{ background: `${p.theme.text}22` }} />
          <span className="h-5 w-5 rounded" style={{ background: `${p.theme.text}22` }} />
        </div>
        {active && (
          <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-brand text-white shadow">
            <Check className="size-3" />
          </span>
        )}
      </div>
      <div className="border-t border-zinc-100 bg-white px-3 py-2">
        <p className="text-sm font-medium text-zinc-900">{p.label}</p>
        <p className="truncate text-xs text-zinc-500">{p.description}</p>
      </div>
    </button>
  );
}

function presetDescription(theme: Theme): string {
  if (theme.preset === "custom") return "Custom colors — tweak any field below";
  return `Based on ${THEME_PRESETS[theme.preset].label}`;
}

export function ThemeCustomizer() {
  const { draft, setField } = useDashboard();
  const theme = draft.theme;
  const { save, saving, dirty, discard } = useSectionSave(["theme"], (v) => saveThemeAction(v.theme));

  const set = (patch: Partial<Theme>, keepPreset = false) =>
    setField("theme", {
      ...theme,
      ...normalizeThemePatch(patch),
      preset: keepPreset ? theme.preset : "custom",
    });

  const applyPreset = (id: ThemePresetId) => setField("theme", { ...THEME_PRESETS[id].theme });

  const groupedIds = useMemo(() => new Set(THEME_PRESET_GROUPS.flatMap((g) => g.ids)), []);

  const ungroupedPresets = (Object.keys(THEME_PRESETS) as ThemePresetId[]).filter((id) => !groupedIds.has(id));

  const toggleMode = (mode: Theme["mode"]) => {
    if (mode === theme.mode) return;
    const dark = mode === "dark";
    set({
      mode,
      background: dark ? "#0b0d12" : "#f7f7f9",
      text: dark ? "#e8eaef" : "#111127",
      card_style: dark && theme.card_style === "elevated" ? "outlined" : theme.card_style,
    });
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Themes"
          description="Professional presets for finance, creative, and luxury brands. Pick one, then customize colors and style."
        />
        <div className="space-y-6 p-5 pt-0">
          {THEME_PRESET_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{group.label}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.ids.map((id) => (
                  <PresetTile key={id} id={id} active={theme.preset === id} onSelect={() => applyPreset(id)} />
                ))}
              </div>
            </div>
          ))}
          {ungroupedPresets.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">More</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ungroupedPresets.map((id) => (
                  <PresetTile key={id} id={id} active={theme.preset === id} onSelect={() => applyPreset(id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Colors"
          description={presetDescription(theme)}
          action={
            theme.preset === "custom" ? (
              <button
                type="button"
                onClick={() => applyPreset("glass")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                <RotateCcw className="size-3.5" />
                Reset to Glass
              </button>
            ) : undefined
          }
        />
        <div className="border-b border-zinc-100 px-5 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-44">
              <Segmented
                label="Color mode"
                value={theme.mode}
                onChange={toggleMode}
                options={[
                  { id: "light", label: "Light", icon: <Sun className="size-3.5" /> },
                  { id: "dark", label: "Dark", icon: <Moon className="size-3.5" /> },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"
                style={{ background: theme.button, color: readableOn(theme.button) }}
              >
                Save Contact
              </span>
              <button
                type="button"
                onClick={() => set({ button: theme.primary })}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                <Palette className="size-3.5" />
                Match button to primary
              </button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5">
              <label
                className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-zinc-900/10"
                style={{ background: theme[key] }}
              >
                <input
                  type="color"
                  value={colorPickerValue(theme[key])}
                  onChange={(e) => set({ [key]: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`${label} color`}
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{label}</p>
                <p className="text-xs text-zinc-500">{hint}</p>
              </div>
              <HexInput value={theme[key]} onCommit={(v) => set({ [key]: v })} label={`${label} hex value`} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Style" description="Typography, card surfaces, and profile photo shape." />
        <div className="space-y-6 p-5">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">Font</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => set({ font: f.id })}
                  aria-pressed={theme.font === f.id}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition",
                    theme.font === f.id ? "border-brand bg-indigo-50/60 ring-2 ring-brand/20" : "border-zinc-200 hover:border-zinc-300",
                  )}
                >
                  <span className="block text-lg leading-tight text-zinc-900" style={{ fontFamily: f.cssVar }}>
                    Aa Bb
                  </span>
                  <span className="text-xs text-zinc-500">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">Card style</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CARD_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => set({ card_style: s.id })}
                  aria-pressed={theme.card_style === s.id}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition",
                    theme.card_style === s.id ? "border-brand bg-indigo-50/60 ring-2 ring-brand/20" : "border-zinc-200 hover:border-zinc-300",
                  )}
                >
                  <span className="block text-sm font-medium text-zinc-900">{s.label}</span>
                  <span className="text-xs text-zinc-500">{s.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-800">Profile image shape</p>
            <div className="flex gap-3">
              {AVATAR_SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => set({ avatar_shape: s.id })}
                  aria-pressed={theme.avatar_shape === s.id}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-2 rounded-xl border py-3 transition",
                    theme.avatar_shape === s.id ? "border-brand bg-indigo-50/60 ring-2 ring-brand/20" : "border-zinc-200 hover:border-zinc-300",
                  )}
                >
                  <span className="size-10 bg-gradient-to-br from-zinc-300 to-zinc-400" style={{ borderRadius: s.radius }} />
                  <span className="text-xs font-medium text-zinc-700">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="radius" className="text-sm font-medium text-zinc-800">
                Corner radius
              </label>
              <span className="text-xs tabular-nums text-zinc-500">{theme.radius}px</span>
            </div>
            <input
              id="radius"
              type="range"
              min={0}
              max={28}
              step={1}
              value={theme.radius}
              onChange={(e) => set({ radius: Number(e.target.value) })}
              className="w-full accent-brand"
            />
            <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
              <span>Sharp</span>
              <span>Soft</span>
            </div>
          </div>
        </div>
      </Card>

      <SaveBar dirty={dirty} saving={saving} onSave={() => void save()} onDiscard={discard} label="Publish design" />
    </div>
  );
}
