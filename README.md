# TapCard — NFC Digital Business Card + Portfolio

Tap an NFC card (or scan the QR code), and a fast, themed profile opens. From there visitors can call, message or email, **Save Contact** as a vCard, browse the portfolio, follow socials, and share.

Owners manage everything from a dashboard with a live preview, theme customizer, QR tools and analytics.

**All data lives in a Google Sheet you own**, through a Google Apps Script Web App ([`apps-script/`](apps-script/)). There's no other database or auth service. Images go to Google Drive.

**Stack:** Next.js 16 (App Router, Server Components, Server Actions, ISR) · TypeScript · Tailwind CSS v4 · Google Apps Script + Google Sheets/Drive · zod · TipTap · dnd-kit · Recharts.

---

## Setup (about 5 minutes)

```bash
npm install
npm run dev
```

Open **http://localhost:3000/setup**. It's an in-app, step-by-step guide with live status checks. Here's the short version:

1. Create a Google Sheet ([sheets.new](https://sheets.new)), then go to **Extensions → Apps Script**.
2. Paste [`apps-script/dist/Code.gs`](apps-script/dist/Code.gs). The setup page has **Copy code** and **Download** buttons.
3. Run **`setupDatabase()`** and authorize. This creates all 15 tabs with headers, formatting and validation.
4. **Deploy → New deployment → Web app**, with *Execute as: Me* and *Who has access: Anyone*. Copy the `/exec` URL.
5. Run **`showApiKey()`** and copy the key.
6. Create `.env.local` (see [`.env.example`](.env.example)) and restart:
   ```env
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   GOOGLE_APPS_SCRIPT_API_KEY=nfc_...
   SESSION_SECRET=<openssl rand -base64 48>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
7. Go to **/register**, create your account, then open **Dashboard → Google Sheet** and paste your spreadsheet link.

The full backend docs (every action, the field-to-column map, security, quotas) are in [apps-script/README.md](apps-script/README.md).

### Dashboard → Google Sheet

This dashboard page:
- stores the link of the spreadsheet holding your data (`13_Settings.google_sheet_url`), with an **Open Google Sheet** button there and in the sidebar;
- detects the spreadsheet your Apps Script is actually connected to, and warns if the pasted link points to a different one;
- shows connection status (tabs, timezone, API version);
- includes the same step-by-step instructions for running the Apps Script, with copy/download buttons for the code.

This page is admin-only.

## Multiple users

Each person gets their **own account, card (`/p/username`) and dashboard**, and can only see and edit their own data. Every write is checked against their `user_id`, both in Next.js and in Apps Script.

- **The first account becomes the admin.** Admins see two extra dashboard pages:
  - **Users:** add people by email invite (they set their own password; link valid 3 days) or with a temporary password. You can also open anyone's card, send a password reset, suspend/reactivate (suspending signs them out instantly), make or remove admins, and delete accounts.
  - **Google Sheet:** the database link and setup instructions.
- There is always at least one active admin: you can't demote, suspend or delete the last one, or yourself. If you ever get locked out, run `makeAdmin('you@example.com')` in the Apps Script editor.
- `ALLOW_REGISTRATION=false` makes sign-up invite-only (admins add users). The first account can still register.

## Accounts & security

- **Sign-up / sign-in / sign-out / password reset / password and email change** are built into the app.
- **Passwords are never stored.** The server hashes them with scrypt (per-user salt) and only the hash goes into `01_Users.password_hash`. That column is hidden in the sheet and never returned by the API, except to the sign-in lookup.
- **Sessions** are HTTP-only cookies signed with `SESSION_SECRET` (HMAC-SHA256, 30 days). Every request re-checks the account status and `session_version` in `01_Users`, so changing or resetting a password signs out every other device.
- **Password reset** emails are sent by Apps Script (`MailApp`) from the Google account that deployed the script. Only a SHA-256 of the one-time, 1-hour token is stored.
- The API key, Web App URL and session secret are **server-only** env vars. The browser only talks to Next.js; Next.js talks to Apps Script. Login, sign-up and reset requests are rate-limited.

## Architecture

```
src/
  app/
    p/[username]/          Public card (ISR) + opengraph-image + per-profile manifest
    dashboard/             Owner dashboard (one route per section, incl. database/ = Google Sheet page)
    dashboard/actions.ts   Server Actions: section saves, uploads, sheet link, account
    (auth)/                login · register · forgot-password · reset-password + actions.ts
    setup/                 Public setup guide with live status
    api/vcard/[username]/  vCard 3.0 download (embeds photo when available)
    api/track/             Analytics ingest (validated, bot-filtered, rate-limited)
    api/apps-script/code/  Serves apps-script/dist/Code.gs for the guide's copy/download buttons
  components/
    profile/               ProfileView, ProfileHeader, ContactButtons, SocialLinks, sections, SaveContactButton, ShareProfileButton…
    dashboard/             Shell, Sidebar, LivePreview, editors, ThemeCustomizer, QRCode, AnalyticsDashboard, SheetLinkCard…
    setup/                 AppsScriptGuide, StatusList, CopyButton
    ui/                    Button, Field/Input/Select/Switch, Card, ConfirmDialog
  lib/
    auth/                  password.ts (scrypt) · session-token.ts / session.ts (signed cookies) · rate-limit.ts
    sheets/                client.ts (fetch + envelope) · api.ts (typed actions) · mappers.ts (field ⇄ column) · types.ts · status.ts
    data/                  index.ts (single data API) → sheets-store.ts
  proxy.ts                 Optimistic /dashboard guard from the signed cookie
apps-script/               The Google Apps Script backend (+ dist/Code.gs bundle, local mock & tests in tools/)
```

- **Same component for preview and public page.** `ProfileView` uses container queries, so it renders correctly full-screen and inside the dashboard's phone frame.
- **Fast public pages.** Profiles are cached (ISR + Apps Script `CacheService`) and expired instantly on save via `updateTag`. Analytics writes run after the response with `after()`.

## Scripts

| Command | |
|---|---|
| `npm run dev` / `npm run build && npm start` | Run the app |
| `npm run lint` | ESLint |
| `npm run sheets:bundle` | Rebuild `apps-script/dist/Code.gs` from the source files |
| `npm run sheets:test` | Run `setupDatabase()` + `selfTest()` locally against an in-memory Sheets mock |
| `npm run sheets:mock` | Serve the real Apps Script code on http://localhost:4000 (in-memory). Point `GOOGLE_APPS_SCRIPT_URL` at it to develop without Google; reset emails appear at `/__mail` |

## Deploying

On Vercel or any Node host: set `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_API_KEY`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL`, then deploy. After changing the Apps Script code, publish a **new deployment version** (Deploy → Manage deployments → Edit → New version), or the old code keeps running.
