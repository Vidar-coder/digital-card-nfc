/**
 * ============================================================================
 *  Tests.gs — optional end-to-end self test. Run selfTest() from the editor
 *  after setupDatabase(). It goes through the real API router (handleRequest_)
 *  with a throwaway user, checks every section, then deletes everything it made.
 * ============================================================================
 */
function selfTest() {
  const key = PropertiesService.getScriptProperties().getProperty(APP.PROP_API_KEY);
  const call = function (action, data) {
    const out = handleRequest_({ postData: { contents: JSON.stringify({ action: action, apiKey: key, data: data || {} }) }, parameter: {} }, 'POST');
    TABLE_MEMO_ = {};
    return JSON.parse(out.getContent());
  };
  const assert = function (cond, msg) {
    if (!cond) throw new Error('❌ ' + msg);
    Logger.log('✅ ' + msg);
  };

  const stamp = String(Date.now()).slice(-6);
  const username = 'selftest-' + stamp;
  let userId = null;
  let authUserId = null;
  let secondUserId = null;

  try {
    assert(call('getProfile', {}).error.code === 'VALIDATION_ERROR', 'missing params → validation error');
    assert(JSON.parse(handleRequest_({ postData: { contents: JSON.stringify({ action: 'getProfile', apiKey: 'wrong' }) } }, 'POST').getContent()).error.code === 'UNAUTHORIZED', 'wrong API key rejected');
    assert(call('dropTables').error.code === 'UNKNOWN_ACTION', 'unknown action rejected');

    const created = call('createProfile', {
      email: username + '@example.com',
      username: username,
      full_name: 'Self Test',
      professional_title: 'Tester',
      phone: '+63 917 555 0142',
      site_url: 'https://example.com',
    });
    assert(created.success, 'createProfile');
    userId = created.data.user_id;

    assert(call('createProfile', { email: 'x' + username + '@example.com', username: username }).error.code === 'DUPLICATE', 'duplicate username rejected');
    const bad = call('createProfile', { email: 'bad-' + username + '@example.com', username: 'bad-' + stamp, website: 'not a url' });
    assert(bad.error.code === 'VALIDATION_ERROR' && !call('getUser', { email: 'bad-' + username + '@example.com' }).success, 'invalid profile creates no orphan user');
    assert(call('updateProfile', { user_id: userId, website: 'http://localhost:3000/p/x' }).success, 'localhost URLs accepted (local development)');
    assert(call('updateProfile', { user_id: userId, email: 'not-an-email' }).error.code === 'VALIDATION_ERROR', 'invalid email rejected');
    assert(call('updateProfile', { user_id: userId, company: '=HYPERLINK("http://evil")', bio: 'Hello' }).success, 'partial updateProfile');

    const sync = call('syncExperience', {
      user_id: userId,
      items: [
        { company: 'Acme', position: 'Analyst', start_date: '2024-06', end_date: '' , is_current: true },
        { company: 'Beta', position: 'Intern', start_date: '2023-01', end_date: '2023-06' },
      ],
    });
    assert(sync.success && sync.data.items.length === 2, 'syncExperience creates 2 rows');
    const first = sync.data.items[0];
    const resync = call('syncExperience', { user_id: userId, items: [Object.assign({}, first, { position: 'Senior Analyst' })] });
    assert(resync.data.items.length === 1 && resync.data.items[0].experience_id === first.experience_id, 'sync keeps IDs and deletes removed rows');

    assert(call('createProject', { user_id: userId, project_title: 'Demo', technologies: ['Next.js', 'Sheets'], project_url: 'example.com' }).success, 'createProject');
    assert(call('syncSkills', { user_id: userId, items: [{ skill_name: 'SQL' }, { skill_name: 'Python' }] }).data.items.length === 2, 'syncSkills');
    assert(call('updateTheme', { user_id: userId, theme_name: 'dark', primary_color: '#112233' }).success, 'updateTheme');
    assert(call('updateTheme', { user_id: userId, primary_color: 'red' }).error.code === 'VALIDATION_ERROR', 'invalid color rejected');
    assert(call('updateSetting', { user_id: userId, setting_name: 'show_analytics', setting_value: 'true' }).success, 'updateSetting');
    assert(call('recordAnalyticsEvent', { username: username, event_type: 'profile_view', event_value: 'nfc' }).success, 'recordAnalyticsEvent');

    const complete = call('getCompleteProfile', { username: username, public: true });
    assert(complete.success && complete.data.profile.company.indexOf('=') === 0, 'formula stored as text, not executed');
    assert(complete.data.experience[0].position === 'Senior Analyst', 'getCompleteProfile returns fresh data');
    assert(complete.data.profile.phone === '+63 917 555 0142', 'phone kept as text (not coerced to a number)');
    assert(complete.data.experience[0].start_date === '2024-06', 'YYYY-MM kept as text (not coerced to a date)');
    assert(complete.data.projects[0].technologies.join('|') === 'Next.js|Sheets', 'list column round-trips');
    assert(complete.data.contactActions.length >= 2, 'contact actions derived from phone');
    assert(complete.data.qrNfc.nfc_url === 'https://example.com/p/' + username + '?src=nfc', 'QR/NFC URLs generated');
    assert(!complete.data.settings, 'public view hides settings');

    const analytics = call('getAnalytics', { user_id: userId, days: 7 });
    assert(analytics.data.totals.profile_view === 1, 'getAnalytics counts events');

    // --- authentication (hashes only; the Next.js server does the hashing) ---
    const fakeHash = 'scrypt$16384$8$1$' + Utilities.base64Encode(Utilities.getUuid()) + '$' + Utilities.base64Encode(Utilities.getUuid() + Utilities.getUuid());
    const authEmail = 'auth-' + username + '@example.com';
    const reg = call('registerUser', { email: authEmail, username: 'auth-' + stamp, password_hash: fakeHash, full_name: 'Auth Test', site_url: 'https://example.com' });
    authUserId = reg.data && reg.data.user.user_id;
    assert(reg.success && reg.data.profile.username === 'auth-' + stamp, 'registerUser creates user + profile');
    assert(reg.data.user.password_hash === undefined, 'registerUser response never includes the password hash');
    assert(call('registerUser', { email: authEmail, username: 'other-' + stamp, password_hash: fakeHash }).error.code === 'DUPLICATE', 'duplicate email rejected');
    assert(call('registerUser', { email: 'x2' + authEmail, username: 'x2-' + stamp, password_hash: 'plaintext-password' }).error.code === 'VALIDATION_ERROR', 'plain-text password rejected (hash required)');

    const au = call('getAuthUser', { email: authEmail });
    assert(au.data.user.password_hash === fakeHash && au.data.user.session_version === 1, 'getAuthUser returns hash + session version');
    assert(call('getUser', { email: authEmail }).data.user.password_hash === undefined, 'getUser never returns the hash');

    const s1 = call('getSession', { user_id: authUserId, session_version: 1 });
    assert(s1.success && s1.data.complete.profile.username === 'auth-' + stamp && s1.data.user.password_hash === undefined, 'getSession returns dashboard data without secrets');
    const cp = call('changePassword', { user_id: authUserId, password_hash: fakeHash.replace('scrypt$16384', 'scrypt$32768') });
    assert(cp.data.session_version === 2, 'changePassword bumps session version');
    assert(call('getSession', { user_id: authUserId, session_version: 1 }).error.code === 'SESSION_INVALID', 'old sessions are revoked after password change');

    const tokenHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'token-' + stamp)
      .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
    const rq = call('requestPasswordReset', { email: authEmail, token_hash: tokenHash, expires_at: new Date(Date.now() + 3600000).toISOString(), reset_url: 'https://example.com/reset-password?token=abc' });
    assert(rq.success && call('requestPasswordReset', { email: 'nobody-' + authEmail, token_hash: tokenHash, expires_at: new Date().toISOString(), reset_url: 'https://example.com/r' }).success, 'reset request responds the same for unknown emails');
    const rs = call('resetPassword', { token_hash: tokenHash, password_hash: fakeHash });
    assert(rs.success && rs.data.session_version === 3, 'resetPassword with a valid token');
    assert(call('resetPassword', { token_hash: tokenHash, password_hash: fakeHash }).error.code === 'VALIDATION_ERROR', 'reset token is single-use');
    assert(call('getSystemInfo').data.spreadsheet_url.indexOf('https://') === 0, 'getSystemInfo returns the spreadsheet link');
    // --- multi-user: roles & admin management ---
    const hadAdmin = getRecords('USERS').some(function (u) { return u.role === 'admin' && u.user_id !== authUserId; });
    const secondEmail = 'second-' + username + '@example.com';
    const second = call('registerUser', { email: secondEmail, username: 'second-' + stamp, invite: true, role: 'user' });
    secondUserId = second.data && second.data.user.user_id;
    assert(second.success && second.data.user.role === 'user', 'admin-created user (invite, no password) has role "user"');
    if (!hadAdmin) assert(reg.data.user.role === 'admin', 'first account on an empty database becomes admin');

    const list = call('listUsers');
    const listed = list.data.users.filter(function (u) { return u.user_id === secondUserId; })[0];
    assert(list.success && listed && listed.has_password === false && listed.password_hash === undefined, 'listUsers returns accounts without secrets');

    assert(call('updateUser', { user_id: secondUserId, status: 'suspended' }).success, 'suspend a user');
    assert(call('getSession', { user_id: secondUserId, session_version: 1 }).error.code === 'SESSION_INVALID', 'suspended user is signed out');
    assert(call('updateSkill', { user_id: secondUserId, skill_id: 'SKL-999999', skill_name: 'x' }).error.code === 'FORBIDDEN', 'suspended user cannot write');
    assert(call('syncSkills', { user_id: secondUserId, items: [] }).error.code === 'FORBIDDEN', 'suspended user cannot save sections');

    if (!hadAdmin) {
      assert(call('updateUser', { user_id: authUserId, role: 'user' }).error.code === 'FORBIDDEN', 'cannot demote the only admin');
      assert(call('deleteProfile', { user_id: authUserId }).error.code === 'FORBIDDEN', 'cannot delete the only admin');
    }
    const theirSkill = call('createSkill', { user_id: userId, skill_name: 'Owned by first user' }).data.skill_id;
    assert(call('updateSkill', { user_id: authUserId, skill_id: theirSkill, skill_name: 'hijack' }).error.code === 'FORBIDDEN', "a user cannot edit another user's rows");
  } finally {
    // Internal purge (bypasses the last-admin guard so test accounts never linger).
    [secondUserId, authUserId, userId].forEach(function (id) {
      if (id) purgeUser_(id, { deleteUser: true, deleteAnalytics: true });
    });
    TABLE_MEMO_ = {};
    const left = getRecords('USERS').filter(function (u) { return /^(selftest|auth|second)-/.test(u.username); }).length;
    Logger.log(left === 0 ? '🧹 cleaned up all test accounts' : '⚠️ cleanup left ' + left + ' test accounts');
  }
}
