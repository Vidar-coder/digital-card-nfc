/**
 * ============================================================================
 *  Users.gs — 01_Users: accounts. Passwords are never stored in plain text.
 * ============================================================================
 *  Sign-in actions (register, login lookup, sessions, password reset) are in
 *  Auth.gs. Every user-returning action here strips secret columns.
 */

function userActions_() {
  return {
    getUser: { write: false, handler: getUserHandler_ },
    updateUser: { write: true, handler: updateUserHandler_ },
    checkUsername: { write: false, handler: checkUsernameHandler_ },
  };
}

/* ------------------------------- lookups -------------------------------- */

function publicUser_(user) {
  return withoutSecrets_('USERS', user);
}

function requireUser_(userId) {
  const id = requireField_({ user_id: userId }, 'user_id', 'user_id');
  const user = getRecordById('USERS', id);
  if (!user) throw notFound_('User ' + id);
  return user;
}

function requireActiveUser_(userId) {
  const user = requireUser_(userId);
  if (user.status !== 'active') throw forbidden_('This account is suspended');
  return user;
}

function findUserByEmail_(email) {
  return getRecords('USERS', { email: String(email || '').trim().toLowerCase() })[0] || null;
}

function getProfileByUsername(username) {
  return getRecords('PROFILES', { username: String(username || '').trim().toLowerCase() })[0] || null;
}

/** Resolves { user_id } or { username } to a user_id. */
function resolveUserId_(data) {
  if (data.user_id) return requireUser_(data.user_id).user_id;
  if (data.username) {
    const p = getProfileByUsername(data.username);
    if (!p) throw notFound_('Profile "' + String(data.username).slice(0, 40) + '"');
    return p.user_id;
  }
  throw validationError_({ user_id: ['user_id or username is required'] }, 'user_id or username is required');
}

/** True when the username is used by any OTHER user (users or profiles sheet). */
function isUsernameTaken_(username, exceptUserId) {
  const u = String(username).toLowerCase();
  const clash = function (r) { return String(r.username).toLowerCase() === u && r.user_id !== exceptUserId; };
  return getRecords('USERS').some(clash) || getRecords('PROFILES').some(clash);
}

function assertUsernameAvailable_(username, exceptUserId) {
  if (isUsernameTaken_(username, exceptUserId)) {
    throw new ApiError('DUPLICATE', 'That username is already taken', { fields: { username: ['Username is already taken'] } });
  }
}

/* ------------------------------- handlers ------------------------------- */

function getUserHandler_(data) {
  let user = null;
  if (data.user_id) user = getRecordById('USERS', String(data.user_id));
  else if (data.email) user = findUserByEmail_(data.email);
  else if (data.username) user = getRecords('USERS', { username: String(data.username).toLowerCase() })[0] || null;
  else throw validationError_({ user_id: ['Provide user_id, email or username'] });
  if (!user) throw notFound_('User');
  return { message: 'User retrieved', data: { user: publicUser_(user) } };
}

/**
 * data: { user_id*, email?, status?, role? } — username changes go through updateProfile,
 * passwords through Auth.gs. Suspending a user also signs them out everywhere.
 */
function updateUserHandler_(data) {
  const user = requireUser_(data.user_id);
  const patch = {};
  if (data.email !== undefined) patch.email = data.email;
  if (data.status !== undefined) patch.status = data.status;
  if (data.role !== undefined) patch.role = data.role;
  return withLock_(function () {
    assertKeepsAnAdmin_(user.user_id, patch);
    if (patch.status === 'suspended' && user.status !== 'suspended') {
      patch.session_version = Number(user.session_version || 1) + 1;
    }
    const updated = updateRecord('USERS', user.user_id, patch);
    return { message: 'User updated successfully', data: { user: updated } };
  });
}

/** data: { username*, user_id? } → { available, reason } */
function checkUsernameHandler_(data) {
  const res = coerce_({ name: 'username', type: 'username', required: true }, data.username);
  if (res.error) return { message: res.error, data: { available: false, reason: res.error } };
  const taken = isUsernameTaken_(res.value, data.user_id || null);
  return {
    message: taken ? 'Username is already taken' : 'Username is available',
    data: { username: res.value, available: !taken, reason: taken ? 'Username is already taken' : null },
  };
}
