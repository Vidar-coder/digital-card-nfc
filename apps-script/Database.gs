/**
 * ============================================================================
 *  Database.gs — generic, schema-driven CRUD on top of Google Sheets.
 * ============================================================================
 *  Public helpers (usable from any file):
 *    createRecord(tableKey, data, opts)          → record
 *    getRecords(tableKey, filters, opts)         → record[]
 *    getRecordById(tableKey, id)                 → record | null
 *    updateRecord(tableKey, id, data, opts)      → record
 *    deleteRecord(tableKey, id, opts)            → true
 *    getUserRecords(userId, tableKey)            → record[] (ordered)
 *    syncRecords(tableKey, userId, items)        → record[] (replace a user's list)
 *
 *  Records are plain objects keyed by column name. Dates come back as ISO
 *  strings in the spreadsheet's timezone; lists as arrays; booleans as booleans.
 *  Columns are located by header NAME, so manual column re-ordering or extra
 *  columns added by hand never break the API.
 */

let TABLE_MEMO_ = {};
let SS_MEMO_ = null;

function getSpreadsheet_() {
  if (SS_MEMO_) return SS_MEMO_;
  const id = PropertiesService.getScriptProperties().getProperty(APP.PROP_SPREADSHEET_ID);
  SS_MEMO_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!SS_MEMO_) throw new ApiError('SETUP_REQUIRED', 'Spreadsheet not found. Run setupDatabase() from the bound script.');
  return SS_MEMO_;
}

function getSheet_(tableKey) {
  const sheet = getSpreadsheet_().getSheetByName(SCHEMA[tableKey].sheet);
  if (!sheet) throw new ApiError('SETUP_REQUIRED', 'Sheet "' + SCHEMA[tableKey].sheet + '" is missing. Run setupDatabase().');
  return sheet;
}

/* --------------------------- cell conversion ---------------------------- */

