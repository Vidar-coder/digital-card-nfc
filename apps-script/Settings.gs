/** Settings.gs — 13_Settings (key/value per user). */
function settingsActions_() {
  return {
    getSettings: {
      write: false,
      handler: function (data) {
        const userId = resolveUserId_(data);
        return {
          message: 'Settings retrieved',
          data: { settings: settingsMap_(userId), items: getUserRecords(userId, 'SETTINGS') },
        };
      },
    },
    /**
     * Upsert one setting: { user_id*, setting_name*, setting_value }
     * or several at once: { user_id*, settings: { name: value, … } }
     */
    updateSetting: {
      write: true,
      handler: function (data) {
        const userId = requireActiveUser_(data.user_id).user_id;
        const pairs = {};
        if (data.settings && typeof data.settings === 'object') {
          Object.keys(data.settings).forEach(function (k) { pairs[k] = data.settings[k]; });
        } else {
          pairs[requireField_(data, 'setting_name', 'setting_name')] = data.setting_value;
        }
        if (Object.keys(pairs).length > 50) throw validationError_({ settings: ['At most 50 settings per request'] });

        return withLock_(function () {
          const existing = getUserRecords(userId, 'SETTINGS');
          Object.keys(pairs).forEach(function (name) {
            const value = typeof pairs[name] === 'object' && pairs[name] !== null ? JSON.stringify(pairs[name]) : pairs[name];
            const row = existing.filter(function (r) { return r.setting_name === name; })[0];
            if (row) updateRecord('SETTINGS', row.setting_id, { setting_value: value }, { userId: userId });
            else createRecord('SETTINGS', { user_id: userId, setting_name: name, setting_value: value });
          });
          return { message: 'Settings updated successfully', data: { settings: settingsMap_(userId) } };
        });
      },
    },
  };
}

function settingsMap_(userId) {
  const map = {};
  getUserRecords(userId, 'SETTINGS').forEach(function (r) { map[r.setting_name] = r.setting_value; });
  return map;
}
