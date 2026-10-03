/**
 * ============================================================================
 *  Auth.gs — account sign-up, sign-in support, sessions and password reset.
 * ============================================================================
 *  Division of labour (so secrets never live in the sheet in usable form):
 *   - Next.js hashes passwords (scrypt, per-user salt) and only sends HASHES.
 *   - Next.js verifies the password hash and issues a signed session cookie
 *     containing { user_id, session_version }.
 *   - This file stores hashes, validates sessions (status + session_version),
 *     and emails password-reset links (only the token's SHA-256 is stored).
 *  These actions are reachable only with the server-side API key.
 */

function authActions_() {
  return {
    registerUser: { write: true, handler: registerUserHandler_ },
    getAuthUser: { write: false, handler: getAuthUserHandler_ },
    recordLogin: { write: true, quiet: true, handler: recordLoginHandler_ },
    getSession: { write: false, handler: getSessionHandler_ },
    changePassword: { write: true, handler: changePasswordHandler_ },
    requestPasswordReset: { write: true, handler: requestPasswordResetHandler_ },
    resetPassword: { write: true, handler: resetPasswordHandler_ },
    getSystemInfo: { write: false, handler: getSystemInfoHandler_ },
  };
}

/**
 * Creates user + profile + theme + QR/NFC row in one locked operation.
 * data: { email*, username*, password_hash*, full_name?, site_url?, role? }
 *   - password_hash may be omitted when an admin creates the account and an
 *     invite email (requestPasswordReset with invite=true) follows.
 *   - The very first account becomes "admin"; otherwise `role` (default "user")
 *     is only honoured because the caller (the Next.js server) checks that the
 *     signed-in user is an admin before passing it.
 */
function registerUserHandler_(data) {
  const email = coerce_({ name: 'email', type: 'email', required: true }, data.email);
  const username = coerce_({ name: 'username', type: 'username', required: true }, data.username);
  const hash = coerce_({ name: 'password_hash', type: 'hash', required: !data.invite }, data.password_hash);
  const role = coerce_({ name: 'role', type: 'enum', values: ENUMS.USER_ROLES }, data.role || 'user');
  const errors = {};
  if (email.error) errors.email = [email.error];
  if (username.error) errors.username = [username.error];
  if (hash.error) errors.password = ['Invalid password hash'];
  if (role.error) errors.role = [role.error];
  if (Object.keys(errors).length) throw validationError_(errors);

  return withLock_(function () {
    if (findUserByEmail_(email.value)) {
      throw new ApiError('DUPLICATE', 'An account with this email already exists', { fields: { email: ['An account with this email already exists'] } });
    }
    assertUsernameAvailable_(username.value, null);
    const profileData = { username: username.value, full_name: data.full_name || '', email: email.value, site_url: data.site_url };
    buildProfileInput_({ username: username.value, email: email.value }, profileData); // validate before any write

    const hasAdmin = getRecords('USERS').some(function (u) { return u.role === 'admin'; });
    const user = createRecord('USERS', {
      email: email.value,
      username: username.value,
      status: 'active',
      role: hasAdmin ? role.value : 'admin', // first account owns the system
      password_hash: hash.value,
      session_version: 1,
    });
    const profile = createProfileFor_(user, profileData);
    return { message: 'Account created successfully', data: { user: user, profile: profile } };
  });
}

/**
 * Sign-in lookup — the ONLY action that returns password_hash.
 * data: { email* } → { user } (incl. password_hash, session_version, status)
 */
function getAuthUserHandler_(data) {
  const email = requireField_(data, 'email', 'Email');
  const user = findUserByEmail_(email);
  if (!user) throw notFound_('Account');
  return {
    message: 'Account found',
    data: {
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        status: user.status,
        password_hash: user.password_hash,
        session_version: user.session_version || 1,
      },
    },
  };
}

function recordLoginHandler_(data) {
  const user = requireActiveUser_(data.user_id);
  updateRecord('USERS', user.user_id, { last_login_at: new Date().toISOString() });
  return { message: 'Login recorded', data: {} };
}

/**
 * Validates a session cookie's claims and returns everything the dashboard needs.
 * data: { user_id*, session_version* } → { user, complete }
 */
function getSessionHandler_(data) {
  const user = getRecordById('USERS', String(data.user_id || ''));
  if (!user || user.status !== 'active' || Number(user.session_version || 1) !== Number(data.session_version)) {
    throw new ApiError('SESSION_INVALID', 'Your session has expired. Please sign in again.');
  }
  const key = 'cp:u:' + user.user_id + ':0';
  let complete = cacheGet_(key);
  if (!complete) {
    complete = buildCompleteProfile_(user.user_id, false);
    cachePut_(key, complete);
  }
  return { message: 'Session valid', data: { user: publicUser_(user), complete: complete } };
}

