const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// req.ip is the client IP appended by Google's front end (see 'trust proxy' in index.js).
const limiter = (windowMinutes, limit, message) =>
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        keyGenerator: (req) => ipKeyGenerator(req.ip),
        handler: (req, res) => res.status(429).json({ error: message, message }),
    });

module.exports = {
    loginLimiter: limiter(15, 10, 'Too many login attempts. Please try again later.'),
    resetLimiter: limiter(60, 5, 'Too many password reset attempts. Please try again later.'),
    purchaseLimiter: limiter(15, 10, 'Too many purchase attempts. Please try again later.'),
};
