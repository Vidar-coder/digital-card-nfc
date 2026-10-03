import { after, NextResponse, type NextRequest } from "next/server";
import { profileUrl } from "@/lib/config";
import { getPublicProfile, trackEvent } from "@/lib/data";
import { requestContext } from "@/lib/request-context";
import { buildVCard, vcardFilename, type VCardPhoto } from "@/lib/vcard";

const MAX_PHOTO_BYTES = 350_000;

async function loadPhoto(src: string | null): Promise<VCardPhoto | null> {
  if (!src) return null;
  try {
    const dataUrl = /^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i.exec(src);
    if (dataUrl) {
      const type = dataUrl[1].toUpperCase().replace("JPG", "JPEG") as VCardPhoto["type"];
      return dataUrl[2].length * 0.75 <= MAX_PHOTO_BYTES ? { base64: dataUrl[2], type } : null;
    }
    if (!/^https:\/\//i.test(src)) return null;
    const res = await fetch(src, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_PHOTO_BYTES) return null;
    const ct = res.headers.get("content-type") ?? "";
    const type: VCardPhoto["type"] = ct.includes("png") ? "PNG" : ct.includes("gif") ? "GIF" : ct.includes("webp") ? "WEBP" : "JPEG";
    return { base64: buf.toString("base64"), type };
  } catch {
    return null; // photo is a nice-to-have; never fail the download for it
  }
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/vcard/[username]">) {
  const { username } = await ctx.params;
  const profile = await getPublicProfile(username);
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const photo = await loadPhoto(profile.avatar_url);
  const body = buildVCard(profile, profileUrl(profile.username), photo);

  if (!request.nextUrl.searchParams.has("preview")) {
    // Record after the response is sent so the contact file is never delayed by analytics.
    const ctx = requestContext(request);
    after(() => trackEvent(profile.username, "vcard_download", null, ctx).catch(() => {}));
  }

  return new NextResponse(body, {
    headers: {
      // "inline" lets iOS Safari open the native "Add to Contacts" sheet;
      // Android browsers download the file and offer to open it in Contacts.
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `inline; filename="${vcardFilename(profile)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
