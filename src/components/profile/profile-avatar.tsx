import { avatarRadius } from "@/lib/theme";
import type { Theme } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

interface Props {
  name: string;
  src: string | null;
  theme: Pick<Theme, "avatar_shape" | "radius">;
  size?: number;
  className?: string;
}

export function ProfileAvatar({ name, src, theme, size = 112, className }: Props) {
  const radius = avatarRadius(theme.avatar_shape, theme.radius);
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden ring-4 ring-[var(--p-card-bg,var(--p-bg))]", className)}
      style={{ width: size, height: size, borderRadius: radius, background: "var(--p-surface)" }}
    >
      {src ? (
        // Plain <img>: images are served from Google Drive (lh3.googleusercontent.com).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} width={size} height={size} className="size-full object-cover" fetchPriority="high" />
      ) : (
        <div
          className="flex size-full items-center justify-center font-heading font-semibold text-[var(--p-primary-text)]"
          style={{
            background: "linear-gradient(135deg, var(--p-primary), var(--p-secondary))",
            fontSize: size * 0.36,
          }}
          aria-label={name}
          role="img"
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}
