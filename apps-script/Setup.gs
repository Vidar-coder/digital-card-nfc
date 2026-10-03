/**
 * ============================================================================
 *  Setup.gs — one-click database creation & formatting.
 * ============================================================================
 *  Run setupDatabase() from the Apps Script editor. It is idempotent:
 *    - creates missing sheets, never duplicates existing ones
 *    - writes headers on empty sheets; on existing sheets only APPENDS missing
 *      columns (never deletes, renames or reorders — your data is untouched)
 *    - (re)applies formatting, validation, filters, banding and widths
 *    - creates the API key once (rotateApiKey() makes a new one)
 */

const HEADER_BG_ = '#1f2937';
const HEADER_FG_ = '#ffffff';

const TYPE_WIDTHS_ = {
  id: 150, fk: 150, string: 180, text: 300, html: 320, email: 220, phone: 150, url: 260,
  username: 140, enum: 130, bool: 90, int: 100, month: 100, color: 110, list: 220, datetime: 160, hash: 160,
};

function setupDatabase() {
  const started = Date.now();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Open this script from the spreadsheet (Extensions → Apps Script) and run it again.');
    const props = PropertiesService.getScriptProperties();
    props.setProperty(APP.PROP_SPREADSHEET_ID, ss.getId());
    SS_MEMO_ = ss;

    const summary = { created: [], updated: [], columnsAdded: {}, apiKeyCreated: false };

    Object.keys(SCHEMA).forEach(function (key) {
      const schema = SCHEMA[key];
      let sheet = ss.getSheetByName(schema.sheet);
      const isNew = !sheet;
      if (isNew) sheet = ss.insertSheet(schema.sheet);
      const added = ensureHeaders_(sheet, schema);
      formatSheet_(sheet, schema);
      (isNew ? summary.created : summary.updated).push(schema.sheet);
      if (added.length && !isNew) summary.columnsAdded[schema.sheet] = added;
    });

    removeDefaultSheet_(ss);
    orderSheets_(ss);

    if (!props.getProperty(APP.PROP_API_KEY)) {
      props.setProperty(APP.PROP_API_KEY, generateApiKey_());
      summary.apiKeyCreated = true;
    }
    if (!props.getProperty(APP.PROP_LOG_LEVEL)) props.setProperty(APP.PROP_LOG_LEVEL, 'writes');

    // Initialize ID counters from existing data so IDs stay unique after restores/imports.
    TABLE_MEMO_ = {};
    Object.keys(SCHEMA).forEach(function (key) {
      const schema = SCHEMA[key];
      if (schema.idMode !== 'sequence') return;
      const prop = 'SEQ_' + schema.prefix;
      const existing = maxExistingSequence_(key);
      if (Number(props.getProperty(prop) || 0) < existing) props.setProperty(prop, String(existing));
    });

    const result = {
      success: true,
      spreadsheet: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      timezone: ss.getSpreadsheetTimeZone(),
      sheetsCreated: summary.created,
      sheetsVerified: summary.updated,
      columnsAdded: summary.columnsAdded,
      apiKey: summary.apiKeyCreated ? 'CREATED — run showApiKey() to copy it' : 'Already configured (run showApiKey() to view)',
      seconds: Math.round((Date.now() - started) / 100) / 10,
    };
    Logger.log('✅ Setup complete\n' + JSON.stringify(result, null, 2));
    try {
      ss.toast('Database ready: ' + Object.keys(SCHEMA).length + ' sheets configured.', APP.NAME, 8);
    } catch (e) {
      /* no UI when run from a trigger */
    }
    return result;
  } finally {
    lock.releaseLock();
  }
}

/** Writes headers on an empty sheet or appends any missing schema columns. Returns names added. */
function ensureHeaders_(sheet, schema) {
  const names = schema.columns.map(function (c) { return c.name; });
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    sheet.getRange(1, 1, 1, names.length).setValues([names]);
    return names;
  }
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  const missing = names.filter(function (n) { return existing.indexOf(n) < 0; });
  if (missing.length) {
    if (sheet.getMaxColumns() < lastCol + missing.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), lastCol + missing.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
  return missing;
}

