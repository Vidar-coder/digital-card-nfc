/**
 * ============================================================================
 *  Analytics.gs — 12_Analytics.
 * ============================================================================
 *  recordAnalyticsEvent uses Sheet.appendRow (atomic) and no script lock, so
 *  bursts of visitors don't queue behind dashboard writes.
 *  For very high traffic, archive old rows periodically (archiveAnalytics()).
 */

function analyticsActions_() {
  return {
    recordAnalyticsEvent: { write: true, quiet: true, handler: recordAnalyticsEventHandler_ },
    getAnalytics: { write: false, handler: getAnalyticsHandler_ },
  };
}

/**
 * data: { username | user_id, event_type*, event_value?, referrer?, device?, browser?, country? }
 * Events are only accepted for published profiles of active users.
 */
function recordAnalyticsEventHandler_(data) {
  let profile = null;
  if (data.username) profile = getProfileByUsername(data.username);
  else if (data.user_id) profile = getRecords('PROFILES', { user_id: String(data.user_id) })[0] || null;
  if (!profile || profile.status !== 'published') throw notFound_('Profile');

  const clean = validateRecord_('ANALYTICS', {
    user_id: profile.user_id,
    username: profile.username,
    event_type: data.event_type,
    event_value: data.event_value,
    referrer: data.referrer,
    device: data.device,
    browser: data.browser,
    country: data.country ? String(data.country).toUpperCase() : '',
  });
  clean.analytics_id = newId_('ANALYTICS');
  clean.timestamp = new Date();

  const t = readTable_('ANALYTICS');
  t.sheet.appendRow(recordToRow_('ANALYTICS', t, clean, null));
  invalidateTable_('ANALYTICS');
  return { message: 'Event recorded', data: { analytics_id: clean.analytics_id } };
}

/**
 * data: { user_id | username, days? (default 30, max 366), since?, until?, event_type?, include_events? (default true) }
 * → { totals: {event_type: n}, daily: [{date, total, profile_view}], events: [...], count, range }
 */
function getAnalyticsHandler_(data) {
  const userId = resolveUserId_(data);
  const days = Math.min(Math.max(Number(data.days) || 30, 1), 366);
  const until = parseDate_(data.until) || new Date();
  const since = parseDate_(data.since) || new Date(until.getTime() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);

  const sheetRows = readTable_('ANALYTICS').rows;
  const totals = {};
  ENUMS.EVENT_TYPES.forEach(function (t) { totals[t] = 0; });
  const daily = {};
  const events = [];

  for (let i = 0; i < sheetRows.length; i++) {
    const r = sheetRows[i].record;
    if (r.user_id !== userId) continue;
    if (data.event_type && r.event_type !== data.event_type) continue;
    const at = parseDate_(r.timestamp);
    if (!at || at < since || at > until) continue;
    totals[r.event_type] = (totals[r.event_type] || 0) + 1;
    const day = Utilities.formatDate(at, tz_(), 'yyyy-MM-dd');
    daily[day] = daily[day] || { date: day, total: 0, profile_view: 0 };
    daily[day].total++;
    if (r.event_type === 'profile_view') daily[day].profile_view++;
    if (data.include_events !== false && events.length < 20000) {
      events.push({
        analytics_id: r.analytics_id,
        event_type: r.event_type,
        event_value: r.event_value,
        referrer: r.referrer,
        device: r.device,
        browser: r.browser,
        country: r.country,
        timestamp: r.timestamp,
      });
    }
  }

  return {
    message: 'Analytics retrieved',
    data: {
      range: { since: toIso_(since), until: toIso_(until), days: days },
      totals: totals,
      daily: Object.keys(daily).sort().map(function (k) { return daily[k]; }),
      events: events,
      count: events.length,
    },
  };
}

/**
 * Optional maintenance: moves events older than `days` into a yearly archive
 * sheet ("12_Analytics_Archive_2025"). Run manually or from a time trigger.
 */
function archiveAnalytics(days) {
  const keepDays = days || 365;
  const cutoff = new Date(Date.now() - keepDays * 86400000);
  withLock_(function () {
    const t = readTable_('ANALYTICS');
    const old = t.rows.filter(function (r) {
      const d = parseDate_(r.record.timestamp);
      return d && d < cutoff;
    });
    if (!old.length) return;
    const ss = getSpreadsheet_();
    const byYear = {};
    old.forEach(function (r) {
      const y = Utilities.formatDate(parseDate_(r.record.timestamp), tz_(), 'yyyy');
      (byYear[y] = byYear[y] || []).push(r.raw);
    });
    Object.keys(byYear).forEach(function (y) {
      const name = SHEETS.ANALYTICS + '_Archive_' + y;
      const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
      if (sheet.getLastRow() === 0) sheet.appendRow(t.headers);
      sheet.getRange(sheet.getLastRow() + 1, 1, byYear[y].length, t.headers.length).setValues(byYear[y]);
    });
    deleteRowIndexes_(t.sheet, old.map(function (r) { return r.rowIndex; }));
    invalidateTable_('ANALYTICS');
    Logger.log('Archived ' + old.length + ' analytics rows');
  });
}
