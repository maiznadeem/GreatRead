const express = require('express');
const { authenticate, requestPasswordReset, resetPassword } = require('../services/authService');
const { requireAuth } = require('../utils/requireAuth');
const {
    loginIpLimiter, loginEmailLimiter, forgotIpLimiter, forgotEmailLimiter, resetLimiter,
} = require('../utils/rateLimiters');

const authRoute = express.Router();

const MAX_EMAIL_LENGTH = 254;
const MAX_LOGIN_PASSWORD_LENGTH = 1000;
const FORGOT_RESPONSE_MS = 4000;
const GENERIC_MESSAGE = 'If an account exists for that email, a password reset link has been sent.';

const publicUser = (user) => ({ name: user.name, email: user.email });
const isEmail = (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_EMAIL_LENGTH;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const call = (fn, ...args) => new Promise((resolve, reject) => fn(...args, (err) => (err ? reject(err) : resolve())));

authRoute.get('/session', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

authRoute.post('/login', loginIpLimiter, loginEmailLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!isEmail(email) || typeof password !== 'string' || !password || password.length > MAX_LOGIN_PASSWORD_LENGTH) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await authenticate(email, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }
    // New session id on login prevents session fixation.
    await call(req.session.regenerate.bind(req.session));
    req.session.userId = String(user._id);
    await call(req.session.save.bind(req.session));
    res.json({ user: publicUser(user) });
});

authRoute.post('/logout', async (req, res) => {
    try {
        await call(req.session.destroy.bind(req.session));
    } catch (error) {
        console.error('Error destroying session:', error.message);
    }
    res.clearCookie('greatread.sid', { httpOnly: true, secure: 'auto', sameSite: 'strict' });
    res.status(204).end();
});

authRoute.post('/password/forgot', forgotIpLimiter, forgotEmailLimiter, async (req, res) => {
    const { email } = req.body;
    if (!isEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email.' });
    }
    // Always answers after exactly FORGOT_RESPONSE_MS, so timing never reveals whether the account exists.
    // The email send runs meanwhile (it normally takes 1-2 s); Cloud Run throttles CPU after the response,
    // so a send that is still running then may be delayed.
    requestPasswordReset(email).catch((error) => console.error('Error requesting password reset:', error.message));
    await sleep(FORGOT_RESPONSE_MS);
    res.json({ message: GENERIC_MESSAGE });
});

authRoute.post('/password/reset', resetLimiter, async (req, res) => {
    try {
        const { userId, token, password } = req.body;
        res.json(await resetPassword(userId, token, password));
    } catch (error) {
        if (error.status === 400) return res.status(400).json({ error: error.message });
        console.error('Error resetting password:', error.message);
        res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
});

module.exports = { authRoute };
