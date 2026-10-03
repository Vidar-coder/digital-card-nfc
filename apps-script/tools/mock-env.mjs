/**
 * In-memory mock of the Apps Script runtime (SpreadsheetApp, PropertiesService,
 * CacheService, LockService, Utilities, ContentService) that loads every .gs file,
 * so the real backend code runs locally without a Google account.
 *
 * The mock mimics the Sheets behaviours the API depends on: formula strings,
 * leading-apostrophe text, numeric/date coercion, Date cells and row deletion.
 * Development aid only — always run selfTest() once in real Apps Script too.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createHash, randomUUID } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..");

/* ------------------------------ Sheets mock ------------------------------ */

/** Emulates how Sheets stores a value written with setValues(). */
function storeValue(v) {
  if (typeof v !== "string") return v;
  if (v.startsWith("'")) return v.slice(1); // apostrophe = force text, not displayed
  if (v.startsWith("=")) return { formula: v }; // would be EXECUTED by Sheets
  if (/^[+-]?\d+(\.\d+)?$/.test(v.trim())) return Number(v); // numeric coercion
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(v.trim())) return new Date(v); // date coercion
  return v;
}

class Range {
  constructor(sheet, r, c, nr = 1, nc = 1) {
    Object.assign(this, { sheet, r, c, nr, nc });
  }
  getValues() {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const row = [];
      for (let j = 0; j < this.nc; j++) {
        const v = this.sheet.cell(this.r + i, this.c + j);
        row.push(v && typeof v === "object" && "formula" in v ? "#FORMULA" : v);
      }
      out.push(row);
    }
    return out;
  }
  setValues(values) {
    if (values.length !== this.nr || values.some((r) => r.length !== this.nc)) throw new Error("setValues dimension mismatch");
    values.forEach((row, i) => row.forEach((v, j) => this.sheet.set(this.r + i, this.c + j, storeValue(v))));
    return this;
  }
  getNumColumns() { return this.nc; }
  getCell(i, j) { return new Range(this.sheet, this.r + i - 1, this.c + j - 1); }
  getA1Notation() { return String.fromCharCode(64 + this.c) + this.r; }
  applyRowBanding() { const b = { setHeaderRowColor: () => b, setRange: () => b }; this.sheet.bandings.push(b); return b; }
  createFilter() { this.sheet.filter = { getRange: () => this, remove: () => (this.sheet.filter = null) }; return this.sheet.filter; }
  setDataValidation() { return this; }
  clearDataValidations() { return this; }
}
// Formatting methods are no-ops that return the range for chaining.
for (const m of ["setFontWeight", "setBackground", "setFontColor", "setHorizontalAlignment", "setVerticalAlignment",
  "setWrap", "setWrapStrategy", "setFontFamily", "setFontSize", "setNumberFormat", "setNote"]) {
  Range.prototype[m] = function () { return this; };
}

class Sheet {
  constructor(name) {
    Object.assign(this, { name, rows: [], maxRows: 1000, maxCols: 26, bandings: [], filter: null });
  }
  cell(r, c) { return (this.rows[r - 1] || [])[c - 1] ?? ""; }
  set(r, c, v) {
    while (this.rows.length < r) this.rows.push([]);
    this.rows[r - 1][c - 1] = v;
    this.maxRows = Math.max(this.maxRows, r);
    this.maxCols = Math.max(this.maxCols, c);
  }
  isBlankRow(row) { return !row || row.every((v) => v === "" || v === undefined || v === null); }
  getName() { return this.name; }
  getLastRow() { let n = this.rows.length; while (n > 0 && this.isBlankRow(this.rows[n - 1])) n--; return n; }
  getLastColumn() { return this.rows.reduce((m, r) => { let n = r.length; while (n > 0 && (r[n - 1] === "" || r[n - 1] === undefined)) n--; return Math.max(m, n); }, 0); }
  getMaxRows() { return this.maxRows; }
  getMaxColumns() { return this.maxCols; }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
  appendRow(values) { const r = this.getLastRow() + 1; values.forEach((v, j) => this.set(r, j + 1, storeValue(v))); }
  deleteRow(r) { this.rows.splice(r - 1, 1); }
  deleteRows(r, n) { this.rows.splice(r - 1, n); }
  insertRowsAfter(_a, n) { this.maxRows += n; }
  insertColumnsAfter(_a, n) { this.maxCols += n; }
  deleteColumns(_c, n) { this.maxCols -= n; }
  getBandings() { return this.bandings; }
  getFilter() { return this.filter; }
  autoResizeColumns() {}
  getColumnWidth() { return 100; }
}
for (const m of ["setFrozenRows", "setFrozenColumns", "setRowHeight", "setColumnWidth", "setTabColor", "hideColumns"]) Sheet.prototype[m] = () => {};

