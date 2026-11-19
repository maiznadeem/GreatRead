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

module.exports = { CLIENT_URL, ADMIN_URL, allowedOrigins };
