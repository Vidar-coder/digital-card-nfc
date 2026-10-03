/**
 * ============================================================================
 *  Config.gs — single source of truth for the Google Sheets database.
 * ============================================================================
 *  Every sheet, column, type, validation rule and ID prefix is declared here.
 *  Setup, validation, CRUD and formatting are all driven from this schema, so
 *  adding a field = adding one line below and re-running setupDatabase().
 *
 *  Column types:
 *    id        primary key (generated)          fk        reference to another table's id
 *    string    single-line text                 text      multi-line text
 *    html      sanitized rich text              email     email address
 *    phone     international phone              url       http(s) URL
 *    username  a-z 0-9 - _ (3–30 chars)         enum      one of `values`
 *    bool      checkbox                         int       whole number (min/max)
 *    month     YYYY-MM                          color     #RRGGBB
 *    list      array stored as "a, b, c"        datetime  timestamp (Date cell)
 *    hash      opaque credential hash (scrypt / sha256) — combine with { secret: true }
 *
 *  NOTE: Apps Script loads every .gs file into one global scope. Top-level code
 *  here only uses functions declared in THIS file, so file order never matters.
 * ============================================================================
 */

const APP = {
  NAME: 'NFC Digital Card API',
  VERSION: '1.1.0', // keep in sync with REQUIRED_SCRIPT_VERSION in src/lib/sheets/status.ts
  /** Sheet number format for timestamp cells (displayed in the spreadsheet's timezone). */
  DATETIME_FORMAT: 'yyyy-mm-dd hh:mm:ss',
  /** Rows pre-formatted / validated by setup (sheets grow beyond this automatically). */
  MIN_ROWS: 1000,
  LOCK_TIMEOUT_MS: 20000,
  /** Rate limits (approximate, per Apps Script project, per minute). */
  RATE_LIMIT_GLOBAL: 600,
  RATE_LIMIT_ANALYTICS_PER_PROFILE: 120,
  /** Complete-profile cache lifetime (seconds). Writes invalidate immediately. */
  CACHE_SECONDS: 600,
  MAX_LOG_ROWS: 5000,
  MAX_REQUEST_BYTES: 8 * 1024 * 1024,
  MEDIA_ROOT_FOLDER: 'NFC Card Media',
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024,
  ALLOWED_UPLOAD_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  /** Script Properties keys */
  PROP_API_KEY: 'API_KEY',
  PROP_SPREADSHEET_ID: 'SPREADSHEET_ID',
  PROP_SITE_URL: 'SITE_URL',
  PROP_LOG_LEVEL: 'LOG_LEVEL', // "all" | "writes" (default) | "errors" | "off"
};

const SHEETS = {
  USERS: '01_Users',
  PROFILES: '02_Profiles',
  SOCIAL_LINKS: '03_Social_Links',
  EXPERIENCE: '04_Experience',
  EDUCATION: '05_Education',
  SKILLS: '06_Skills',
  SERVICES: '07_Services',
  PROJECTS: '08_Projects',
  CONTACT_ACTIONS: '09_Contact_Actions',
  THEMES: '10_Themes',
  QR_NFC: '11_QR_NFC',
  ANALYTICS: '12_Analytics',
  SETTINGS: '13_Settings',
  API_LOGS: '14_API_Logs',
  // Added so the dashboard's Certifications editor is persisted too.
  CERTIFICATIONS: '15_Certifications',
};

