/**
 * ============================================================================
 *  Admin.gs — user management for the dashboard's "Users" page.
 * ============================================================================
 *  Every user has their own dashboard and can only modify their own rows
 *  (all section writes are checked against user_id). Admins additionally
 *  manage accounts. The Next.js server verifies the caller is an admin before
 *  calling these actions; the API key keeps them server-to-server only.
 */

function adminActions_() {
  return {
    listUsers: { write: false, handler: listUsersHandler_ },
  };
}

/** All accounts with their profile summary (no secrets). */
function listUsersHandler_() {
  const profiles = {};
  getRecords('PROFILES').forEach(function (p) { profiles[p.user_id] = p; });
  const users = getRecords('USERS', {}, { sort: 'created_at' }).map(function (u) {
    const p = profiles[u.user_id];
    return Object.assign(publicUser_(u), {
      role: u.role || 'user',
      has_password: Boolean(u.password_hash),
      full_name: p ? p.full_name : '',
      profile_status: p ? p.status : '',
      profile_url: p ? p.profile_url : '',
      professional_title: p ? p.professional_title : '',
    });
  });
  return { message: 'Users retrieved', data: { users: users, count: users.length } };
}

function activeAdminIds_() {
  return getRecords('USERS')
    .filter(function (u) { return u.role === 'admin' && u.status === 'active'; })
    .map(function (u) { return u.user_id; });
}

/** Throws if the change would leave the system with no active admin. */
function assertKeepsAnAdmin_(userId, next) {
  const admins = activeAdminIds_();
  if (admins.length !== 1 || admins[0] !== userId) return;
  const demoted = next.role !== undefined && next.role !== 'admin';
  const suspended = next.status !== undefined && next.status !== 'active';
  if (next.deleted || demoted || suspended) {
    throw new ApiError('FORBIDDEN', 'This is the only admin account. Make another user an admin first.');
  }
}

/**
 * Recovery helper — run from the Apps Script editor if you ever lock yourself out:
 *   makeAdmin('you@example.com')
 */
function makeAdmin(email) {
  const user = findUserByEmail_(email);
  if (!user) throw new Error('No user with email ' + email);
  updateRecord('USERS', user.user_id, { role: 'admin', status: 'active' });
  Logger.log(email + ' is now an admin');
}
