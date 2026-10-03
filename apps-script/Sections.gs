/**
 * ============================================================================
 *  Sections.gs — generic CRUD actions for user-owned, ordered list sections.
 * ============================================================================
 *  sectionActions_() turns one table into five API actions:
 *    create<One>   { user_id, ...fields }                  → { <id_field>, record }
 *    get<Many>     { user_id | username, public? }         → { items }
 *    update<One>   { user_id, <id_field> | id, ...fields } → { record }
 *    delete<One>   { user_id, <id_field> | id }            → { deleted: id }
 *    sync<Many>    { user_id, items: [...] }               → { items }   (dashboard "Save")
 *
 *  Every write requires user_id and verifies the row belongs to that user, so
 *  one user can never modify another user's records.
 */

function sectionActions_(tableKey, names, label) {
  const schema = SCHEMA[tableKey];
  const idOf = function (data) {
    return requireField_({ v: data[schema.idField] || data.id }, 'v', schema.idField);
  };
  const out = {};

  out[names.create] = {
    write: true,
    handler: function (data) {
      const userId = requireActiveUser_(data.user_id).user_id;
      return withLock_(function () {
        const input = Object.assign({}, data, { user_id: userId });
        if (schema.ordered && (input.display_order === undefined || input.display_order === '')) {
          input.display_order = getUserRecords(userId, tableKey).length;
        }
        const record = createRecord(tableKey, input);
        const payload = { record: record };
        payload[schema.idField] = record[schema.idField];
        return { message: label + ' created successfully', data: payload };
      });
    },
  };

  out[names.get] = {
    write: false,
    handler: function (data) {
      const userId = resolveUserId_(data);
      let items = getUserRecords(userId, tableKey);
      if (data.public === true || data.public === 'true') {
        items = items.filter(function (r) { return r.is_visible !== false; });
      }
      return { message: label + ' records retrieved', data: { items: items, count: items.length } };
    },
  };

  out[names.update] = {
    write: true,
    handler: function (data) {
      const userId = requireActiveUser_(data.user_id).user_id;
      const id = idOf(data);
      const fields = Object.assign({}, data);
      delete fields[schema.idField];
      delete fields.id;
      delete fields.user_id;
      const record = updateRecord(tableKey, id, fields, { userId: userId });
      return { message: label + ' updated successfully', data: { record: record } };
    },
  };

  out[names.delete] = {
    write: true,
    handler: function (data) {
      const userId = requireActiveUser_(data.user_id).user_id;
      const id = idOf(data);
      deleteRecord(tableKey, id, { userId: userId });
      return { message: label + ' deleted successfully', data: { deleted: id } };
    },
  };

  if (names.sync) {
    out[names.sync] = {
      write: true,
      handler: function (data) {
        const userId = requireActiveUser_(data.user_id).user_id;
        const items = syncRecords(tableKey, userId, data.items);
        return { message: label + ' saved successfully', data: { items: items, count: items.length } };
      },
    };
  }
  return out;
}
