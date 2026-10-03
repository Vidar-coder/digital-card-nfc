/**
 * ============================================================================
 *  Profile.gs — 02_Profiles + the aggregate getCompleteProfile.
 * ============================================================================
 */

function profileActions_() {
  return {
    createProfile: { write: true, handler: createProfileHandler_ },
    getProfile: { write: false, handler: getProfileHandler_ },
    getProfileByUsername: { write: false, handler: getProfileHandler_ },
    updateProfile: { write: true, handler: updateProfileHandler_ },
    deleteProfile: { write: true, handler: deleteProfileHandler_ },
    getCompleteProfile: { write: false, handler: getCompleteProfileHandler_ },
  };
}

const CONTACT_FIELDS_ = ['phone', 'email', 'website', 'address', 'location'];

/**
 * Validates the profile that would be created for a user — call BEFORE writing
 * the user row so a bad request never leaves a user without a profile
 * (Sheets has no transactions).
 */
function buildProfileInput_(user, data) {
  const username = String(data.username || user.username).toLowerCase();
  const site = siteUrl_(data.site_url);
  const input = Object.assign({}, data, {
    user_id: user.user_id || 'PENDING',
    username: username,
    email: data.email !== undefined ? data.email : user.email,
  });
  delete input.profile_id;
  if (site) input.profile_url = site + '/p/' + username;
  return validateRecord_('PROFILES', input);
}

/** Creates profile + default theme + QR/NFC + contact actions for a user. */
function createProfileFor_(user, data) {
  return withLock_(function () {
    const input = buildProfileInput_(user, data);
    input.user_id = user.user_id;
    const username = input.username;
    assertUsernameAvailable_(username, user.user_id);
    const site = siteUrl_(data.site_url);
    const profile = createRecord('PROFILES', input, { validated: true });

    if (username !== user.username) updateRecord('USERS', user.user_id, { username: username });
    if (!getRecords('THEMES', { user_id: user.user_id }).length) {
      createRecord('THEMES', Object.assign({}, data.theme || {}, { user_id: user.user_id }));
    }
    upsertQrNfc_(user.user_id, username, site);
    syncContactActionsFromProfile_(user.user_id, profile);
    return profile;
  });
}

/**
 * data: { user_id | email*, username*, full_name?, professional_title?, …, site_url? }
 * Creates the user too when only an email is given.
 */
function createProfileHandler_(data) {
  return withLock_(function () {
    let user;
    if (data.user_id) {
      user = requireActiveUser_(data.user_id);
    } else {
      const email = coerce_({ name: 'email', type: 'email', required: true }, data.email);
      if (email.error) throw validationError_({ email: [email.error] });
      user = getRecords('USERS', { email: email.value })[0] || null;
      if (!user) {
        const uname = coerce_({ name: 'username', type: 'username', required: true }, data.username);
        if (uname.error) throw validationError_({ username: [uname.error] });
        assertUsernameAvailable_(uname.value, null);
        buildProfileInput_({ username: uname.value, email: email.value }, data); // validate before any write
        user = createRecord('USERS', { email: email.value, username: uname.value, status: 'active' }); // no password: set via reset
      }
    }
    if (getRecords('PROFILES', { user_id: user.user_id }).length) {
      throw new ApiError('DUPLICATE', 'This user already has a profile. Use updateProfile.');
    }
    const profile = createProfileFor_(user, data);
    return {
      message: 'Profile created successfully',
      data: { profile_id: profile.profile_id, user_id: user.user_id, profile: profile },
    };
  });
}

/** data: { user_id | username | profile_id, public? } */
function getProfileHandler_(data) {
  let profile = null;
  if (data.profile_id) profile = getRecordById('PROFILES', String(data.profile_id));
  else if (data.username) profile = getProfileByUsername(data.username);
  else if (data.user_id) profile = getRecords('PROFILES', { user_id: String(data.user_id) })[0] || null;
  else throw validationError_({ username: ['Provide user_id, username or profile_id'] });
  if (!profile || (isPublic_(data) && profile.status !== 'published')) throw notFound_('Profile');
  return { message: 'Profile retrieved', data: { profile: profile } };
}

/**
 * Partial update — send only the fields the dashboard section edited.
 * data: { user_id*, ...profile fields, site_url? }
 */