function fromCell_(col, v) {
  switch (col.type) {
    case 'datetime':
      return v instanceof Date ? toIso_(v) : v === '' ? '' : String(v);
    case 'bool':
      if (v === '' || v === null) return col.def === undefined ? false : col.def;
      return v === true || String(v).toLowerCase() === 'true';
    case 'int':
      return v === '' || v === null || isNaN(Number(v)) ? null : Number(v);
    case 'list':
      return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(String);
    case 'month':
      return v instanceof Date ? Utilities.formatDate(v, tz_(), 'yyyy-MM') : String(v).replace(/^'/, '');
    default:
      if (v instanceof Date) return toIso_(v);
      return String(v === null || v === undefined ? '' : v).replace(/^'/, '');
  }
}

function toCell_(col, v) {
  if (v === undefined || v === null) return col.type === 'bool' ? !!col.def : '';
  switch (col.type) {
    case 'datetime':
      return parseDate_(v) || '';
    case 'bool':
      return v === true || v === 'true';
    case 'int':
      return v === '' ? '' : Number(v);
    case 'list':
      return escapeCell_((Array.isArray(v) ? v : [v]).join(', '));
    default:
      return escapeCell_(String(v));
  }
}

/* ------------------------------- reading -------------------------------- */

/** Reads a whole table once per execution (memoized; invalidated on writes). */
function readTable_(tableKey) {
  if (TABLE_MEMO_[tableKey]) return TABLE_MEMO_[tableKey];
  const schema = SCHEMA[tableKey];
  const sheet = getSheet_(tableKey);
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const values = lastRow >= 1 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [[]];
  const headers = values[0].map(function (h) { return String(h).trim(); });

  const colIndex = {};
  schema.columns.forEach(function (col) {
    const idx = headers.indexOf(col.name);
    if (idx < 0) throw new ApiError('SETUP_REQUIRED', 'Column "' + col.name + '" missing in ' + schema.sheet + '. Run setupDatabase().');
    colIndex[col.name] = idx;
  });

  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const raw = values[r];
    if (raw[colIndex[schema.idField]] === '' || raw[colIndex[schema.idField]] === null) continue; // blank row
    const record = {};
    schema.columns.forEach(function (col) {
      record[col.name] = fromCell_(col, raw[colIndex[col.name]]);
    });
    rows.push({ record: record, raw: raw, rowIndex: r + 1 });
  }

  TABLE_MEMO_[tableKey] = { sheet: sheet, headers: headers, colIndex: colIndex, rows: rows };
  return TABLE_MEMO_[tableKey];
}

function invalidateTable_(tableKey) {
  delete TABLE_MEMO_[tableKey];
}

function matches_(record, filters) {
  return Object.keys(filters || {}).every(function (k) {
    const want = filters[k];
    if (want === undefined) return true;
    const have = record[k];
    if (typeof have === 'string' && typeof want === 'string') return have.toLowerCase() === want.toLowerCase();
    return have === want;
  });
}

/**
 * @param {string} tableKey
 * @param {Object=} filters  equality filters, e.g. { user_id: 'USR-000001', status: 'published' }
 * @param {{ sort?: string, desc?: boolean, limit?: number }=} opts
 */
function getRecords(tableKey, filters, opts) {
  const o = opts || {};
  let list = readTable_(tableKey).rows
    .filter(function (r) { return matches_(r.record, filters); })
    .map(function (r) { return r.record; });
  const sortKey = o.sort || (SCHEMA[tableKey].ordered ? 'display_order' : null);
  if (sortKey) {
    list.sort(function (a, b) {
      const x = a[sortKey], y = b[sortKey];
      const cmp = x === y ? 0 : x === null || x === '' ? 1 : y === null || y === '' ? -1 : x < y ? -1 : 1;
      return o.desc ? -cmp : cmp;
    });
  }
  if (o.limit) list = list.slice(0, o.limit);
  return list;
}

/** Removes secret columns (password/reset hashes) from a record read with getRecords(). */
function withoutSecrets_(tableKey, record) {
  if (!record) return record;
  const out = Object.assign({}, record);
  SCHEMA[tableKey].columns.forEach(function (col) { if (col.secret) delete out[col.name]; });
  return out;
}

function getRecordById(tableKey, id) {
  const idField = SCHEMA[tableKey].idField;
  const row = readTable_(tableKey).rows.filter(function (r) { return r.record[idField] === id; })[0];
  return row ? row.record : null;
}

/** All rows of a table that belong to a user, in display order. */
function getUserRecords(userId, tableKey) {
  return getRecords(tableKey, { user_id: userId });
}

function findRow_(tableKey, id) {
  const idField = SCHEMA[tableKey].idField;
  return readTable_(tableKey).rows.filter(function (r) { return r.record[idField] === id; })[0] || null;
}

/* ------------------------------- writing -------------------------------- */

function hasColumn_(tableKey, name) {
  return SCHEMA[tableKey].columns.some(function (c) { return c.name === name; });
}

/** Builds a sheet row from a full record, preserving any extra (unknown) columns. */
function recordToRow_(tableKey, t, record, existingRaw) {
  const row = existingRaw
    ? existingRaw.map(function (v) { return escapeCell_(v); })
    : t.headers.map(function () { return ''; });
  SCHEMA[tableKey].columns.forEach(function (col) {
    row[t.colIndex[col.name]] = toCell_(col, record[col.name]);
  });
  return row;
}

/** Converts stored values (Dates) into the API representation. Secret columns are omitted. */
function publicRecord_(tableKey, record) {
  const out = {};
  SCHEMA[tableKey].columns.forEach(function (col) {
    if (col.secret) return;
    const v = record[col.name];
    if (v instanceof Date) out[col.name] = toIso_(v);
    else if (col.type === 'int') out[col.name] = v === '' || v === undefined ? null : v;
    else if (col.type === 'list') out[col.name] = Array.isArray(v) ? v : fromCell_(col, v || '');
    else out[col.name] = v === undefined ? (col.type === 'bool' ? !!col.def : '') : v;
  });
  return out;
}

function stamp_(tableKey, record, isNew) {
  const now = new Date();
  if (isNew && hasColumn_(tableKey, 'created_at')) record.created_at = now;
  if (hasColumn_(tableKey, 'updated_at')) record.updated_at = now;
  if (isNew && hasColumn_(tableKey, 'timestamp')) record.timestamp = now;
  return record;
}

function appendRecords_(tableKey, records) {
  if (!records.length) return;
  const t = readTable_(tableKey);
  const rows = records.map(function (r) { return recordToRow_(tableKey, t, r, null); });
  const start = Math.max(t.sheet.getLastRow(), 1) + 1;
  t.sheet.getRange(start, 1, rows.length, t.headers.length).setValues(rows);
  invalidateTable_(tableKey);
}

/**
 * Creates a record. Validates, assigns an ID, sets created_at/updated_at.
 * @param {{ validated?: boolean, lock?: boolean }=} opts
 */
function createRecord(tableKey, data, opts) {
  const o = opts || {};
  const run = function () {
    const schema = SCHEMA[tableKey];
    const record = o.validated ? Object.assign({}, data) : validateRecord_(tableKey, data);
    record[schema.idField] = newId_(tableKey);
    stamp_(tableKey, record, true);
    assertUnique_(tableKey, record, null);
    appendRecords_(tableKey, [record]);
    afterWrite_(tableKey, record.user_id);
    return publicRecord_(tableKey, record);
  };
  return o.lock === false ? run() : withLock_(run);
}

/**
 * Partially updates a record. created_at and the ID never change; updated_at is refreshed.
 * @param {{ userId?: string }=} opts  when set, the row must belong to this user
 */
function updateRecord(tableKey, id, data, opts) {
  return withLock_(function () {
    const schema = SCHEMA[tableKey];
    const row = findRow_(tableKey, id);
    if (!row) throw notFound_(schema.sheet.replace(/^\d+_/, '').replace(/_/g, ' ') + ' record ' + id);
    assertOwner_(tableKey, row.record, opts);

    const patch = validateRecord_(tableKey, data, { partial: true });
    delete patch.user_id; // ownership never changes through an update
    const merged = Object.assign({}, row.record, patch);
    merged.created_at = parseDate_(row.record.created_at) || row.record.created_at;
    stamp_(tableKey, merged, false);
    assertUnique_(tableKey, merged, id);

    const t = readTable_(tableKey);
    t.sheet.getRange(row.rowIndex, 1, 1, t.headers.length).setValues([recordToRow_(tableKey, t, merged, row.raw)]);
    invalidateTable_(tableKey);
    afterWrite_(tableKey, row.record.user_id);
    return publicRecord_(tableKey, merged);
  });
}

function deleteRecord(tableKey, id, opts) {
  return withLock_(function () {
    const row = findRow_(tableKey, id);
    if (!row) throw notFound_('Record ' + id);
    assertOwner_(tableKey, row.record, opts);
    readTable_(tableKey).sheet.deleteRow(row.rowIndex);
    invalidateTable_(tableKey);
    afterWrite_(tableKey, row.record.user_id);
    return true;
  });
}

/** Deletes every row matching `predicate(record)`. Returns the count. */
function deleteWhere_(tableKey, predicate) {
  return withLock_(function () {
    const t = readTable_(tableKey);
    const targets = t.rows.filter(function (r) { return predicate(r.record); }).map(function (r) { return r.rowIndex; });
    deleteRowIndexes_(t.sheet, targets);
    invalidateTable_(tableKey);
    return targets.length;
  });
}

/** Deletes rows bottom-up, collapsing consecutive rows into one call. */
function deleteRowIndexes_(sheet, indexes) {
  const sorted = indexes.slice().sort(function (a, b) { return b - a; });
  let i = 0;
  while (i < sorted.length) {
    let start = sorted[i], count = 1;
    while (i + count < sorted.length && sorted[i + count] === start - count) count++;
    sheet.deleteRows(start - count + 1, count);
    i += count;
  }
}

function assertOwner_(tableKey, record, opts) {
  if (!opts || !opts.userId || !SCHEMA[tableKey].userScoped) return;
  if (record.user_id !== opts.userId) throw forbidden_();
}

/**
 * Replaces a user's whole ordered list in one locked operation — exactly what a
 * dashboard "Save" on a list section needs:
 *   - items with a known ID are updated (only the fields sent; others kept)
 *   - items without an ID / unknown ID are created (new server ID returned)
 *   - the user's rows not present in `items` are deleted
 *   - display_order follows the array order
 * Validation errors are keyed "<index>.<field>" so the UI can highlight rows.
 */
function syncRecords(tableKey, userId, items) {
  if (!Array.isArray(items)) throw validationError_({ items: ['items must be an array'] });
  if (items.length > 100) throw validationError_({ items: ['At most 100 items per section'] });

  return withLock_(function () {
    const schema = SCHEMA[tableKey];
    const t = readTable_(tableKey);
    const mine = t.rows.filter(function (r) { return r.record.user_id === userId; });
    const byId = {};
    mine.forEach(function (r) { byId[r.record[schema.idField]] = r; });

    const errors = {};
    const prepared = items.map(function (item, i) {
      const id = item && item[schema.idField];
      const existing = id && byId[id] ? byId[id] : null;
      const input = Object.assign({}, item, { user_id: userId });
      if (schema.ordered) input.display_order = i;
      try {
        return { existing: existing, clean: validateRecord_(tableKey, input, { partial: !!existing }) };
      } catch (e) {
        if (!(e instanceof ApiError) || e.code !== 'VALIDATION_ERROR') throw e;
        Object.keys(e.details.fields).forEach(function (f) { errors[i + '.' + f] = e.details.fields[f]; });
        return null;
      }
    });
    if (Object.keys(errors).length) throw validationError_(errors);

    const ids = newIds_(tableKey, prepared.filter(function (p) { return !p.existing; }).length);
    const keep = {};
    const result = [];
    const creates = [];

    // 1) updates in place (row indexes are still valid)
    prepared.forEach(function (p) {
      if (p.existing) {
        const merged = Object.assign({}, p.existing.record, p.clean, { user_id: userId });
        merged.created_at = parseDate_(p.existing.record.created_at) || p.existing.record.created_at;
        stamp_(tableKey, merged, false);
        t.sheet.getRange(p.existing.rowIndex, 1, 1, t.headers.length).setValues([recordToRow_(tableKey, t, merged, p.existing.raw)]);
        keep[merged[schema.idField]] = true;
        result.push(merged);
      } else {
        const rec = Object.assign({}, p.clean);
        rec[schema.idField] = ids.shift();
        stamp_(tableKey, rec, true);
        creates.push(rec);
        result.push(rec);
      }
    });

    // 2) deletes (bottom-up so indexes stay valid), 3) appends
    const toDelete = mine.filter(function (r) { return !keep[r.record[schema.idField]]; }).map(function (r) { return r.rowIndex; });
    deleteRowIndexes_(t.sheet, toDelete);
    invalidateTable_(tableKey);
    appendRecords_(tableKey, creates);
    afterWrite_(tableKey, userId);

    return result.map(function (r) { return publicRecord_(tableKey, r); });
  });
}

/** Post-write hook: invalidates the cached complete profile for that user. */
function afterWrite_(tableKey, userId) {
  if (tableKey === 'ANALYTICS' || tableKey === 'API_LOGS' || !userId) return;
  invalidateUserCache_(userId);
}

function invalidateUserCache_(userId) {
  const keys = ['cp:u:' + userId + ':0', 'cp:u:' + userId + ':1'];
  try {
    const profile = getRecords('PROFILES', { user_id: userId })[0];
    if (profile && profile.username) keys.push('cp:n:' + profile.username + ':1', 'cp:n:' + profile.username + ':0');
  } catch (e) {
    /* ignore */
  }
  cacheRemove_(keys);
}
