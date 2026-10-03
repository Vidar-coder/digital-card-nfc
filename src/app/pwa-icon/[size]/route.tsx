import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";

const SIZES = new Set([180, 192, 512]);

export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size: raw } = await ctx.params;
  const size = SIZES.has(Number(raw)) ? Number(raw) : 192;
  return new ImageResponse(<BrandMark size={size} padded />, {
    width: size,
    height: size,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
