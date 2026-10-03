/**
 * ============================================================================
 *  Logging.gs — request log in 14_API_Logs.
 * ============================================================================
 *  Never logs request bodies, API keys, emails or any other payload — only the
 *  action name, user_id, status, error message and execution time.
 *  Level (Script Property LOG_LEVEL, see setLogLevel()):
 *    "all" every request · "writes" writes + errors (default) · "errors" · "off"
 */

function logRequest_(entry) {
  try {
    const level = PropertiesService.getScriptProperties().getProperty(APP.PROP_LOG_LEVEL) || 'writes';
    if (level === 'off') return;
    const isError = entry.status === 'error';
    if (level === 'errors' && !isError) return;
    if (level === 'writes' && !isError && !entry.write) return;

    const sheet = getSpreadsheet_().getSheetByName(SHEETS.API_LOGS);
    if (!sheet) return;
    sheet.appendRow([
      'LOG-' + Utilities.getUuid(),
      new Date(),
      escapeCell_(String(entry.action || 'unknown').slice(0, 64)),
      escapeCell_(String(entry.userId || '').slice(0, 64)),
      isError ? 'error' : 'success',
      escapeCell_(String(entry.error || '').slice(0, 500)),
      entry.ms,
    ]);

    // Keep the log bounded: drop the oldest rows once over the limit.
    const rows = sheet.getLastRow() - 1;
    if (rows > APP.MAX_LOG_ROWS + 500) sheet.deleteRows(2, rows - APP.MAX_LOG_ROWS);
  } catch (e) {
    console.warn('Logging failed: ' + e); // logging must never break the API
  }
}
