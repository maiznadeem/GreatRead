// Origins the API trusts. Read after dotenv has loaded (index.js loads it first).
const stripSlash = (url) => (url || '').trim().replace(/\/+$/, '');

const CLIENT_URL = stripSlash(process.env.CLIENT_URL);
const ADMIN_URL = stripSlash(process.env.ADMIN_URL) || 'https://admin.greatread.himaiz.com';

const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://great-read-maiz.vercel.app',
    'https://great-read-dev.vercel.app',
].join(',');

const allowedOrigins = [
    CLIENT_URL,
    ADMIN_URL,
    ...(process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS).split(',').map(stripSlash),
].filter(Boolean);

// reCAPTCHA Enterprise (score-based, invisible). The site key is public. Production authenticates with the Cloud Run service account.
const recaptcha = {
    enabled: process.env.RECAPTCHA_ENABLED !== 'false',
    projectId: process.env.RECAPTCHA_PROJECT_ID || 'maiz-portfolio',
    siteKey: process.env.RECAPTCHA_SITE_KEY || '6LdJoSsuAAAAAFOhxjEi7UgYJVnhWCDyx_w6eS0f',
    minScore: Number(process.env.RECAPTCHA_MIN_SCORE || 0.3),
    // Sites whose tokens we accept. The key also allows localhost for local dev, but anyone can mint tokens there.
    hostnames: (process.env.RECAPTCHA_HOSTNAMES || 'greatread.himaiz.com,admin.greatread.himaiz.com,great-read-maiz.vercel.app,great-read-dev.vercel.app')
        .split(',').map((host) => host.trim()).filter(Boolean),
};

module.exports = { CLIENT_URL, ADMIN_URL, allowedOrigins, recaptcha };