/** Sets a new password hash and signs out all other sessions. data: { user_id*, password_hash* } */
function changePasswordHandler_(data) {
  const user = requireActiveUser_(data.user_id);
  const hash = coerce_({ name: 'password_hash', type: 'hash', required: true }, data.password_hash);
  if (hash.error) throw validationError_({ password: ['Invalid password hash'] });
  const version = Number(user.session_version || 1) + 1;
  updateRecord('USERS', user.user_id, {
    password_hash: hash.value,
    session_version: version,
    reset_token_hash: '',
    reset_expires_at: '',
  });
  return { message: 'Password updated successfully', data: { session_version: version } };
}

/**
 * Stores the reset token's hash and emails the link (sent from the deploying
 * Google account via MailApp). Always reports success so callers can't probe
 * which emails have accounts.
 * data: { email*, token_hash*, expires_at*, reset_url* }
 */
function requestPasswordResetHandler_(data) {
  const ok = { message: 'If an account exists for that email, a reset link has been sent', data: { sent: true } };
  const email = coerce_({ name: 'email', type: 'email', required: true }, data.email);
  if (email.error) throw validationError_({ email: [email.error] });
  const token = coerce_({ name: 'token_hash', type: 'hash', required: true }, data.token_hash);
  const url = coerce_({ name: 'reset_url', type: 'url', required: true }, data.reset_url);
  const expires = parseDate_(data.expires_at);
  if (token.error || url.error || !expires) throw validationError_({ token_hash: ['Invalid reset request'] });
  if (expires.getTime() > Date.now() + 7 * 86400000) throw validationError_({ expires_at: ['Links can be valid for at most 7 days'] });

  const user = findUserByEmail_(email.value);
  if (!user || user.status !== 'active') return ok;

  updateRecord('USERS', user.user_id, { reset_token_hash: token.value, reset_expires_at: expires.toISOString() });
  const profile = getRecords('PROFILES', { user_id: user.user_id })[0];
  const name = (profile && profile.full_name) || user.username;
  const hours = Math.max(1, Math.round((expires.getTime() - Date.now()) / 3600000));
  const lifetime = hours >= 48 ? Math.round(hours / 24) + ' days' : hours + (hours === 1 ? ' hour' : ' hours');
  const invite = data.invite === true;
  const button = invite ? 'Set your password' : 'Choose a new password';
  MailApp.sendEmail({
    to: user.email,
    subject: invite ? 'You\'re invited to your digital business card' : 'Reset your password',
    name: APP.NAME,
    htmlBody:
      '<p>Hi ' + escapeHtml_(name) + ',</p>' +
      (invite
        ? '<p>An account was created for you. Set a password to open your dashboard and edit your digital card.</p>'
        : '<p>We received a request to reset the password for your digital card account.</p>') +
      '<p><a href="' + escapeHtml_(url.value) + '" style="display:inline-block;padding:10px 18px;background:#111827;color:#fff;border-radius:8px;text-decoration:none">' + button + '</a></p>' +
      '<p>This link expires in ' + lifetime + '.' + (invite ? '' : ' If you didn\'t request it, you can ignore this email.') + '</p>',
    body: button + ': ' + url.value + '\nThis link expires in ' + lifetime + '.',
  });
  return ok;
}

/** data: { token_hash*, password_hash* } → { user_id, session_version } */
function resetPasswordHandler_(data) {
  const token = coerce_({ name: 'token_hash', type: 'hash', required: true }, data.token_hash);
  const hash = coerce_({ name: 'password_hash', type: 'hash', required: true }, data.password_hash);
  if (token.error || hash.error) throw validationError_({ token: ['Invalid reset request'] });

  return withLock_(function () {
    const now = new Date();
    const user = getRecords('USERS').filter(function (u) {
      const exp = parseDate_(u.reset_expires_at);
      return u.reset_token_hash && safeEqual_(u.reset_token_hash, token.value) && exp && exp > now;
    })[0];
    if (!user) throw new ApiError('VALIDATION_ERROR', 'This reset link is invalid or has expired', { fields: { token: ['This reset link is invalid or has expired'] } });
    const version = Number(user.session_version || 1) + 1;
    updateRecord('USERS', user.user_id, {
      password_hash: hash.value,
      session_version: version,
      reset_token_hash: '',
      reset_expires_at: '',
    });
    return { message: 'Password reset successfully', data: { user_id: user.user_id, session_version: version } };
  });
}

/** Connection details for the dashboard's "Google Sheet" page. */
function getSystemInfoHandler_() {
  const ss = getSpreadsheet_();
  return {
    message: 'System info',
    data: {
      name: APP.NAME,
      version: APP.VERSION,
      spreadsheet_name: ss.getName(),
      spreadsheet_url: ss.getUrl(),
      timezone: tz_(),
      sheets: Object.keys(SCHEMA).map(function (k) { return SCHEMA[k].sheet; }),
    },
  };
}

function escapeHtml_(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}
