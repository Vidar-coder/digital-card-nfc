import { Download, ExternalLink, FileSpreadsheet } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

/**
 * Step-by-step instructions for running the Google Apps Script backend.
 * Used on the public /setup page and on the dashboard's "Google Sheet" page.
 */

const CODE_URL = "/api/apps-script/code";

function Step({ n, title, children, done }: { n: number; title: string; children: ReactNode; done?: boolean }) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-white",
          done ? "bg-emerald-500 text-white" : "bg-zinc-900 text-white",
        )}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <h3 className="font-semibold text-zinc-900">{title}</h3>
        <div className="mt-1.5 space-y-3 text-sm leading-relaxed text-zinc-600">{children}</div>
      </div>
    </li>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 pr-24 text-[13px] leading-relaxed text-zinc-100">
        <code>{children}</code>
      </pre>
      <CopyButton text={children} className="absolute right-2 top-2 h-7 border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-100 hover:bg-zinc-700" />
    </div>
  );
}

const Kbd = ({ children }: { children: ReactNode }) => (
  <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800">{children}</span>
);

const LinkOut = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
    {children} <ExternalLink className="size-3" aria-hidden />
  </a>
);

export function AppsScriptGuide({ siteUrl, connected = false }: { siteUrl: string; connected?: boolean }) {
  const env = `GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID/exec
GOOGLE_APPS_SCRIPT_API_KEY=PASTE_THE_KEY_FROM_showApiKey
SESSION_SECRET=PASTE_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
NEXT_PUBLIC_SITE_URL=${siteUrl}`;

  return (
    <ol className="relative before:absolute before:left-4 before:top-2 before:h-[calc(100%-2rem)] before:w-px before:bg-zinc-200">
      <Step n={1} title="Create the Google Sheet (your database)" done={connected}>
        <p>Create an empty spreadsheet and give it a name, e.g. <strong>NFC Card Database</strong>. Every dashboard field is saved here.</p>
        <a
          href="https://sheets.new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          <FileSpreadsheet className="size-4" /> Create a new Google Sheet
        </a>
      </Step>

      <Step n={2} title="Open Apps Script" done={connected}>
        <p>
          In the spreadsheet menu choose <Kbd>Extensions</Kbd> → <Kbd>Apps Script</Kbd>. A code editor opens with a file called <Kbd>Code.gs</Kbd>.
        </p>
      </Step>

      <Step n={3} title="Paste the backend code" done={connected}>
        <p>Delete everything in <Kbd>Code.gs</Kbd>, paste the code below, then press <Kbd>Ctrl/⌘ + S</Kbd> to save.</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton fetchUrl={CODE_URL} label="Copy Apps Script code" />
          <a
            href={`${CODE_URL}?download=1`}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-xs hover:bg-zinc-50"
          >
            <Download className="size-4" /> Download Code.gs
          </a>
          <LinkOut href={CODE_URL}>View code</LinkOut>
        </div>
      </Step>

      <Step n={4} title="Run setupDatabase() and authorize" done={connected}>
        <p>
          In the toolbar pick <Kbd>setupDatabase</Kbd> from the function dropdown and click <Kbd>▶ Run</Kbd>. Google asks for permission the first
          time: choose your account → <Kbd>Advanced</Kbd> → <Kbd>Go to … (unsafe)</Kbd> → <Kbd>Allow</Kbd>. (This warning is normal for your own scripts.)
        </p>
        <p>
          It creates all tabs automatically (<Kbd>01_Users</Kbd> … <Kbd>15_Certifications</Kbd>) with headers, formatting and validation. Running it again is
          safe — it never duplicates sheets or touches your data.
        </p>
      </Step>

      <Step n={5} title="Deploy as a Web App" done={connected}>
        <p>
          Click <Kbd>Deploy</Kbd> → <Kbd>New deployment</Kbd> → ⚙ <Kbd>Web app</Kbd> and use these settings:
        </p>
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-100">
              <tr>
                <td className="bg-zinc-50 px-3 py-2 font-medium text-zinc-700">Execute as</td>
                <td className="px-3 py-2">
                  <strong>Me</strong> <span className="text-zinc-500">(your Google account owns the data)</span>
                </td>
              </tr>
              <tr>
                <td className="bg-zinc-50 px-3 py-2 font-medium text-zinc-700">Who has access</td>
                <td className="px-3 py-2">
                  <strong>Anyone</strong> <span className="text-zinc-500">(still protected by the API key)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Click <Kbd>Deploy</Kbd> and copy the <strong>Web app URL</strong> (it ends in <Kbd>/exec</Kbd>).
        </p>
      </Step>

      <Step n={6} title="Get your API key" done={connected}>
        <p>
          Back in the editor, select <Kbd>showApiKey</Kbd> in the function dropdown and click <Kbd>▶ Run</Kbd>. Copy the key from the <Kbd>Execution log</Kbd>.
        </p>
      </Step>

      <Step n={7} title="Connect this website" done={connected}>
        <p>
          Add these lines to <Kbd>.env.local</Kbd> in the project folder (or your hosting provider&apos;s Environment Variables), then restart the
          site. Generate the session secret with <Kbd>openssl rand -base64 48</Kbd>.
        </p>
        <Code>{env}</Code>
        <p className="text-xs text-zinc-500">
          These are server-only secrets — never put them in a <Kbd>NEXT_PUBLIC_</Kbd> variable or share them.
        </p>
      </Step>

      <Step n={8} title="Paste your Google Sheet link in the dashboard">
        <p>
          Sign in, open <Kbd>Dashboard</Kbd> → <Kbd>Google Sheet</Kbd> and paste the spreadsheet&apos;s link (the address in your browser, starting with{" "}
          <Kbd>https://docs.google.com/spreadsheets/d/</Kbd>) so you can jump to your data in one click.
        </p>
      </Step>

      <Step n={9} title="Optional: verify everything">
        <p>
          In Apps Script, run <Kbd>selfTest</Kbd>. It checks every feature with a temporary user and cleans up after itself; the log should show only ✅.
        </p>
        <p>
          <strong>After changing the script later:</strong> <Kbd>Deploy</Kbd> → <Kbd>Manage deployments</Kbd> → ✏️ → <Kbd>Version: New version</Kbd> →{" "}
          <Kbd>Deploy</Kbd>. The URL stays the same.
        </p>
      </Step>
    </ol>
  );
}
