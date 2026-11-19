const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { MongoRateLimitStore } = require('./rateLimitStore');

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const MAX_EMAIL_LENGTH = 254;

const normalizeEmail = (email) => email.trim().toLowerCase();
const hasEmail = (req) => typeof req.body?.email === 'string' && req.body.email.length <= MAX_EMAIL_LENGTH;

// req.ip is the client IP appended by Google's front end (see 'trust proxy' in index.js).
// `passOnStoreError`: public limiters fail open when MongoDB is down; auth limiters fail closed.
const makeLimiter = ({ name, windowMs, limit, message, passOnStoreError, keyGenerator, skip }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        passOnStoreError,
        store: new MongoRateLimitStore({ prefix: name }),
        keyGenerator: keyGenerator || ((req) => ipKeyGenerator(req.ip)),
        skip,
        handler: (req, res) => res.status(429).json({ error: message }),
    });

const byEmail = (req) => normalizeEmail(req.body.email);
const skipWithoutEmail = (req) => !hasEmail(req);
const tooMany = (what) => `Too many ${what}. Please try again later.`;

module.exports = {
    normalizeEmail,
    globalLimiter: makeLimiter({
        name: 'global', windowMs: 15 * MINUTE, limit: 600, passOnStoreError: true, message: tooMany('requests'),
        // Health checks come from Google's own probes, not from clients.
        skip: (req) => req.path === '/healthz',
    }),
    adminWriteLimiter: makeLimiter({
        name: 'admin-write', windowMs: 15 * MINUTE, limit: 120, passOnStoreError: true, message: tooMany('changes'),
        skip: (req) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
    }),
    loginIpLimiter: makeLimiter({
        name: 'login-ip', windowMs: 15 * MINUTE, limit: 10, passOnStoreError: false, message: tooMany('login attempts'),
    }),
    loginEmailLimiter: makeLimiter({
        name: 'login-email', windowMs: 15 * MINUTE, limit: 5, passOnStoreError: false, message: tooMany('login attempts'),
        keyGenerator: byEmail, skip: skipWithoutEmail,
    }),
    forgotIpLimiter: makeLimiter({
        name: 'forgot-ip', windowMs: HOUR, limit: 5, passOnStoreError: false, message: tooMany('password reset requests'),
    }),
    forgotEmailLimiter: makeLimiter({
        name: 'forgot-email', windowMs: HOUR, limit: 3, passOnStoreError: false, message: tooMany('password reset requests'),
        keyGenerator: byEmail, skip: skipWithoutEmail,
    }),
    resetLimiter: makeLimiter({
        name: 'reset-ip', windowMs: HOUR, limit: 10, passOnStoreError: false, message: tooMany('password reset attempts'),
    }),
    purchaseLimiter: makeLimiter({
        name: 'purchase', windowMs: 15 * MINUTE, limit: 10, passOnStoreError: true, message: tooMany('purchase attempts'),
    }),
    getPaymentLimiter: makeLimiter({
        name: 'get-payment', windowMs: 15 * MINUTE, limit: 60, passOnStoreError: true, message: tooMany('requests'),
    }),
};
