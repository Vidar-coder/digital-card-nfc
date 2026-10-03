# Google Sheets backend (Google Apps Script)

This folder is a complete Apps Script project that turns one Google Spreadsheet into the database and JSON API for the NFC card app. Once it's deployed and the two environment variables are set, the Next.js app stores every dashboard field in Google Sheets. Images go to Google Drive.

```
Browser ──► Next.js (pages, Server Actions, /api routes) ──► Apps Script Web App ──► Google Sheets / Drive
            holds GOOGLE_APPS_SCRIPT_API_KEY (server only)    doPost(e) / doGet(e)
```

- [Install in 5 steps](#install)
- [Connect Next.js](#connect-nextjs)
- [Sheets & field mapping](#sheets--field-mapping)
- [API reference](#api-reference)
- [Security, CORS & limits](#security-cors--limits)
- [Testing](#testing)

---

## Files

| File | Purpose |
|---|---|
| `Config.gs` | **Single source of truth**: sheet names, columns, types, validation rules, ID prefixes |
| `Setup.gs` | `setupDatabase()` creates and formats everything; also `showApiKey()`, `rotateApiKey()`, `setSiteUrl()`, `setLogLevel()` |
| `Api.gs` | `doPost` / `doGet`, API-key auth, routing, rate limiting |
| `Database.gs` | Generic CRUD: `createRecord`, `getRecords`, `getRecordById`, `updateRecord`, `deleteRecord`, `getUserRecords`, `syncRecords` |
| `Validation.gs` | Schema-driven validation, sanitization, formula-injection protection |
| `Utils.gs` | Errors, response envelope, timezone, ID generation, locks, cache |
| `Users.gs` · `Profile.gs` | Accounts (no passwords), profiles, `getCompleteProfile`, username checks |
| `Sections.gs` | One factory that gives every list section create/get/update/delete/sync |
| `SocialLinks.gs` `Experience.gs` `Education.gs` `Skills.gs` `Services.gs` `Projects.gs` `ContactActions.gs` | Section registrations (a few lines each) |
| `Themes.gs` · `QrNfc.gs` · `Settings.gs` · `Analytics.gs` · `Media.gs` · `Logging.gs` | Their respective features |
| `Tests.gs` | `selfTest()`: an end-to-end check you can run in the editor |
| `appsscript.json` | Manifest (V8, web-app settings) |
| `dist/Code.gs` | **All of the above in one file**, for copy/paste installs (`npm run sheets:bundle`) |
| `tools/` | Local mock of Apps Script and a test runner (development only, not uploaded) |

> Apps Script loads every `.gs` file into one global scope, so splitting into files is purely organizational. The code never relies on load order: registries are built inside functions. That's why pasting the single `dist/Code.gs` works identically.

---

## Install

### 1. Create a spreadsheet
Go to [sheets.new](https://sheets.new) and give it a name, e.g. **NFC Card Database**. Optionally set **File → Settings → Time zone**; every timestamp uses the spreadsheet's timezone.

### 2. Open Apps Script
In the spreadsheet: **Extensions → Apps Script**. This creates a script *bound* to the spreadsheet.

### 3. Paste the code
- **Quickest:** replace the contents of `Code.gs` with [`dist/Code.gs`](dist/Code.gs).
- **Or** create one script file per `.gs` file here (same names) and paste each.
- **Or** use [clasp](https://github.com/google/clasp): `clasp create --type sheets --rootDir apps-script` then `clasp push`.

Optional: **Project Settings → Show "appsscript.json"** and paste [`appsscript.json`](appsscript.json).

### 4. Run `setupDatabase()`
Choose `setupDatabase` in the function dropdown, then click **Run**.

### 5. Authorize
Google asks for permission the first time:
- **See, edit, create and delete your spreadsheets** (the database)
- **See, edit, create and delete your Google Drive files** (image uploads to the `NFC Card Media` folder)
- **Send email as you** (password-reset emails via `MailApp`; consumer accounts can send about 100 per day)

"Google hasn't verified this app" is normal for your own scripts: click **Advanced → Go to … (unsafe)**.

When it finishes, the log shows a summary like:

```json
{
  "success": true,
  "sheetsCreated": ["01_Users", "02_Profiles", "…", "15_Certifications"],
  "columnsAdded": {},
  "apiKey": "CREATED — run showApiKey() to copy it",
  "timezone": "Asia/Manila"
}
```

`setupDatabase()` is **idempotent**. Run it again anytime, for example after updating the code to add columns. It never duplicates sheets or headers and never deletes or reorders your data; it only appends missing columns and reapplies formatting and validation.

### 6. Deploy as a Web App
**Deploy → New deployment → ⚙ Select type → Web app**

| Setting | Value | Why |
|---|---|---|
| Description | `v1` | |
| **Execute as** | **Me** | The script reads and writes *your* spreadsheet; callers never need Google accounts |
| **Who has access** | **Anyone** | Your Next.js server calls it without Google sign-in. Access is still protected by the API key |

Click **Deploy** and authorize again if asked.

### 7. Copy the Web App URL
It looks like `https://script.google.com/macros/s/AKfycb…/exec`. Use the **`/exec`** URL, not `/dev`.

Then run **`showApiKey()`** and copy the key from the log.

### 8. Connect Next.js
See below.

> **After changing the code**, a deployment keeps serving the old version. Go to **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**; the URL stays the same.

---

## Connect Next.js

Add these to `nfc-card/.env.local`:

```env
# Google Sheets backend (server-only; never prefix with NEXT_PUBLIC_)
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
GOOGLE_APPS_SCRIPT_API_KEY=nfc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Signs login session cookies (32+ random chars):  openssl rand -base64 48
SESSION_SECRET=...

# Public URL of your site (profile/QR/NFC links, vCards, reset emails)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

The app has an in-app version of this guide with live status checks at **`/setup`**, and again under **Dashboard → Google Sheet**. That page is also where you paste your spreadsheet link, which is saved to `13_Settings.google_sheet_url`.

Google Sheets is the app's only backend. The dashboard, public card, QR code, vCard, analytics and accounts all read and write through `src/lib/data` → Apps Script.

**Where the key lives:** only in server-side environment variables, i.e. `.env.local` locally, or *Project → Settings → Environment Variables* on Vercel. It is read in `src/lib/sheets/client.ts`, which imports `server-only`, so it can't end up in a browser bundle. Never put it in a `NEXT_PUBLIC_` variable.

**Authentication** is built in, and plain-text passwords never reach the sheet:
- **Sign-up:** Next.js hashes the password with scrypt (`src/lib/auth/password.ts`) and calls `registerUser` with the hash only.
- **Sign-in:** Next.js fetches the hash with `getAuthUser` (the only action that returns it), verifies it locally, and sets an HTTP-only cookie signed with `SESSION_SECRET`. The cookie holds `user_id` and `session_version`.
- **Every dashboard request:** `getSession` re-checks the account's status and `session_version`, so `changePassword` and `resetPassword` sign out all other devices.
- **Password reset:** Next.js creates a random token and sends only its SHA-256 to `requestPasswordReset`. Apps Script stores the hash and emails the link via `MailApp`. The token is single-use and expires in 1 hour.
- **Hidden columns:** `password_hash`, `reset_token_hash` and `reset_expires_at` are hidden in the sheet and stripped from every other response.

### Next.js code

| File | Role |
|---|---|
| `src/lib/sheets/types.ts` | TypeScript types for every row, payload and response |
| `src/lib/sheets/client.ts` | `apiRequest(action, data)`: fetch, timeouts, retries for reads, error envelope |
| `src/lib/sheets/api.ts` | Typed functions: `createProfile`, `updateProfile`, `getProfile`, `getCompleteProfile`, `createProject`, `updateTheme`, `recordAnalyticsEvent`, `sync.*`, … |
| `src/lib/sheets/mappers.ts` | Dashboard field ⇄ sheet column mapping, type-checked to cover every field |
| `src/lib/data/sheets-store.ts` | Plugs Sheets into the app's data layer |

```ts
import { apiRequest } from "@/lib/sheets/client";
import * as sheets from "@/lib/sheets/api";

// Raw envelope (never throws)
const res = await apiRequest("getProfile", { username: "lance" });
if (res.success) console.log(res.data);

// Typed helpers (throw AppsScriptError on failure)
const { user_id, profile_id } = await sheets.createProfile({
  email: "lance@example.com", username: "lance", full_name: "Lance Valle",
  professional_title: "Web Developer", site_url: "https://yourdomain.com",
});
await sheets.updateProfile(user_id, { company: "Northbridge Advisory", bio: "Hello!" }); // partial
const { profile } = await sheets.getProfile({ username: "lance" });
const all = await sheets.getCompleteProfile({ username: "lance" }, { public: true });
const { project_id } = await sheets.createProject(user_id, {
  project_title: "Access Review Toolkit", technologies: ["Python"], project_url: "https://example.com",
});
await sheets.updateTheme(user_id, { theme_name: "dark", primary_color: "#38bdf8" });
await sheets.recordAnalyticsEvent({ username: "lance", event_type: "profile_view", event_value: "nfc" });
```

### Dashboard save workflow

Each dashboard section saves on its own; nothing ever submits the whole profile.

```
Dashboard "Experience" → Save
  → Server Action saveListAction("experiences", items)        src/app/dashboard/actions.ts
      zod validation · owner check (getOwner)
  → replaceOwnerList(owner, "experiences", items)              src/lib/data/index.ts
  → sheetsStore.replaceList → mappers.listToSheet              field → column names
  → POST { action: "syncExperience", apiKey, data: { user_id, items } }
  → Apps Script: validate every row → update / create / delete under a lock
  ← { success: true, data: { items: [ { experience_id: "EXP-000012", … } ] } }
  ← dashboard adopts server IDs; public card cache expired (updateTag)
```

| Dashboard page | Server Action | Apps Script action(s) |
|---|---|---|
| Profile (photo, cover, name, title, company, intro, username, public toggle) | `saveBasicsAction` | `updateProfile` (+ `uploadImage`) |
| Contact info | `saveContactAction` | `updateProfile` → auto-syncs `09_Contact_Actions` |
| About | `saveAboutAction` | `updateProfile` (`about`) |
| Experience / Education / Certifications / Skills / Services / Portfolio / Social links | `saveListAction` | `syncExperience` / `syncEducation` / `syncCertifications` / `syncSkills` / `syncServices` / `syncProjects` / `syncSocialLinks` |
| Appearance | `saveThemeAction` | `updateTheme` |
| Analytics | (page load) | `getAnalytics` |
| Public card visits/clicks | `/api/track`, `/api/vcard` | `recordAnalyticsEvent` |
| Sign up / sign in / reset | `(auth)/actions.ts` | `registerUser` · `getAuthUser` + `recordLogin` · `requestPasswordReset` + `resetPassword` |
| Any dashboard load | layout | `getSession` (cached) |
| Google Sheet page | `saveSheetLinkAction` | `updateSetting` (`google_sheet_url`), `getSystemInfo` |
| Account | `updatePasswordAction` / `updateEmailAction` | `changePassword` / `updateUser` |

---

## Sheets & field mapping

`setupDatabase()` creates 15 tabs. Each one gets a bold dark header, frozen header row and ID column, a filter, alternating row colors, type-based number formats (plain text for phones/IDs so `0917…` and `+63…` survive), data validation (checkboxes, dropdowns, email/URL/date/number/hex-color/`YYYY-MM` rules), blue URL text, header notes and sensible widths.

**Every dashboard input has a column.** The mapping is enforced at compile time in `src/lib/sheets/mappers.ts`, using `satisfies Record<keyof …>`, so adding a dashboard field without a column fails `tsc`.

| Dashboard field | Sheet → column |
|---|---|
| Profile photo · Cover image | `02_Profiles` → `profile_photo` · `cover_photo` *(added; not in the original spec)* |
| Full name · Professional title · Company | `02_Profiles` → `full_name` · `professional_title` · `company` |
| Short introduction · About me | `02_Profiles` → `bio` · `about` |
| Username · Card is public | `02_Profiles` → `username` · `status` (`published`/`draft`), also `01_Users.username` |
| Phone · Email · Website · City/region · Address | `02_Profiles` → `phone` · `email` · `website` · `location` · `address` (+ derived `09_Contact_Actions`) |
| Experience: company, position, location, start, end, "currently work here", description | `04_Experience` → `company`, `position`, `location`, `start_date`, `end_date`, `is_current`, `description` |
| Education: school, degree, field, start/end year | `05_Education` → `school`, `degree`, `field_of_study`, `start_year`, `end_year` |
| Certifications: name, issuer, year, credential URL | `15_Certifications` → `certification_name`, `issuer`, `year`, `credential_url` *(added tab)* |
| Skills | `06_Skills` → `skill_name` (+ `proficiency`, editable in the sheet) |
| Services: name, description, icon | `07_Services` → `service_name`, `description`, `icon` |
| Portfolio: title, description, image, technologies, project URL, GitHub URL | `08_Projects` → `project_title`, `description`, `image_url`, `technologies`, `project_url`, `github_url` |
| Social links: platform, URL, label | `03_Social_Links` → `platform`, `url`, `display_name` |
| Theme preset, light/dark, 6 colors, font, card style, radius, image shape | `10_Themes` → `theme_name`, `mode`, `*_color`, `font_family`, `card_style`, `border_radius`, `profile_image_style` |
| Drag-to-reorder (all lists) | `display_order` |
| Profile / QR / NFC URLs | `11_QR_NFC` → `profile_url`, `qr_code_url` (`?src=qr`), `nfc_url` (`?src=nfc`) |

Columns the dashboard doesn't edit, such as `is_visible`, `is_featured`, `proficiency` and contact-action labels, can be edited directly in the sheet. Dashboard saves preserve them, and the public card hides rows with `is_visible` unchecked.

**IDs** look like `PRJ-000042`. Each comes from a per-table counter in Script Properties, incremented under a lock, so IDs are **never reused**, even after rows are deleted. `setupDatabase()` re-syncs the counters from existing data. High-volume tables (`12_Analytics`, `14_API_Logs`) use `ANL-<uuid>` instead, so they need no lock.

**Timestamps** are real date cells, shown in the spreadsheet's timezone and returned by the API as ISO-8601 with offset (`2026-10-03T18:20:08+08:00`). `created_at` never changes; `updated_at` is refreshed on every update.

---

## API reference

**Request**: `POST <Web App URL>` with a JSON body:

```json
{ "action": "createProfile", "apiKey": "nfc_…", "data": { "username": "lance", "email": "lance@example.com" } }
```

**Response**: always HTTP 200. Apps Script can't set status codes, so check `success`:

```json
{ "success": true,  "message": "Profile created successfully", "data": { "profile_id": "PROF-000001", "user_id": "USR-000001", "profile": { … } }, "error": null }
{ "success": false, "message": "Some fields are invalid", "data": null,
  "error": { "code": "VALIDATION_ERROR", "details": { "fields": { "email": ["Enter a valid email address"], "0.company": ["Company is required"] } } } }
```

Error codes: `VALIDATION_ERROR`, `DUPLICATE`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `RATE_LIMITED`, `BUSY`, `BAD_REQUEST`, `UNKNOWN_ACTION`, `METHOD_NOT_ALLOWED`, `PAYLOAD_TOO_LARGE`, `SETUP_REQUIRED`, `INTERNAL_ERROR`. List validation errors are keyed `<index>.<column>`.

`GET ?action=health` (no key) returns `{ "success": true, "message": "API is running" }`. Other GETs work only for read actions (`?action=getProfile&apiKey=…&username=lance`), but prefer POST so the key isn't in URLs.

### Actions

| Group | Actions | Key params (`*` required) |
|---|---|---|
| Admin | `listUsers` (+ `updateUser` with `role` / `status`, `deleteProfile`) | — · `user_id*`, `role` (`user`/`admin`), `status` (`active`/`suspended`) |
| Auth | `registerUser`, `getAuthUser`, `recordLogin`, `getSession`, `changePassword`, `requestPasswordReset`, `resetPassword`, `getSystemInfo` | `email*`, `username*`, `password_hash*` (scrypt) · `user_id*`, `session_version*` · `token_hash*`, `expires_at*`, `reset_url*` |
| Users | `getUser`, `updateUser`, `checkUsername` | `user_id` / `email` / `username` |
| Profile | `createProfile`, `getProfile` / `getProfileByUsername`, `updateProfile`, `deleteProfile`, **`getCompleteProfile`** | `user_id` or `email*`+`username*` · `user_id`/`username`/`profile_id` · `public` · `site_url` |
| Social links | `createSocialLink`, `getSocialLinks`, `updateSocialLink`, `deleteSocialLink`, `syncSocialLinks` | `user_id*`, `social_id` (or `id`), fields · `items[]` |
| Experience | `createExperience`, `getExperience`, `updateExperience`, `deleteExperience`, `syncExperience` | same pattern (`experience_id`) |
| Education | `createEducation`, `getEducation`, `updateEducation`, `deleteEducation`, `syncEducation` | `education_id` |
| Certifications | `createCertification`, `getCertifications`, `updateCertification`, `deleteCertification`, `syncCertifications` | `certification_id` |
| Skills | `createSkill`, `getSkills`, `updateSkill`, `deleteSkill`, `syncSkills` | `skill_id` |
| Services | `createService`, `getServices`, `updateService`, `deleteService`, `syncServices` | `service_id` |
| Projects | `createProject`, `getProjects`, `updateProject`, `deleteProject`, `syncProjects` | `project_id` |
| Contact actions | `createContactAction`, `getContactActions`, `updateContactAction`, `deleteContactAction`, `syncContactActions` | `contact_id` |
| Theme | `getTheme`, `updateTheme` (upsert, partial) | `user_id*` |
| QR / NFC | `getQrNfc`, `updateQrNfc` | `user_id*`, `site_url` |
| Settings | `getSettings`, `updateSetting` | `setting_name*`, `setting_value` or `settings: {…}` |
| Analytics | `recordAnalyticsEvent`, `getAnalytics` | `username`/`user_id`, `event_type*`, `event_value`, `referrer`, `device`, `browser`, `country` · `days`, `since`, `until`, `event_type` |
| Media | `uploadImage`, `deleteImage` | `user_id*`, `data_url*` (≤ 5 MB, JPG/PNG/WebP/GIF), `folder` · `file_id*` |

`sync<Section>` replaces a user's whole list in one locked operation, which is what a dashboard Save needs. Items with a known ID are updated (only the fields sent; others kept), items without one are created, rows that are missing are deleted, and `display_order` follows array order. It returns the saved list with server IDs.

### Examples

**Create a profile**: creates the user, profile, default theme, QR/NFC row and contact actions.
```json
{ "action": "createProfile", "apiKey": "…", "data": {
  "email": "lance@example.com", "username": "lance", "full_name": "Lance Valle",
  "professional_title": "Web Developer", "phone": "+63 917 555 0142", "site_url": "https://yourdomain.com" } }
```
```json
{ "success": true, "message": "Profile created successfully",
  "data": { "profile_id": "PROF-000001", "user_id": "USR-000001",
            "profile": { "profile_id": "PROF-000001", "username": "lance", "profile_url": "https://yourdomain.com/p/lance", "status": "published", "created_at": "2026-10-03T18:18:58+08:00", "…": "…" } },
  "error": null }
```

**Partial update** (only what changed):
```json
{ "action": "updateProfile", "apiKey": "…", "data": { "user_id": "USR-000001", "company": "Northbridge Advisory" } }
```

**Save a section**:
```json
{ "action": "syncSkills", "apiKey": "…", "data": { "user_id": "USR-000001",
  "items": [ { "skill_id": "SKL-000003", "skill_name": "SAP GRC" }, { "skill_name": "Next.js" } ] } }
```
```json
{ "success": true, "message": "Skill saved successfully",
  "data": { "count": 2, "items": [ { "skill_id": "SKL-000003", "skill_name": "SAP GRC", "display_order": 0, "…": "…" },
                                   { "skill_id": "SKL-000007", "skill_name": "Next.js", "display_order": 1, "…": "…" } ] }, "error": null }
```

**Everything for one user**:
```json
{ "action": "getCompleteProfile", "apiKey": "…", "data": { "username": "lance", "public": true } }
```
```json
{ "success": true, "message": "Profile retrieved", "data": {
  "profile": {}, "socialLinks": [], "experience": [], "education": [], "certifications": [],
  "skills": [], "services": [], "projects": [], "contactActions": [], "theme": {}, "qrNfc": {} }, "error": null }
```
With `public: false` (owner view), the response also includes `user` and `settings`, as well as hidden items.

**Record an event**:
```json
{ "action": "recordAnalyticsEvent", "apiKey": "…", "data": { "username": "lance", "event_type": "social_click", "event_value": "linkedin", "device": "mobile", "browser": "Safari", "country": "PH" } }
```
Event types: `profile_view`, `qr_scan`, `nfc_tap`, `phone_click`, `sms_click`, `email_click`, `website_click`, `social_click`, `portfolio_click`, `contact_download`, `profile_share`.

---

## Security, CORS & limits

**Authentication.** Every action except `health` requires the API key. It's generated by `setupDatabase()`, stored in **Script Properties** (never in the sheet or the code), compared in constant time, and failed attempts are slowed down. Rotate it with `rotateApiKey()`, then update the env var. The key travels in the JSON body because Apps Script web apps can't read request headers.

**Authorization.** Every write to user data requires `user_id`, and the row's owner is checked (`FORBIDDEN` otherwise). The key belongs to your Next.js server, which decides `user_id` from the signed-in session; it never comes from the browser.

**Validation & sanitization.** Each field is validated against its declared type: email, international phone (6–15 digits), http(s) URL, `a-z 0-9 - _` usernames (unique and not reserved), enums, hex colors, `YYYY-MM`, integer ranges, length limits and required fields. Plain-text fields have tags and control characters stripped, and rich text goes through an HTML sanitizer (Next.js sanitizes again). Unknown fields are ignored; IDs and timestamps can't be set by callers.

**Formula injection.** Values beginning with `= + - @`, or that look like numbers or dates, are written with Sheets' leading-apostrophe text marker, so `=IMPORTXML(…)` is stored as text and never executed, and `0917…` stays text.

**Concurrency.** Writes run under `LockService` (re-entrant), and multi-step operations such as creating a profile with its theme and QR row happen under one lock. Profile input is validated *before* the user row is written, so a rejected request never leaves half-created data. Analytics uses atomic `appendRow` without the lock.

**Logging.** `14_API_Logs` records `action`, `user_id`, status, error message and execution time. It never stores bodies, emails, passwords or keys. Level: `setLogLevel("all" | "writes" | "errors" | "off")`; the default is `writes`. The log is capped at 5,000 rows.

**Rate limiting.** Approximate per-minute limits via `CacheService`: 600 requests globally and 120 analytics events per profile. Apps Script can't see client IPs, so per-visitor limiting happens in Next.js (`/api/track`). For heavy traffic, add a WAF or edge limiter.

**CORS.** Apps Script gives you no control over response headers and doesn't handle `OPTIONS` preflight requests. Simple browser requests, such as a `POST` with `Content-Type: text/plain` and no custom headers, do work cross-origin after the redirect to `script.googleusercontent.com`. But anything that triggers a preflight, like `application/json` or an `Authorization` header, fails. More importantly, calling the API from the browser would **expose the API key** to anyone who opens DevTools.

So the supported architecture is **server-to-server only**: the browser calls Next.js (Server Actions or `/api/*`), and Next.js calls Apps Script with the key from server env. That's how this app is built, so CORS never comes into play. If you ever need browser access, add a Next.js route handler that proxies a *specific* action after checking the user's session. Don't ship the key.

**Quotas and performance** (consumer accounts; Workspace limits are higher):
- Web-app executions are limited to 6 minutes and about 30 concurrent.
- Each call costs roughly 0.5–2 s of latency. The app compensates in several ways:
  - Public cards are cached by Next.js (ISR + tags) and by Apps Script `CacheService`, and are invalidated on every write.
  - Analytics writes run in `after()`, so they never delay the visitor.
  - `getSession` serves the dashboard data from cache.
- A cell holds at most 50,000 characters, so images go to Drive rather than into cells.
- Sheets is comfortable up to tens of thousands of rows per tab. Archive old analytics with `archiveAnalytics(365)`, which you can put on a time-driven trigger. For thousands of active users, consider a real database.

**Drive images** are shared as "anyone with the link can view" so the public card can show them. Some Google Workspace domains block public sharing; deploy the script from a personal Google account in that case.

---

## Testing

- **In Apps Script:** run `selfTest()` after `setupDatabase()`. It runs about 40 checks through the real router with a throwaway user (auth, validation, duplicates, sync, formula injection, phone/date text handling, QR/NFC, analytics, registration/sign-in/sessions/password reset, no orphan rows) and then deletes everything it created.
- **Locally, no Google account:** `npm run sheets:test` runs `setupDatabase()` twice plus `selfTest()` against an in-memory mock of Sheets.
- **Full app against a local mock API:** `npm run sheets:mock` (port 4000, prints a key). Then set `GOOGLE_APPS_SCRIPT_URL=http://localhost:4000` and the printed key in `.env.local`. Data is in memory only.
