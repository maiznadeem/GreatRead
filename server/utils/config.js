// Origins the API trusts. Read after dotenv has loaded (index.js loads it first).
// Production trusts only the two production sites. Local development adds its dev servers through
// ALLOWED_ORIGINS in server/.env (for example http://localhost:5173,http://localhost:5174); never default to them here.
const stripSlash = (url) => (url || '').trim().replace(/\/+$/, '');
const list = (value) => (value || '').split(',').map(stripSlash).filter(Boolean);

const CLIENT_URL = stripSlash(process.env.CLIENT_URL) || 'https://greatread.himaiz.com';
const ADMIN_URL = stripSlash(process.env.ADMIN_URL) || 'https://admin.greatread.himaiz.com';

const allowedOrigins = [...new Set([CLIENT_URL, ADMIN_URL, ...list(process.env.ALLOWED_ORIGINS)])];

// reCAPTCHA Enterprise (score-based, invisible). The site key is public. Production authenticates with the Cloud Run service account.
const recaptcha = {
    enabled: process.env.RECAPTCHA_ENABLED !== 'false',
    projectId: process.env.RECAPTCHA_PROJECT_ID || 'maiz-portfolio',
    siteKey: process.env.RECAPTCHA_SITE_KEY || '6LdJoSsuAAAAAFOhxjEi7UgYJVnhWCDyx_w6eS0f',
    minScore: Number(process.env.RECAPTCHA_MIN_SCORE || 0.3),
    // Sites whose tokens we accept: the hostnames of the trusted origins (production: the two production sites).
    hostnames: list(process.env.RECAPTCHA_HOSTNAMES).length
        ? list(process.env.RECAPTCHA_HOSTNAMES)
        : [...new Set(allowedOrigins.map((origin) => new URL(origin).hostname))],
};

module.exports = { CLIENT_URL, ADMIN_URL, allowedOrigins, recaptcha };