function formatSheet_(sheet, schema) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });

  // Make sure there is room for formatting/validation to apply to future rows.
  if (sheet.getMaxRows() < APP.MIN_ROWS) sheet.insertRowsAfter(sheet.getMaxRows(), APP.MIN_ROWS - sheet.getMaxRows());
  // Trim unused columns to the right for a clean look.
  if (sheet.getMaxColumns() > lastCol) sheet.deleteColumns(lastCol + 1, sheet.getMaxColumns() - lastCol);
  const maxRows = sheet.getMaxRows();
  const bodyRows = maxRows - 1;

  // Header row
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  sheet.getRange(1, 1, 1, lastCol)
    .setFontWeight('bold')
    .setBackground(HEADER_BG_)
    .setFontColor(HEADER_FG_)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(false);
  sheet.setRowHeight(1, 32);

  // Body defaults
  sheet.getRange(2, 1, bodyRows, lastCol)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
    .setFontFamily('Arial')
    .setFontSize(10);

  schema.columns.forEach(function (col) {
    const idx = headers.indexOf(col.name) + 1;
    if (idx < 1) return;
    const range = sheet.getRange(2, idx, bodyRows, 1);
    applyColumnFormat_(range, col);
    applyColumnValidation_(range, col);
    const note = columnNote_(col);
    if (note) sheet.getRange(1, idx).setNote(note);
    if (col.secret) sheet.hideColumns(idx); // credential hashes stay out of sight
  });

  // Widths: auto-size to the header, then clamp to sensible type-based bounds.
  sheet.autoResizeColumns(1, lastCol);
  headers.forEach(function (name, i) {
    const col = schema.columns.filter(function (c) { return c.name === name; })[0];
    const preferred = col ? TYPE_WIDTHS_[col.type] || 160 : 160;
    const auto = sheet.getColumnWidth(i + 1);
    sheet.setColumnWidth(i + 1, Math.min(Math.max(auto + 16, preferred), 360));
  });

  // Alternating row colors (one banding per sheet; resized when columns are added).
  const bandRange = sheet.getRange(1, 1, maxRows, lastCol);
  const bandings = sheet.getBandings();
  if (bandings.length) {
    bandings[0].setRange(bandRange);
  } else {
    bandRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
      .setHeaderRowColor(HEADER_BG_);
  }

  // Filter on the header row (recreated if columns were added).
  const filter = sheet.getFilter();
  if (filter && filter.getRange().getNumColumns() !== lastCol) filter.remove();
  if (!sheet.getFilter()) sheet.getRange(1, 1, maxRows, lastCol).createFilter();

  sheet.setTabColor(tabColor_(schema.sheet));
}

function applyColumnFormat_(range, col) {
  switch (col.type) {
    case 'datetime':
      range.setNumberFormat(APP.DATETIME_FORMAT).setHorizontalAlignment('center');
      break;
    case 'int':
      range.setNumberFormat('0').setHorizontalAlignment('center');
      break;
    case 'bool':
      range.setHorizontalAlignment('center');
      break;
    case 'id':
    case 'fk':
    case 'enum':
    case 'month':
    case 'color':
      range.setNumberFormat('@').setHorizontalAlignment('center');
      break;
    case 'url':
      range.setNumberFormat('@').setHorizontalAlignment('left').setFontColor('#1155cc');
      break;
    default:
      range.setNumberFormat('@').setHorizontalAlignment('left'); // plain text: keeps "0917…" & "+63…" intact
  }
  if (col.type === 'id') range.setFontFamily('Roboto Mono').setFontColor('#4b5563');
}