const ENUMS = {
  USER_STATUS: ['active', 'suspended'],
  USER_ROLES: ['user', 'admin'],
  PROFILE_STATUS: ['published', 'draft'],
  SOCIAL_PLATFORMS: [
    'facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'youtube', 'github',
    'website', 'whatsapp', 'telegram', 'dribbble', 'behance', 'custom',
  ],
  PROFICIENCY: ['beginner', 'intermediate', 'advanced', 'expert'],
  CONTACT_ACTION_TYPES: ['phone', 'sms', 'email', 'website', 'location', 'whatsapp', 'custom'],
  THEME_NAMES: ['minimal', 'corporate', 'elegant', 'modern', 'dark', 'glass', 'creative', 'custom'],
  FONTS: ['inter', 'jakarta', 'grotesk', 'manrope', 'playfair', 'lora'],
  CARD_STYLES: ['elevated', 'outlined', 'flat', 'glass'],
  IMAGE_STYLES: ['circle', 'rounded', 'square'],
  COLOR_MODES: ['light', 'dark'],
  EVENT_TYPES: [
    'profile_view', 'qr_scan', 'nfc_tap', 'phone_click', 'sms_click', 'email_click',
    'website_click', 'social_click', 'portfolio_click', 'contact_download', 'profile_share',
  ],
  REQUEST_STATUS: ['success', 'error'],
};

const RESERVED_USERNAMES = [
  'admin', 'api', 'app', 'auth', 'dashboard', 'login', 'logout', 'register', 'signup',
  'settings', 'p', 'profile', 'profiles', 'www', 'help', 'support', 'about', 'terms',
  'privacy', 'static', 'assets', 'public', 'null', 'undefined', 'root',
];

/** Column factory: c('name', 'type', { required, max, min, values, unique, def, width }) */
function c(name, type, opts) {
  return Object.assign({ name: name, type: type }, opts || {});
}

const TS = [c('created_at', 'datetime'), c('updated_at', 'datetime')];

/**
 * Table definitions. Keys are used everywhere in code (e.g. createRecord('PROJECTS', …)).
 *   idField    primary key column      prefix   ID prefix ("PRJ" → PRJ-000001)
 *   idMode     "sequence" (readable, monotonic, never reused) | "uuid" (high-volume tables)
 *   ordered    has display_order       userScoped  rows belong to a user via user_id
 */
