const express = require('express');
const loginRoute = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { loginLimiter } = require('../utils/rateLimiters');

loginRoute.post('/', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).send('Email and password are required.');
    }
    try {
        const user = await User.findOne({ email: username });
        const passwordMatch = user && await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).send('Authentication failed. Invalid email or password.');
        }
        // New session id on login prevents session fixation.
        req.session.regenerate((err) => {
            if (err) {
                console.error('Error regenerating session:', err);
                return res.status(500).send('An error occurred during authentication.');
            }
            req.session.isAuthenticated = true;
            req.session.save(() => res.redirect('/admin'));
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during authentication.');
    }
});

module.exports = { loginRoute };
