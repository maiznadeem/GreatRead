const { timingSafeEqual } = require('crypto');

// The public API hostname is a Cloudflare Worker (WAF in front) that forwards to this Cloud Run service with
// X-Origin-Auth set to a shared secret and X-Client-IP set to the visitor's address. Requests that skip
// Cloudflare (the *.run.app URL) don't carry the secret. ORIGIN_AUTH_MODE=enforce rejects them; any other
// value only logs them, for rollout. Without ORIGIN_AUTH (local development) the check is off.
const secret = process.env.ORIGIN_AUTH ? Buffer.from(process.env.ORIGIN_AUTH) : null;
const enforce = process.env.ORIGIN_AUTH_MODE === 'enforce';

const fromWorker = (req) => {
    const sent = req.get('x-origin-auth');
    if (!secret || !sent) return false;
    const given = Buffer.from(sent);
    return given.length === secret.length && timingSafeEqual(given, secret);
};

const originAuth = (req, res, next) => {
    if (!secret) return next();
    if (fromWorker(req)) {
        // Behind the Worker, Google's X-Forwarded-For ends with a Cloudflare address; use the visitor's instead.
        const clientIp = req.get('x-client-ip');
        if (clientIp) Object.defineProperty(req, 'ip', { value: clientIp, configurable: true });
        return next();
    }
    if (!enforce) {
        console.warn(`Origin auth missing (log only): ${req.method} ${req.path}`);
        return next();
    }
    res.status(403).json({ error: 'Forbidden' });
};

module.exports = { originAuth };
