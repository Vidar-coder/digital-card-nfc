/**
 * ============================================================================
 *  Api.gs — Web App entry points, authentication, routing, rate limiting.
 * ============================================================================
 *  Request (POST, body = JSON):
 *    { "action": "updateProfile", "apiKey": "<secret>", "data": { … } }
 *
 *  Response (always HTTP 200 — Apps Script cannot set status codes):
 *    { "success": true,  "message": "…", "data": { … }, "error": null }
 *    { "success": false, "message": "…", "data": null,  "error": { "code": "…", "details": … } }
 *
 *  Why the API key is in the body: Apps Script web apps do NOT expose request
 *  headers to doPost/doGet, so an Authorization header cannot be read.
 *  Keep the key server-side (Next.js server code only) — never in the browser.
 */

function doPost(e) {
  return handleRequest_(e, 'POST');
}

/** GET supports read-only actions (and ?action=health without a key). Prefer POST: query strings end up in logs. */
function doGet(e) {
  return handleRequest_(e, 'GET');
}

function handleRequest_(e, method) {
  const started = Date.now();
  let action = '';
  let userId = '';
  let def = null;
  let response;

  try {
    const req = parseRequest_(e, method);
    action = req.action;

    if (action === 'health') {
      return json_(ok_('API is running', { name: APP.NAME, version: APP.VERSION, time: toIso_(new Date()) }));
    }

    authenticate_(req.apiKey);

    def = getActions_()[action];
    if (!def) throw new ApiError('UNKNOWN_ACTION', 'Unknown action "' + String(action).slice(0, 64) + '"', { allowed: Object.keys(getActions_()).sort() });
    if (method === 'GET' && def.write) throw new ApiError('METHOD_NOT_ALLOWED', 'Use POST for "' + action + '"');

    const data = req.data || {};
    userId = typeof data.user_id === 'string' ? data.user_id : '';
    rateLimit_(action, data);

    const result = def.handler(data) || {};
    response = ok_(result.message || 'OK', result.data === undefined ? {} : result.data);
  } catch (err) {
    response = fail_(err);
  }

  logRequest_({
    action: action,
    userId: userId,
    write: !!(def && def.write && !def.quiet), // high-volume actions (analytics) log errors only
    status: response.success ? 'success' : 'error',
    error: response.success ? '' : response.message + (response.error && response.error.code ? ' [' + response.error.code + ']' : ''),
    ms: Date.now() - started,
  });

  return json_(response);
}

function parseRequest_(e, method) {
  const params = (e && e.parameter) || {};
  if (method === 'GET') {
    let data = {};
    if (params.data) {
      try {
        data = JSON.parse(params.data);
      } catch (err) {
        throw new ApiError('BAD_REQUEST', 'Query parameter "data" must be JSON');
      }
    } else {
      Object.keys(params).forEach(function (k) {
        if (k !== 'action' && k !== 'apiKey') data[k] = params[k];
      });
    }
    return { action: String(params.action || ''), apiKey: params.apiKey, data: data };
  }

  const raw = e && e.postData && e.postData.contents;
  if (!raw) throw new ApiError('BAD_REQUEST', 'Request body is empty');
  if (raw.length > APP.MAX_REQUEST_BYTES) throw new ApiError('PAYLOAD_TOO_LARGE', 'Request body is too large');
  let body;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    throw new ApiError('BAD_REQUEST', 'Request body must be valid JSON');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError('BAD_REQUEST', 'Request body must be a JSON object');
  if (body.data !== undefined && (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data))) {
    throw new ApiError('BAD_REQUEST', '"data" must be a JSON object');
  }
  return { action: String(body.action || params.action || ''), apiKey: body.apiKey || params.apiKey, data: body.data || {} };
}

function authenticate_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty(APP.PROP_API_KEY);
  if (!expected) throw new ApiError('SETUP_REQUIRED', 'API key is not configured. Run setupDatabase().');
  if (!safeEqual_(provided, expected)) {
    Utilities.sleep(250); // slow down brute-force attempts
    throw new ApiError('UNAUTHORIZED', 'Invalid or missing API key');
  }
}

/**
 * Approximate fixed-window rate limiting via CacheService. Apps Script cannot
 * see client IPs, so limits are global plus per-profile for analytics. Because
 * only your Next.js server holds the key, also rate-limit per visitor there.
 */
function rateLimit_(action, data) {
  const cache = CacheService.getScriptCache();
  const minute = Math.floor(Date.now() / 60000);
  const bump = function (key, limit) {
    const n = Number(cache.get(key) || 0) + 1;
    cache.put(key, String(n), 120);
    if (n > limit) throw new ApiError('RATE_LIMITED', 'Too many requests. Please slow down.');
  };
  bump('rl:g:' + minute, APP.RATE_LIMIT_GLOBAL);
  if (action === 'recordAnalyticsEvent') {
    bump('rl:a:' + String(data.username || data.user_id || '?').slice(0, 40) + ':' + minute, APP.RATE_LIMIT_ANALYTICS_PER_PROFILE);
  }
}

/**
 * Action registry. Built lazily (inside a function) because Apps Script loads
 * files in an unspecified order — referencing handlers at top level could run
 * before the file that declares them.
 *   write: needs POST, is logged at the default log level
 */
function getActions_() {
  const actions = {};
  const add = function (map) { Object.keys(map).forEach(function (k) { actions[k] = map[k]; }); };
  add(userActions_());
  add(authActions_());
  add(adminActions_());
  add(profileActions_());
  add(socialLinkActions_());
  add(experienceActions_());
  add(educationActions_());
  add(certificationActions_());
  add(skillActions_());
  add(serviceActions_());
  add(projectActions_());
  add(contactActionActions_());
  add(themeActions_());
  add(qrNfcActions_());
  add(settingsActions_());
  add(analyticsActions_());
  add(mediaActions_());
  return actions;
}
