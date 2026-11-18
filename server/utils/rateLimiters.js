const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// The Worker puts the visitor's IP in X-Client-IP (CF-Connecting-IP on its subrequests is the Worker's
// own address). It can be trusted because index.js rejects requests without the Worker's PROXY_SECRET.
const limiter = (windowMinutes, limit, message) =>
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        keyGenerator: (req) => ipKeyGenerator(req.get('x-client-ip') || req.ip),
        handler: (req, res) => res.status(429).json({ error: message, message }),
    });

module.exports = {
    loginLimiter: limiter(15, 10, 'Too many login attempts. Please try again later.'),
    resetLimiter: limiter(60, 5, 'Too many password reset attempts. Please try again later.'),
    purchaseLimiter: limiter(15, 10, 'Too many purchase attempts. Please try again later.'),
};