const SCHEMA = {
  USERS: {
    sheet: SHEETS.USERS, idField: 'user_id', prefix: 'USR', idMode: 'sequence', userScoped: false,
    columns: [
      c('user_id', 'id'),
      c('email', 'email', { required: true, unique: true }),
      c('username', 'username', { required: true, unique: true }),
      c('status', 'enum', { values: ENUMS.USER_STATUS, def: 'active' }),
      // "admin" can manage all users and see the database page. The first account registered becomes admin.
      c('role', 'enum', { values: ENUMS.USER_ROLES, def: 'user' }),
      // Authentication. Passwords are NEVER stored: only a salted scrypt hash computed by
      // the Next.js server. `secret` columns are never returned by the API except to the
      // sign-in lookup (getAuthUser).
      c('password_hash', 'hash', { secret: true }),
      c('session_version', 'int', { min: 1, def: 1 }), // bump = sign out everywhere
      c('reset_token_hash', 'hash', { secret: true }), // SHA-256 of the emailed token
      c('reset_expires_at', 'datetime', { secret: true }),
      c('last_login_at', 'datetime'),
    ].concat(TS),
  },

  PROFILES: {
    sheet: SHEETS.PROFILES, idField: 'profile_id', prefix: 'PROF', idMode: 'sequence', userScoped: true,
    columns: [
      c('profile_id', 'id'),
      c('user_id', 'fk', { required: true, unique: true }),
      c('username', 'username', { required: true, unique: true }),
      c('full_name', 'string', { max: 80 }),
      c('professional_title', 'string', { max: 120 }),
      c('company', 'string', { max: 120 }),
      c('profile_photo', 'url'),
      c('cover_photo', 'url'), // dashboard "Cover image"
      c('bio', 'string', { max: 280 }), // dashboard "Short introduction"
      c('about', 'html', { max: 20000 }), // dashboard "About me" rich text
      c('phone', 'phone'),
      c('email', 'email'),
      c('website', 'url'),
      c('address', 'string', { max: 240 }),
      c('location', 'string', { max: 120 }),
      c('profile_url', 'url'),
      c('status', 'enum', { values: ENUMS.PROFILE_STATUS, def: 'published' }),
    ].concat(TS),
  },

  SOCIAL_LINKS: {
    sheet: SHEETS.SOCIAL_LINKS, idField: 'social_id', prefix: 'SOC', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('social_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('platform', 'enum', { values: ENUMS.SOCIAL_PLATFORMS, required: true }),
      c('display_name', 'string', { max: 40 }),
      c('url', 'url', { required: true }),
      c('icon', 'string', { max: 40 }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
      c('is_visible', 'bool', { def: true }),
    ].concat(TS),
  },

  EXPERIENCE: {
    sheet: SHEETS.EXPERIENCE, idField: 'experience_id', prefix: 'EXP', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('experience_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('company', 'string', { required: true, max: 120 }),
      c('position', 'string', { required: true, max: 120 }),
      c('location', 'string', { max: 120 }),
      c('start_date', 'month', { required: true }),
      c('end_date', 'month'),
      c('is_current', 'bool', { def: false }),
      c('description', 'text', { max: 2000 }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
    ].concat(TS),
  },

  EDUCATION: {
    sheet: SHEETS.EDUCATION, idField: 'education_id', prefix: 'EDU', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('education_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('school', 'string', { required: true, max: 160 }),
      c('degree', 'string', { max: 120 }),
      c('field_of_study', 'string', { max: 120 }),
      c('start_year', 'int', { min: 1950, max: 2100 }),
      c('end_year', 'int', { min: 1950, max: 2100 }),
      c('description', 'text', { max: 1000 }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
    ].concat(TS),
  },

  SKILLS: {
    sheet: SHEETS.SKILLS, idField: 'skill_id', prefix: 'SKL', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('skill_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('skill_name', 'string', { required: true, max: 40 }),
      c('proficiency', 'enum', { values: ENUMS.PROFICIENCY }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
    ].concat(TS),
  },

  SERVICES: {
    sheet: SHEETS.SERVICES, idField: 'service_id', prefix: 'SRV', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('service_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('service_name', 'string', { required: true, max: 80 }),
      c('description', 'text', { max: 500 }),
      c('icon', 'string', { max: 40 }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
      c('is_visible', 'bool', { def: true }),
    ].concat(TS),
  },

  PROJECTS: {
    sheet: SHEETS.PROJECTS, idField: 'project_id', prefix: 'PRJ', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('project_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('project_title', 'string', { required: true, max: 120 }),
      c('description', 'text', { max: 1000 }),
      c('image_url', 'url'),
      c('project_url', 'url'),
      c('github_url', 'url'),
      c('technologies', 'list', { maxItems: 20, max: 40 }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
      c('is_featured', 'bool', { def: false }),
      c('is_visible', 'bool', { def: true }),
    ].concat(TS),
  },

  CONTACT_ACTIONS: {
    sheet: SHEETS.CONTACT_ACTIONS, idField: 'contact_id', prefix: 'CON', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('contact_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('action_type', 'enum', { values: ENUMS.CONTACT_ACTION_TYPES, required: true }),
      c('action_value', 'string', { required: true, max: 500 }),
      c('label', 'string', { max: 60 }),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
      c('is_visible', 'bool', { def: true }),
    ].concat(TS),
  },

  THEMES: {
    sheet: SHEETS.THEMES, idField: 'theme_id', prefix: 'THM', idMode: 'sequence', userScoped: true,
    columns: [
      c('theme_id', 'id'),
      c('user_id', 'fk', { required: true, unique: true }),
      c('theme_name', 'enum', { values: ENUMS.THEME_NAMES, def: 'modern' }),
      c('primary_color', 'color', { def: '#4f46e5' }),
      c('secondary_color', 'color', { def: '#7c3aed' }),
      c('accent_color', 'color', { def: '#06b6d4' }),
      c('background_color', 'color', { def: '#f6f7fb' }),
      c('text_color', 'color', { def: '#111127' }),
      c('button_color', 'color', { def: '#4f46e5' }),
      c('font_family', 'enum', { values: ENUMS.FONTS, def: 'grotesk' }),
      c('card_style', 'enum', { values: ENUMS.CARD_STYLES, def: 'elevated' }),
      c('border_radius', 'int', { min: 0, max: 28, def: 18 }),
      c('profile_image_style', 'enum', { values: ENUMS.IMAGE_STYLES, def: 'rounded' }),
      c('mode', 'enum', { values: ENUMS.COLOR_MODES, def: 'light' }),
    ].concat(TS),
  },

  QR_NFC: {
    sheet: SHEETS.QR_NFC, idField: 'qr_nfc_id', prefix: 'QRN', idMode: 'sequence', userScoped: true,
    columns: [
      c('qr_nfc_id', 'id'),
      c('user_id', 'fk', { required: true, unique: true }),
      c('profile_url', 'url'),
      c('qr_code_url', 'url'), // the URL encoded in the QR code (…?src=qr)
      c('nfc_url', 'url'), // the URL written to the NFC chip (…?src=nfc)
    ].concat(TS),
  },

  ANALYTICS: {
    sheet: SHEETS.ANALYTICS, idField: 'analytics_id', prefix: 'ANL', idMode: 'uuid', userScoped: true,
    columns: [
      c('analytics_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('username', 'username'),
      c('event_type', 'enum', { values: ENUMS.EVENT_TYPES, required: true }),
      c('event_value', 'string', { max: 200 }),
      c('referrer', 'string', { max: 300 }),
      c('device', 'string', { max: 40 }),
      c('browser', 'string', { max: 40 }),
      c('country', 'string', { max: 8 }),
      c('timestamp', 'datetime'),
    ],
  },

  SETTINGS: {
    sheet: SHEETS.SETTINGS, idField: 'setting_id', prefix: 'SET', idMode: 'sequence', userScoped: true,
    columns: [
      c('setting_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('setting_name', 'string', { required: true, max: 64, pattern: /^[a-z0-9_.-]+$/ }),
      c('setting_value', 'text', { max: 5000 }),
    ].concat(TS),
  },

  API_LOGS: {
    sheet: SHEETS.API_LOGS, idField: 'log_id', prefix: 'LOG', idMode: 'uuid', userScoped: false,
    columns: [
      c('log_id', 'id'),
      c('timestamp', 'datetime'),
      c('action', 'string', { max: 64 }),
      c('user_id', 'string', { max: 64 }),
      c('request_status', 'enum', { values: ENUMS.REQUEST_STATUS }),
      c('error_message', 'text', { max: 500 }),
      c('execution_time', 'int', { min: 0 }), // milliseconds
    ],
  },

  CERTIFICATIONS: {
    sheet: SHEETS.CERTIFICATIONS, idField: 'certification_id', prefix: 'CRT', idMode: 'sequence', userScoped: true, ordered: true,
    columns: [
      c('certification_id', 'id'),
      c('user_id', 'fk', { required: true }),
      c('certification_name', 'string', { required: true, max: 160 }),
      c('issuer', 'string', { max: 120 }),
      c('year', 'int', { min: 1950, max: 2100 }),
      c('credential_url', 'url'),
      c('display_order', 'int', { min: 0, max: 9999, def: 0 }),
    ].concat(TS),
  },
};

/** Tables that hold a user's dashboard content (used by cascade delete & cache). */
const USER_CONTENT_TABLES = [
  'PROFILES', 'SOCIAL_LINKS', 'EXPERIENCE', 'EDUCATION', 'CERTIFICATIONS', 'SKILLS',
  'SERVICES', 'PROJECTS', 'CONTACT_ACTIONS', 'THEMES', 'QR_NFC', 'SETTINGS',
];
