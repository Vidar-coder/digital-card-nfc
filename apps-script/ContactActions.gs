/**
 * ContactActions.gs — 09_Contact_Actions.
 * Rows are derived automatically from the profile's contact fields whenever the
 * profile is created/updated (phone → phone + sms, email, website, location).
 * Label, order and visibility edited in the sheet (or via the API) are preserved.
 */
function contactActionActions_() {
  return sectionActions_('CONTACT_ACTIONS', {
    create: 'createContactAction',
    get: 'getContactActions',
    update: 'updateContactAction',
    delete: 'deleteContactAction',
    sync: 'syncContactActions',
  }, 'Contact action');
}

const CONTACT_DEFAULTS_ = [
  { type: 'phone', field: 'phone', label: 'Call Me' },
  { type: 'sms', field: 'phone', label: 'Message Me' },
  { type: 'email', field: 'email', label: 'Email' },
  { type: 'website', field: 'website', label: 'Website' },
  { type: 'location', field: 'location', label: 'Location' },
];

/** Upserts the standard contact actions from a profile record. */
function syncContactActionsFromProfile_(userId, profile) {
  withLock_(function () {
    const existing = getUserRecords(userId, 'CONTACT_ACTIONS');
    const byType = {};
    existing.forEach(function (r) { if (!byType[r.action_type]) byType[r.action_type] = r; });

    CONTACT_DEFAULTS_.forEach(function (def, i) {
      const value = def.type === 'location' ? profile.address || profile.location : profile[def.field];
      const row = byType[def.type];
      if (!value) {
        if (row) deleteRecord('CONTACT_ACTIONS', row.contact_id);
        return;
      }
      if (row) {
        if (row.action_value !== value) updateRecord('CONTACT_ACTIONS', row.contact_id, { action_value: value });
      } else {
        createRecord('CONTACT_ACTIONS', {
          user_id: userId,
          action_type: def.type,
          action_value: value,
          label: def.label,
          display_order: i,
          is_visible: true,
        });
      }
    });
  });
}