function applyColumnValidation_(range, col) {
  let rule = null;
  const b = SpreadsheetApp.newDataValidation().setAllowInvalid(false);
  switch (col.type) {
    case 'bool':
      rule = b.requireCheckbox().build();
      break;
    case 'enum':
      rule = b.requireValueInList(col.values, true).setHelpText('Choose one of: ' + col.values.join(', ')).build();
      break;
    case 'email':
      rule = b.requireTextIsEmail().setHelpText('Must be a valid email address').build();
      break;
    case 'url':
      rule = b.requireTextIsUrl().setHelpText('Must be a full URL starting with https://').build();
      break;
    case 'int':
      if (col.min !== undefined && col.max !== undefined) {
        rule = b.requireNumberBetween(col.min, col.max).setHelpText('Whole number between ' + col.min + ' and ' + col.max).build();
      }
      break;
    case 'datetime':
      rule = b.requireDate().setHelpText('Must be a date/time').build();
      break;
    case 'color':
      rule = b.requireFormulaSatisfied('=OR(ISBLANK(' + a1Top_(range) + '),REGEXMATCH(' + a1Top_(range) + ',"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"))')
        .setHelpText('Hex color, e.g. #4f46e5').build();
      break;
    case 'month':
      rule = b.requireFormulaSatisfied('=OR(ISBLANK(' + a1Top_(range) + '),REGEXMATCH(TO_TEXT(' + a1Top_(range) + '),"^\\d{4}-(0[1-9]|1[0-2])$"))')
        .setHelpText('Format YYYY-MM, e.g. 2024-06').build();
      break;
  }
  if (rule) range.setDataValidation(rule);
  else range.clearDataValidations();
}

/** Relative A1 reference of the first cell in a range (for custom-formula rules). */
function a1Top_(range) {
  return range.getCell(1, 1).getA1Notation();
}

function columnNote_(col) {
  const parts = [];
  if (col.type === 'id') parts.push('Generated automatically — do not edit.');
  if (col.secret) parts.push('Secret credential hash written by the app. Never edit, copy or share.');
  if (col.name === 'created_at' || col.name === 'updated_at' || col.name === 'timestamp') parts.push('Set automatically by the API.');
  if (col.required) parts.push('Required.');
  if (col.unique) parts.push('Must be unique.');
  if (col.type === 'list') parts.push('Comma-separated list.');
  if (col.type === 'html') parts.push('Sanitized HTML from the rich-text editor.');
  return parts.join(' ');
}

function tabColor_(name) {
  if (/Users|Profiles/.test(name)) return '#4f46e5';
  if (/Themes|QR_NFC|Settings/.test(name)) return '#0ea5a4';
  if (/Analytics|Logs/.test(name)) return '#f59e0b';
  return '#64748b';
}

function removeDefaultSheet_(ss) {
  ['Sheet1', 'Hoja 1', 'Feuille 1', 'Tabellenblatt1'].forEach(function (n) {
    const s = ss.getSheetByName(n);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
}

function orderSheets_(ss) {
  const ordered = Object.keys(SCHEMA).map(function (k) { return SCHEMA[k].sheet; }).sort();
  ordered.forEach(function (name, i) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1);
    }
  });
  ss.setActiveSheet(ss.getSheetByName(ordered[0]));
}

/* ------------------------------ API key ---------------------------------- */

function generateApiKey_() {
  return ('nfc_' + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

/** Logs the API key so you can copy it into GOOGLE_APPS_SCRIPT_API_KEY (server env only). */
function showApiKey() {
  const key = PropertiesService.getScriptProperties().getProperty(APP.PROP_API_KEY);
  Logger.log(key ? 'GOOGLE_APPS_SCRIPT_API_KEY=' + key : 'No key yet — run setupDatabase() first.');
}

/** Replaces the API key. Update GOOGLE_APPS_SCRIPT_API_KEY in Next.js afterwards. */
function rotateApiKey() {
  PropertiesService.getScriptProperties().setProperty(APP.PROP_API_KEY, generateApiKey_());
  showApiKey();
}

/** Optional: default public site URL used to build profile/QR/NFC links. */
function setSiteUrl(url) {
  PropertiesService.getScriptProperties().setProperty(APP.PROP_SITE_URL, String(url || '').replace(/\/+$/, ''));
}

/** Optional: "all" | "writes" (default) | "errors" | "off" */
function setLogLevel(level) {
  PropertiesService.getScriptProperties().setProperty(APP.PROP_LOG_LEVEL, level);
}
