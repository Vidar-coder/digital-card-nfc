/**
 * QrNfc.gs — 11_QR_NFC. Kept in sync automatically when a profile is created
 * or its username changes (needs site_url from the request or setSiteUrl()).
 */
function qrNfcActions_() {
  return {
    getQrNfc: {
      write: false,
      handler: function (data) {
        const userId = resolveUserId_(data);
        return { message: 'QR/NFC settings retrieved', data: { qrNfc: getRecords('QR_NFC', { user_id: userId })[0] || null } };
      },
    },
    /** data: { user_id*, site_url? } or explicit { profile_url?, qr_code_url?, nfc_url? } */
    updateQrNfc: {
      write: true,
      handler: function (data) {
        const userId = requireActiveUser_(data.user_id).user_id;
        return withLock_(function () {
          const profile = getRecords('PROFILES', { user_id: userId })[0];
          if (!profile) throw notFound_('Profile');
          let record;
          if (data.profile_url || data.qr_code_url || data.nfc_url) {
            record = upsertQrNfcFields_(userId, {
              profile_url: data.profile_url,
              qr_code_url: data.qr_code_url,
              nfc_url: data.nfc_url,
            });
          } else {
            const site = siteUrl_(data.site_url);
            if (!site) throw validationError_({ site_url: ['site_url is required (or call setSiteUrl() once)'] });
            record = upsertQrNfc_(userId, profile.username, site);
          }
          return { message: 'QR/NFC settings updated successfully', data: { qrNfc: record } };
        });
      },
    },
  };
}

/** Builds the canonical URLs: the same profile URL with ?src=qr / ?src=nfc for attribution. */
function upsertQrNfc_(userId, username, site) {
  if (!site) return null;
  const base = site + '/p/' + username;
  return upsertQrNfcFields_(userId, { profile_url: base, qr_code_url: base + '?src=qr', nfc_url: base + '?src=nfc' });
}

function upsertQrNfcFields_(userId, fields) {
  const clean = {};
  Object.keys(fields).forEach(function (k) { if (fields[k] !== undefined) clean[k] = fields[k]; });
  const existing = getRecords('QR_NFC', { user_id: userId })[0];
  return existing
    ? updateRecord('QR_NFC', existing.qr_nfc_id, clean, { userId: userId })
    : createRecord('QR_NFC', Object.assign(clean, { user_id: userId }));
}
