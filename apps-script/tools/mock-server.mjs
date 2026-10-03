/**
 * Serves the real Apps Script code over HTTP on top of the in-memory mock, so
 * the Next.js app can be developed/tested without deploying to Google:
 *
 *   node apps-script/tools/mock-server.mjs            # http://localhost:4000
 *   GOOGLE_APPS_SCRIPT_URL=http://localhost:4000
 *   GOOGLE_APPS_SCRIPT_API_KEY=<printed on start>
 *
 * Data lives in memory and is lost on restart. Emails (password resets) are
 * printed to the console and listed at GET /__mail. Not for production.
 */
import { createServer } from "node:http";
import { createAppsScriptContext } from "./mock-env.mjs";

const PORT = Number(process.env.PORT ?? 4000);
const { context, props, mail, run } = createAppsScriptContext();
run("setupDatabase()");
const key = process.env.MOCK_API_KEY ?? props.get("API_KEY");
props.set("API_KEY", key);

createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (url.pathname === "/__mail") {
      // Dev only: emails "sent" by MailApp (e.g. password-reset links).
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(mail.map(({ to, subject, body }) => ({ to, subject, body }))));
    }
    const e = { parameter: Object.fromEntries(url.searchParams), postData: body ? { contents: body } : undefined };
    let out;
    try {
      context.__e = e;
      out = run(`TABLE_MEMO_ = {}; (${req.method === "POST" ? "doPost" : "doGet"})(__e)`).getContent();
    } catch (err) {
      out = JSON.stringify({ success: false, message: String(err), data: null, error: { code: "INTERNAL_ERROR", details: null } });
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(out);
  });
}).listen(PORT, () => {
  console.log(`Mock Apps Script API on http://localhost:${PORT}`);
  console.log(`GOOGLE_APPS_SCRIPT_API_KEY=${key}`);
});
