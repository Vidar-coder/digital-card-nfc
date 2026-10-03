import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Serves the bundled Apps Script (apps-script/dist/Code.gs) for the setup guide's
 * "Copy code" / "Download Code.gs" buttons. It contains no secrets — the API key
 * is generated inside your own Apps Script project by setupDatabase().
 */
export async function GET(request: NextRequest) {
  try {
    const code = await readFile(path.join(process.cwd(), "apps-script", "dist", "Code.gs"), "utf8");
    const download = request.nextUrl.searchParams.has("download");
    return new NextResponse(code, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="Code.gs"`,
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Code.gs not found. Run `npm run sheets:bundle` to generate apps-script/dist/Code.gs." },
      { status: 404 },
    );
  }
}
