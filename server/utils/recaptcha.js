const { GoogleAuth } = require('google-auth-library');
const { recaptcha } = require('./config');

const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
const REJECTED = 'We could not verify this request. Please refresh the page and try again.';
const TIMEOUT_MS = 5000;

const assess = async (token, action, req) => {
    // A Headers instance (not a plain object), so set on it rather than spreading it.
    const headers = await auth.getRequestHeaders();
    headers.set('Content-Type', 'application/json');
    const response = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(recaptcha.projectId)}/assessments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            event: { token, siteKey: recaptcha.siteKey, expectedAction: action, userIpAddress: req.ip, userAgent: req.get('user-agent') },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
};

// Returns why the request should be rejected, or null when it passes.
const rejection = (assessment, action) => {
    const { tokenProperties, riskAnalysis } = assessment;
    if (tokenProperties?.valid !== true) return `invalid token (${tokenProperties?.invalidReason || 'unknown'})`;
    if (tokenProperties.action !== action) return `action mismatch (${tokenProperties.action})`;
    if (!(riskAnalysis?.score >= recaptcha.minScore)) return 'low score';
    return null;
};

// Express middleware: score-based reCAPTCHA Enterprise check. Fails open if Google is unreachable.
const requireRecaptcha = (action) => async (req, res, next) => {
    const token = req.body?.recaptchaToken;
    if (req.body) delete req.body.recaptchaToken;
    if (!recaptcha.enabled) return next();

    if (typeof token !== 'string' || !token) {
        console.warn(`reCAPTCHA rejected ${action}: missing token`);
        return res.status(403).json({ error: REJECTED });
    }

    let assessment;
    try {
        assessment = await assess(token, action, req);
    } catch (error) {
        console.error(`reCAPTCHA check failed for ${action}, allowing request:`, error.message);
        return next();
    }

    const reason = rejection(assessment, action);
    if (reason) {
        console.warn(`reCAPTCHA rejected ${action}: ${reason}, score ${assessment.riskAnalysis?.score}`);
        return res.status(403).json({ error: REJECTED });
    }
    next();
};

module.exports = { requireRecaptcha };
