"use client";

import { Check, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { saveThemeAction } from "@/app/dashboard/actions";
import { Card, CardHeader } from "@/components/ui/card";
import { FONT_OPTIONS, isHexColor, THEME_PRESETS } from "@/lib/theme";
import type { AvatarShape, CardStyle, Theme, ThemePresetId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDashboard, useSectionSave } from "./dashboard-context";
import { SaveBar } from "./save-bar";

const COLOR_FIELDS: { key: keyof Pick<Theme, "primary" | "secondary" | "accent" | "background" | "text" | "button">; label: string; hint: string }[] = [
  { key: "primary", label: "Primary", hint: "Headings accents, icons" },
  { key: "secondary", label: "Secondary", hint: "Gradients" },
  { key: "accent", label: "Accent", hint: "Highlights" },
  { key: "button", label: "Button", hint: "Save Contact & CTAs" },
  { key: "background", label: "Background", hint: "Page" },
  { key: "text", label: "Text", hint: "Body copy" },
];

const CARD_STYLES: { id: CardStyle; label: string }[] = [
  { id: "elevated", label: "Elevated" },
  { id: "outlined", label: "Outlined" },
  { id: "flat", label: "Flat" },
  { id: "glass", label: "Glass" },
];

const AVATAR_SHAPES: { id: AvatarShape; label: string; radius: string }[] = [
  { id: "circle", label: "Circle", radius: "9999px" },
  { id: "rounded", label: "Rounded", radius: "30%" },
  { id: "square", label: "Square", radius: "4px" },
];

/** Free-typing hex field: local text state, commits only valid colors. */
function HexInput({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : value;
  return (
    <input
      value={shown}
      onFocus={() => {
        setText(value);
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        let v = e.target.value.trim();
        if (v && !v.startsWith("#")) v = `#${v}`;
        setText(v);
        if (isHexColor(v)) onCommit(v.toLowerCase());
      }}
      aria-invalid={focused && !isHexColor(text) ? true : undefined}
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
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-xl bg-zinc-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
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

export function ThemeCustomizer() {
  const { draft, setField } = useDashboard();
  const theme = draft.theme;
  const { save, saving, dirty, discard } = useSectionSave(["theme"], (v) => saveThemeAction(v.theme));

  const set = (patch: Partial<Theme>, keepPreset = false) =>
    setField("theme", { ...theme, ...patch, preset: keepPreset ? theme.preset : "custom" });

  const applyPreset = (id: ThemePresetId) => setField("theme", { ...THEME_PRESETS[id].theme });

  const toggleMode = (mode: Theme["mode"]) => {
    if (mode === theme.mode) return;
    // Swap surfaces for a sensible starting point; colors remain editable.
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
        <CardHeader title="Themes" description="Start from a professionally tuned preset, then make it yours." />
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
          {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => {
            const p = THEME_PRESETS[id];
            const active = theme.preset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
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
          })}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Colors"
          description={theme.preset === "custom" ? "Custom theme" : `Based on ${THEME_PRESETS[theme.preset].label}`}
          action={
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
          }
        />
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {COLOR_FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5">
              <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-zinc-900/10" style={{ background: theme[key] }}>
                <input
                  type="color"
                  value={theme[key].length === 4 ? `#${[...theme[key].slice(1)].map((c) => c + c).join("")}` : theme[key]}
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
        <CardHeader title="Style" description="Typography, shapes and surfaces." />
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
            <Segmented label="Card style" value={theme.card_style} options={CARD_STYLES} onChange={(v) => set({ card_style: v })} />
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
