/**
 * ============================================================================
 *  Validation.gs — schema-driven validation + sanitization.
 * ============================================================================
 *  validateRecord_(tableKey, input, { partial }) returns a clean object that
 *  contains ONLY known columns, normalized to their type, or throws a
 *  VALIDATION_ERROR with per-field messages:
 *    { code: "VALIDATION_ERROR", details: { fields: { email: ["Enter a valid email"] } } }
 */

const RE_ = {
  email: /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/,
  // International: optional +, digits, spaces, dashes, dots, parentheses. 6–15 digits total.
  phone: /^\+?[0-9\s().-]{6,30}$/,
  // Public hostnames (with a dot), plus localhost / IPs for local development.
  url: /^https?:\/\/(localhost|\d{1,3}(\.\d{1,3}){3}|[^\s<>"'`/:]+\.[^\s<>"'`/:]+)(:\d{2,5})?([/?#][^\s<>"'`]*)?$/i,
  username: /^[a-z0-9](?:[a-z0-9_-]{1,28})[a-z0-9]$/,
  month: /^\d{4}-(0[1-9]|1[0-2])$/,
  color: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i,
  id: /^[A-Za-z0-9_-]{1,64}$/,
};

/** Columns the API never accepts from callers. */
const PROTECTED_COLUMNS_ = ['created_at', 'updated_at'];

function isBlank_(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

/** Removes control characters (keeps \n and \t for multi-line text). */
function cleanText_(v, multiline) {
  let s = String(v);
  s = multiline ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') : s.replace(/[\u0000-\u001F\u007F]/g, ' ');
  return s.trim();
}

/** Plain text fields never contain markup. */
function stripTags_(s) {
  return s.replace(/<[^>]*>/g, '');
}

/**
 * Conservative HTML sanitizer for the "About" rich text. The Next.js app sanitizes
 * with an allow-list too (on save and on render); this is defense in depth.
 */
function sanitizeHtml_(html) {
  let s = String(html);
  s = s.replace(/<\s*(script|style|iframe|object|embed|form|input|textarea|select|button|link|meta|base|svg|math)[\s\S]*?(<\s*\/\s*\1\s*>|\/?>)/gi, '');
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/\s(style|srcdoc|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  s = s.replace(/(href|src)\s*=\s*("|')?\s*(javascript|data|vbscript):[^"'>\s]*("|')?/gi, '$1="#"');
  return s.trim();
}

/** Converts one input value to its column type. Returns { value } or { error }. */
function coerce_(col, raw) {
  const label = col.name.replace(/_/g, ' ');
  if (isBlank_(raw) || (Array.isArray(raw) && raw.length === 0)) {
    if (col.required) return { error: capitalize_(label) + ' is required' };
    if (col.type === 'bool') return { value: col.def === undefined ? false : col.def };
    if (col.type === 'list') return { value: [] };
    if (col.type === 'int') return { value: '' };
    return { value: '' };
  }

  switch (col.type) {
    case 'id':
    case 'fk': {
      const s = String(raw).trim();
      return RE_.id.test(s) ? { value: s } : { error: 'Invalid ' + label };
    }
    case 'string': {
      const s = stripTags_(cleanText_(raw, false));
      if (col.max && s.length > col.max) return { error: capitalize_(label) + ' must be ' + col.max + ' characters or fewer' };
      if (col.pattern && !col.pattern.test(s)) return { error: 'Invalid ' + label };
      return { value: s };
    }
    case 'text': {
      const s = stripTags_(cleanText_(raw, true));
      if (col.max && s.length > col.max) return { error: capitalize_(label) + ' must be ' + col.max + ' characters or fewer' };
      return { value: s };
    }
    case 'html': {
      const s = sanitizeHtml_(cleanText_(raw, true));
      if (col.max && s.length > col.max) return { error: capitalize_(label) + ' is too long' };
      return { value: s };
    }
    case 'email': {
      const s = String(raw).trim().toLowerCase();
      return s.length <= 254 && RE_.email.test(s) ? { value: s } : { error: 'Enter a valid email address' };
    }
    case 'phone': {
      const s = String(raw).trim();
      const digits = s.replace(/\D/g, '').length;
      return RE_.phone.test(s) && digits >= 6 && digits <= 15
        ? { value: s }
        : { error: 'Enter a valid phone number (include the country code, e.g. +63 917 555 0142)' };
    }
    case 'url': {
      let s = String(raw).trim();
      if (!/^[a-z]+:\/\//i.test(s) && /^[\w-]+(\.[\w-]+)+/.test(s)) s = 'https://' + s; // bare domains
      return s.length <= 2048 && RE_.url.test(s) ? { value: s } : { error: 'Enter a valid URL starting with https://' };
    }
    case 'username': {
      const s = String(raw).trim().toLowerCase();
      if (!RE_.username.test(s)) {
        return { error: 'Username must be 3–30 characters: a-z, 0-9, - or _ (start and end with a letter or number)' };
      }
      if (RESERVED_USERNAMES.indexOf(s) >= 0) return { error: 'This username is reserved' };
      return { value: s };
    }
    case 'enum': {
      const s = String(raw).trim().toLowerCase();
      return col.values.indexOf(s) >= 0 ? { value: s } : { error: capitalize_(label) + ' must be one of: ' + col.values.join(', ') };
    }
    case 'bool': {
      if (raw === true || raw === 'true' || raw === 1 || raw === '1' || raw === 'TRUE') return { value: true };
      if (raw === false || raw === 'false' || raw === 0 || raw === '0' || raw === 'FALSE') return { value: false };
      return { error: capitalize_(label) + ' must be true or false' };
    }
    case 'int': {
      const n = Number(raw);
      if (!isFinite(n) || Math.floor(n) !== n) return { error: capitalize_(label) + ' must be a whole number' };
      if (col.min !== undefined && n < col.min) return { error: capitalize_(label) + ' must be at least ' + col.min };
      if (col.max !== undefined && n > col.max) return { error: capitalize_(label) + ' must be at most ' + col.max };
      return { value: n };
    }
    case 'month': {
      const s = raw instanceof Date ? Utilities.formatDate(raw, tz_(), 'yyyy-MM') : String(raw).trim();
      return RE_.month.test(s) ? { value: s } : { error: capitalize_(label) + ' must be in YYYY-MM format' };
    }
    case 'color': {
      const s = String(raw).trim().toLowerCase();
      return RE_.color.test(s) ? { value: s } : { error: capitalize_(label) + ' must be a hex color like #4f46e5' };
    }
    case 'list': {
      const arr = Array.isArray(raw) ? raw : String(raw).split(',');
      const items = [];
      for (let i = 0; i < arr.length; i++) {
        const s = stripTags_(cleanText_(arr[i], false)).replace(/,/g, ' ');
        if (!s) continue;
        if (col.max && s.length > col.max) return { error: 'Each ' + label + ' item must be ' + col.max + ' characters or fewer' };
        if (items.indexOf(s) < 0) items.push(s);
      }
      if (col.maxItems && items.length > col.maxItems) return { error: 'At most ' + col.maxItems + ' ' + label };
      return { value: items };
    }
    case 'hash': {
      // scrypt$N$r$p$salt$hash (password) or 64-char hex SHA-256 (reset token)
      const s = String(raw).trim();
      return /^scrypt\$\d+\$\d+\$\d+\$[A-Za-z0-9+/=_-]{16,100}\$[A-Za-z0-9+/=_-]{32,200}$/.test(s) || /^[a-f0-9]{64}$/.test(s)
        ? { value: s }
        : { error: 'Invalid ' + label };
    }
    case 'datetime': {
      const d = parseDate_(raw);
      return d ? { value: d } : { error: 'Invalid date for ' + label };
    }
    default:
      return { error: 'Unsupported column type ' + col.type };
  }
}

/**
 * @param {string} tableKey  key of SCHEMA
 * @param {Object} input     raw request data
 * @param {{partial?: boolean}} opts  partial=true validates only the fields present (updates)
 */
function validateRecord_(tableKey, input, opts) {
  const schema = SCHEMA[tableKey];
  const partial = !!(opts && opts.partial);
  const data = input || {};
  const out = {};
  const errors = {};

  schema.columns.forEach(function (col) {
    if (col.type === 'id' || PROTECTED_COLUMNS_.indexOf(col.name) >= 0) return;
    if (col.name === 'timestamp' && col.type === 'datetime') return; // server-set
    const present = Object.prototype.hasOwnProperty.call(data, col.name);
    if (partial && !present) return;
    let raw = present ? data[col.name] : undefined;
    if (!present && col.def !== undefined) raw = col.def;
    const res = coerce_(col, raw);
    if (res.error) errors[col.name] = [res.error];
    else out[col.name] = res.value;
  });

  if (Object.keys(errors).length) throw validationError_(errors);
  return out;
}

/** Throws if another row already uses a unique value. */
function assertUnique_(tableKey, record, excludeId) {
  const schema = SCHEMA[tableKey];
  const uniques = schema.columns.filter(function (col) { return col.unique; });
  if (!uniques.length) return;
  const rows = readTable_(tableKey).rows;
  const errors = {};
  uniques.forEach(function (col) {
    const v = record[col.name];
    if (isBlank_(v)) return;
    const clash = rows.some(function (r) {
      return r.record[schema.idField] !== excludeId && String(r.record[col.name]).toLowerCase() === String(v).toLowerCase();
    });
    if (clash) errors[col.name] = [capitalize_(col.name.replace(/_/g, ' ')) + ' is already in use'];
  });
  if (Object.keys(errors).length) throw new ApiError('DUPLICATE', 'A record with the same value already exists', { fields: errors });
}

function capitalize_(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Prevents spreadsheet formula injection ("=IMPORTXML(…)") and keeps values
 * like "+63 917…" or "0917…" as text: such strings are written with a leading
 * apostrophe, which Sheets treats as a "text" marker and does not display.
 */
function escapeCell_(v) {
  if (typeof v !== 'string' || v === '') return v;
  if (/^[=+\-@\t\r]/.test(v) || /^[\d\s.,/:-]+$/.test(v)) return "'" + v;
  return v;
}
