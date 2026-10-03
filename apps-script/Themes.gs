/** Themes.gs — 10_Themes (one theme row per user). */
function themeActions_() {
  return {
    getTheme: {
      write: false,
      handler: function (data) {
        const userId = resolveUserId_(data);
        const theme = getRecords('THEMES', { user_id: userId })[0] || defaultTheme_(userId);
        return { message: 'Theme retrieved', data: { theme: theme } };
      },
    },
    /** Upsert. data: { user_id*, theme_name?, primary_color?, … } — partial updates allowed. */
    updateTheme: {
      write: true,
      handler: function (data) {
        const userId = requireActiveUser_(data.user_id).user_id;
        return withLock_(function () {
          const fields = Object.assign({}, data);
          delete fields.theme_id;
          delete fields.user_id;
          const existing = getRecords('THEMES', { user_id: userId })[0];
          const theme = existing
            ? updateRecord('THEMES', existing.theme_id, fields, { userId: userId })
            : createRecord('THEMES', Object.assign(fields, { user_id: userId }));
          return { message: 'Theme updated successfully', data: { theme: theme } };
        });
      },
    },
  };
}

/** Schema defaults (not persisted) for users without a theme row. */
function defaultTheme_(userId) {
  const t = { theme_id: null, user_id: userId };
  SCHEMA.THEMES.columns.forEach(function (col) {
    if (col.def !== undefined) t[col.name] = col.def;
  });
  return t;
}