function updateProfileHandler_(data) {
  const user = requireActiveUser_(data.user_id);
  return withLock_(function () {
    const profile = getRecords('PROFILES', { user_id: user.user_id })[0];
    if (!profile) throw notFound_('Profile');

    const fields = Object.assign({}, data);
    ['user_id', 'profile_id', 'site_url', 'created_at', 'updated_at'].forEach(function (k) { delete fields[k]; });

    let username = profile.username;
    const renaming = fields.username !== undefined && String(fields.username).toLowerCase() !== profile.username;
    if (renaming) {
      const res = coerce_({ name: 'username', type: 'username', required: true }, fields.username);
      if (res.error) throw validationError_({ username: [res.error] });
      assertUsernameAvailable_(res.value, user.user_id);
      invalidateUserCache_(user.user_id); // drop cache under the OLD username
      username = res.value;
    }

    const site = siteUrl_(data.site_url);
    if (site && (renaming || data.site_url)) fields.profile_url = site + '/p/' + username;

    const updated = updateRecord('PROFILES', profile.profile_id, fields, { userId: user.user_id });
    if (renaming) updateRecord('USERS', user.user_id, { username: username });
    if (renaming || data.site_url) upsertQrNfc_(user.user_id, username, site);
    if (CONTACT_FIELDS_.some(function (f) { return fields[f] !== undefined; })) {
      syncContactActionsFromProfile_(user.user_id, updated);
    }
    return { message: 'Profile updated successfully', data: { profile: updated } };
  });
}

/**
 * Deletes a profile and all of its dashboard content.
 * data: { user_id*, delete_user? (default true), delete_analytics? (default false) }
 */
function deleteProfileHandler_(data) {
  const user = requireUser_(data.user_id);
  return withLock_(function () {
    if (data.delete_user !== false) assertKeepsAnAdmin_(user.user_id, { deleted: true });
    const deleted = purgeUser_(user.user_id, { deleteUser: data.delete_user !== false, deleteAnalytics: data.delete_analytics === true });
    return { message: 'Profile deleted successfully', data: { user_id: user.user_id, deleted: deleted } };
  });
}

/** Internal cascade delete (no admin guard). Used by deleteProfile and by selfTest cleanup. */
function purgeUser_(userId, opts) {
  return withLock_(function () {
    invalidateUserCache_(userId);
    const deleted = {};
    USER_CONTENT_TABLES.forEach(function (key) {
      deleted[SCHEMA[key].sheet] = deleteWhere_(key, function (r) { return r.user_id === userId; });
    });
    if (opts.deleteAnalytics) {
      deleted[SHEETS.ANALYTICS] = deleteWhere_('ANALYTICS', function (r) { return r.user_id === userId; });
    }
    if (opts.deleteUser) {
      deleted[SHEETS.USERS] = deleteWhere_('USERS', function (r) { return r.user_id === userId; });
    }
    return deleted;
  });
}

/* --------------------------- complete profile --------------------------- */

function isPublic_(data) {
  return data.public === true || data.public === 'true';
}

/**
 * Everything belonging to one user in one response.
 * data: { user_id | username, public? }
 *   public=true → only published profiles of active users; hidden items and
 *                 private data (user record, settings) are excluded. Cached.
 */
function getCompleteProfileHandler_(data) {
  const pub = isPublic_(data);
  const cacheKey = data.user_id ? 'cp:u:' + data.user_id + ':' + (pub ? 1 : 0) : 'cp:n:' + String(data.username || '').toLowerCase() + ':' + (pub ? 1 : 0);
  const cached = cacheGet_(cacheKey);
  if (cached) return { message: 'Profile retrieved', data: cached };

  const userId = resolveUserId_(data);
  const result = buildCompleteProfile_(userId, pub);
  cachePut_(cacheKey, result);
  return { message: 'Profile retrieved', data: result };
}

function buildCompleteProfile_(userId, pub) {
  const user = requireUser_(userId);
  const profile = getRecords('PROFILES', { user_id: userId })[0];
  if (!profile) throw notFound_('Profile');
  if (pub && (profile.status !== 'published' || user.status !== 'active')) throw notFound_('Profile');

  const visible = function (items) {
    return pub ? items.filter(function (r) { return r.is_visible !== false; }) : items;
  };

  const result = {
    profile: profile,
    socialLinks: visible(getUserRecords(userId, 'SOCIAL_LINKS')),
    experience: getUserRecords(userId, 'EXPERIENCE'),
    education: getUserRecords(userId, 'EDUCATION'),
    certifications: getUserRecords(userId, 'CERTIFICATIONS'),
    skills: getUserRecords(userId, 'SKILLS'),
    services: visible(getUserRecords(userId, 'SERVICES')),
    projects: visible(getUserRecords(userId, 'PROJECTS')),
    contactActions: visible(getUserRecords(userId, 'CONTACT_ACTIONS')),
    theme: getRecords('THEMES', { user_id: userId })[0] || defaultTheme_(userId),
    qrNfc: getRecords('QR_NFC', { user_id: userId })[0] || null,
  };
  if (!pub) {
    result.user = publicUser_(user);
    result.settings = settingsMap_(userId);
  }
  return result;
}
