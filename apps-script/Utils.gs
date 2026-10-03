/**
 * ============================================================================
 *  Utils.gs — errors, response envelope, time, IDs, locking, caching.
 * ============================================================================
 */

/** Structured error. `code` is machine-readable; `details` may carry field errors. */
class ApiError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details === undefined ? null : details;
  }
}

function validationError_(fieldErrors, message) {
  return new ApiError('VALIDATION_ERROR', message || 'Some fields are invalid', { fields: fieldErrors });
}
function notFound_(what) {
  return new ApiError('NOT_FOUND', what + ' not found');
}
function forbidden_(message) {
  return new ApiError('FORBIDDEN', message || 'You are not allowed to modify this record');
}

/* ------------------------------ responses ------------------------------- */

function ok_(message, data) {
  return { success: true, message: message || '', data: data === undefined ? {} : data, error: null };
}

function fail_(err) {
  if (err instanceof ApiError) {
    return { success: false, message: err.message, data: null, error: { code: err.code, details: err.details } };
  }
  // Unexpected error: keep the message (useful for debugging) but never a stack trace.
  console.error(err && err.stack ? err.stack : err);
  return {
    success: false,
    message: 'Unexpected server error',
    data: null,
    error: { code: 'INTERNAL_ERROR', details: String((err && err.message) || err) },
  };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* --------------------------------- time --------------------------------- */

let TZ_MEMO_ = null;

/** The spreadsheet's configured timezone (File → Settings), not a hardcoded one. */
function tz_() {
  if (!TZ_MEMO_) TZ_MEMO_ = getSpreadsheet_().getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  return TZ_MEMO_;
}

/** ISO-8601 string with the spreadsheet timezone offset, e.g. 2026-10-03T17:42:10+08:00 */
function toIso_(date) {
  return Utilities.formatDate(date, tz_(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function parseDate_(v) {
  if (v instanceof Date) return v;
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/* ---------------------------------- IDs --------------------------------- */

/**
 * Collision-safe IDs.
 *  - "sequence": PREFIX-000001. A monotonic counter in Script Properties, guarded by
 *    the script lock, so numbers are never reused even after rows are deleted.
 *  - "uuid": PREFIX-<uuid> for high-volume append-only tables (analytics, logs).
 */
function newIds_(tableKey, count) {
  const schema = SCHEMA[tableKey];
  const n = count || 1;
  if (schema.idMode === 'uuid') {
    const out = [];
    for (let i = 0; i < n; i++) out.push(schema.prefix + '-' + Utilities.getUuid());
    return out;
  }
  return withLock_(function () {
    const props = PropertiesService.getScriptProperties();
    const key = 'SEQ_' + schema.prefix;
    let current = Number(props.getProperty(key) || 0);
    if (!current) current = maxExistingSequence_(tableKey); // first use / restored sheet
    const out = [];
    for (let i = 0; i < n; i++) {
      current += 1;
      out.push(schema.prefix + '-' + Utilities.formatString('%06d', current));
    }
    props.setProperty(key, String(current));
    return out;
  });
}

function newId_(tableKey) {
  return newIds_(tableKey, 1)[0];
}

/** Highest numeric suffix already present in a table (keeps counters safe after restores). */
function maxExistingSequence_(tableKey) {
  const schema = SCHEMA[tableKey];
  const re = new RegExp('^' + schema.prefix + '-(\\d+)$');
  let max = 0;
  readTable_(tableKey).rows.forEach(function (r) {
    const m = re.exec(String(r.record[schema.idField] || ''));
    if (m) max = Math.max(max, Number(m[1]));
  });
  return max;
}

/* --------------------------------- locks -------------------------------- */

let LOCK_DEPTH_ = 0;

/** Serializes writes. Re-entrant within one execution. */
function withLock_(fn) {
  if (LOCK_DEPTH_ > 0) return fn();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(APP.LOCK_TIMEOUT_MS)) {
    throw new ApiError('BUSY', 'The database is busy. Please retry in a moment.');
  }
  LOCK_DEPTH_++;
  try {
    return fn();
  } finally {
    LOCK_DEPTH_--;
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

/* --------------------------------- cache -------------------------------- */

function cacheGet_(key) {
  try {
    const v = CacheService.getScriptCache().get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}

function cachePut_(key, value, seconds) {
  try {
    const s = JSON.stringify(value);
    if (s.length < 95000) CacheService.getScriptCache().put(key, s, seconds || APP.CACHE_SECONDS);
  } catch (e) {
    /* cache is best-effort */
  }
}

function cacheRemove_(keys) {
  try {
    CacheService.getScriptCache().removeAll(keys);
  } catch (e) {
    /* ignore */
  }
}

/* -------------------------------- misc ---------------------------------- */

/** Constant-time string comparison (avoids timing leaks when checking the API key). */
function safeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (!a || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
  }
  return diff === 0;
}

function requireField_(data, field, label) {
  const v = data && data[field];
  if (v === undefined || v === null || String(v).trim() === '') {
    const errs = {};
    errs[field] = [(label || field) + ' is required'];
    throw validationError_(errs, (label || field) + ' is required');
  }
  return typeof v === 'string' ? v.trim() : v;
}

function siteUrl_(override) {
  const url = override || PropertiesService.getScriptProperties().getProperty(APP.PROP_SITE_URL) || '';
  return String(url).replace(/\/+$/, '');
}
