const User = require('../models/User');
const { isObjectId } = require('./validate');

// Sessions created before the SPA only carry `isAuthenticated`; they have no userId and count as logged out.
async function requireAuth(req, res, next) {
    const userId = req.session?.userId;
    if (!isObjectId(userId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(userId, 'name email');
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    req.user = user;
    next();
}

module.exports = { requireAuth };
