"use client";

import type { AnchorHTMLAttributes } from "react";
import { track } from "@/lib/track";
import type { AnalyticsEventType } from "@/lib/types";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  username: string;
  event: AnalyticsEventType;
  meta?: Record<string, string>;
  /** Dashboard preview: links are inert and nothing is tracked. */
  preview?: boolean;
}

export function TrackedLink({ username, event, meta, preview, onClick, ...rest }: Props) {
  const external = typeof rest.href === "string" && /^https?:/i.test(rest.href);
  return (
    <a
      {...rest}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={(e) => {
        if (preview) {
          e.preventDefault();
          return;
        }
        track(username, event, meta);
        onClick?.(e);
      }}
    />
  );
}
