/**
 * ============================================================================
 *  Media.gs — image uploads to Google Drive (profile photo, cover, projects).
 * ============================================================================
 *  Google Sheets cells hold at most 50,000 characters, so images are stored in
 *  Drive ("NFC Card Media/<user_id>/<folder>/") and only the URL goes into the
 *  sheet. Files are shared "anyone with the link: viewer" so the public card
 *  can display them. In Google Workspace domains that block public sharing,
 *  use another storage (e.g. Supabase Storage) and send URLs instead.
 */

function mediaActions_() {
  return {
    uploadImage: { write: true, handler: uploadImageHandler_ },
    deleteImage: { write: true, handler: deleteImageHandler_ },
  };
}

/**
 * data: { user_id*, data_url* ("data:image/webp;base64,…") | (data_base64* + mime_type*),
 *         folder? ("avatars" | "covers" | "projects"), filename? }
 * → { file_id, url, size, mime_type }
 */
function uploadImageHandler_(data) {
  const user = requireActiveUser_(data.user_id);

  let mime = data.mime_type;
  let b64 = data.data_base64;
  if (data.data_url) {
    const m = /^data:([\w/+.-]+);base64,(.+)$/.exec(String(data.data_url));
    if (!m) throw validationError_({ data_url: ['Invalid data URL'] });
    mime = m[1];
    b64 = m[2];
  }
  if (APP.ALLOWED_UPLOAD_TYPES.indexOf(String(mime)) < 0) {
    throw validationError_({ mime_type: ['Only JPG, PNG, WebP or GIF images are allowed'] });
  }
  if (!b64) throw validationError_({ data_base64: ['Image data is required'] });

  let bytes;
  try {
    bytes = Utilities.base64Decode(String(b64));
  } catch (e) {
    throw validationError_({ data_base64: ['Image data is not valid base64'] });
  }
  if (bytes.length > APP.MAX_UPLOAD_BYTES) throw validationError_({ data_base64: ['Image is larger than 5 MB'] });

  const folderName = ['avatars', 'covers', 'projects'].indexOf(data.folder) >= 0 ? data.folder : 'images';
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[mime];
  const name = folderName + '-' + Utilities.formatDate(new Date(), tz_(), 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 8) + '.' + ext;

  const folder = userMediaFolder_(user.user_id, folderName);
  const file = folder.createFile(Utilities.newBlob(bytes, mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  file.setDescription('Uploaded via ' + APP.NAME + ' for ' + user.user_id);

  return {
    message: 'Image uploaded successfully',
    data: {
      file_id: file.getId(),
      // Direct image URL that works in <img> tags for link-shared files.
      url: 'https://lh3.googleusercontent.com/d/' + file.getId(),
      size: bytes.length,
      mime_type: mime,
    },
  };
}

/** data: { user_id*, file_id* } — only files inside the user's own media folder. */
function deleteImageHandler_(data) {
  const user = requireActiveUser_(data.user_id);
  const fileId = requireField_(data, 'file_id', 'file_id');
  let file;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (e) {
    throw notFound_('File');
  }
  const userFolderId = userMediaFolder_(user.user_id, null).getId();
  let owned = false;
  const parents = file.getParents();
  while (parents.hasNext() && !owned) {
    const p = parents.next();
    const grand = p.getParents();
    owned = p.getId() === userFolderId || (grand.hasNext() && grand.next().getId() === userFolderId);
  }
  if (!owned) throw forbidden_('This file does not belong to the user');
  file.setTrashed(true);
  return { message: 'Image deleted successfully', data: { deleted: fileId } };
}

function userMediaFolder_(userId, sub) {
  const props = PropertiesService.getScriptProperties();
  let root = null;
  const rootId = props.getProperty('MEDIA_FOLDER_ID');
  if (rootId) {
    try {
      root = DriveApp.getFolderById(rootId);
    } catch (e) {
      root = null;
    }
  }
  if (!root) {
    root = DriveApp.createFolder(APP.MEDIA_ROOT_FOLDER);
    props.setProperty('MEDIA_FOLDER_ID', root.getId());
  }
  const userFolder = childFolder_(root, userId);
  return sub ? childFolder_(userFolder, sub) : userFolder;
}

function childFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