class Spreadsheet {
  constructor() { this.sheets = [new Sheet("Sheet1")]; this.active = this.sheets[0]; }
  getId() { return "mock-spreadsheet"; }
  getName() { return "Mock DB"; }
  getUrl() { return "https://docs.google.com/spreadsheets/d/1MockSpreadsheetIdForLocalDevelopment0/edit"; }
  getSpreadsheetTimeZone() { return "Asia/Manila"; }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
  insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; }
  getSheets() { return this.sheets; }
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
  setActiveSheet(s) { this.active = s; }
  moveActiveSheet() {}
  toast() {}
}



function formatDate(date, tz, fmt) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(date).map((x) => [x.type, x.value]),
  );
  return fmt
    .replace("'T'", "T")
    .replace("yyyy", p.year).replace("MM", p.month).replace("dd", p.day)
    .replace("HH", p.hour).replace("mm", p.minute).replace("ss", p.second)
    .replace("XXX", "+08:00");
}

const validationBuilder = () => {
  const b = new Proxy({}, { get: (_t, k) => (k === "build" ? () => ({}) : () => b) });
  return b;
};

export function createAppsScriptContext() {
const ss = new Spreadsheet();
const props = new Map();
const cache = new Map();
const logs = [];
const mail = [];
const context = {
  MailApp: { sendEmail: (m) => { mail.push(m); console.log(`[mock mail] to=${m.to} subject="${m.subject}"
  ${m.body}`); } },
  console,
  Logger: { log: (m) => logs.push(String(m)) },
  Session: { getScriptTimeZone: () => "Asia/Manila" },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ss,
    openById: () => ss,
    flush: () => {},
    newDataValidation: validationBuilder,
    WrapStrategy: { CLIP: "CLIP" },
    BandingTheme: { LIGHT_GREY: "LIGHT_GREY" },
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => (props.has(k) ? props.get(k) : null),
      setProperty: (k, v) => props.set(k, String(v)),
    }),
  },
  LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
  CacheService: {
    getScriptCache: () => ({
      get: (k) => cache.get(k) ?? null,
      put: (k, v) => cache.set(k, v),
      removeAll: (ks) => ks.forEach((k) => cache.delete(k)),
    }),
  },
  Utilities: {
    getUuid: () => randomUUID(),
    formatDate,
    formatString: (_f, n) => String(n).padStart(6, "0"),
    base64Decode: (s) => [...Buffer.from(s, "base64")],
    newBlob: () => ({}),
    base64Encode: (v) => Buffer.from(typeof v === "string" ? v : Uint8Array.from(v)).toString("base64"),
    DigestAlgorithm: { SHA_256: "sha256" },
    computeDigest: (_alg, v) => [...createHash("sha256").update(String(v)).digest()].map((b) => (b > 127 ? b - 256 : b)),
    sleep: () => {},
  },
  DriveApp: (() => {
    // Minimal in-memory Drive: folders by name, files with ids and sharing.
    const folders = new Map();
    const files = new Map();
    const makeFolder = (name, parent) => {
      const id = "fld_" + randomUUID().slice(0, 8);
      const f = {
        id, name, parent,
        getId: () => id,
        getParents: () => { const it = parent ? [parent] : []; return { hasNext: () => it.length > 0, next: () => it.shift() }; },
        getFoldersByName: (n) => { const it = [...folders.values()].filter((x) => x.parent === f && x.name === n); return { hasNext: () => it.length > 0, next: () => it.shift() }; },
        createFolder: (n) => makeFolder(n, f),
        createFile: () => {
          const fid = "file_" + randomUUID().slice(0, 8);
          const file = { getId: () => fid, setSharing() {}, setDescription() {}, setTrashed() {}, getParents: () => { const it = [f]; return { hasNext: () => it.length > 0, next: () => it.shift() }; } };
          files.set(fid, file);
          return file;
        },
      };
      folders.set(id, f);
      return f;
    };
    return {
      Access: { ANYONE_WITH_LINK: "ANYONE_WITH_LINK" },
      Permission: { VIEW: "VIEW" },
      createFolder: (n) => makeFolder(n, null),
      getFolderById: (id) => { if (!folders.has(id)) throw new Error("not found"); return folders.get(id); },
      getFileById: (id) => { if (!files.has(id)) throw new Error("not found"); return files.get(id); },
    };
  })(),
  ContentService: {
    MimeType: { JSON: "JSON" },
    createTextOutput: (s) => ({ getContent: () => s, setMimeType() { return this; } }),
  },
};
vm.createContext(context);
// Load files in REVERSE alphabetical order to prove load order doesn't matter.
const files = readdirSync(srcDir).filter((f) => f.endsWith(".gs")).sort().reverse();
for (const f of files) vm.runInContext(readFileSync(join(srcDir, f), "utf8"), context, { filename: f });
const run = (code) => vm.runInContext(code, context);
return { context, ss, props, logs, mail, run };
}
