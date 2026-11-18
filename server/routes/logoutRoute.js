const express = require('express');
const logoutRoute = express.Router();

logoutRoute.post('/', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('greatread.sid');
        res.redirect('/');
    });
});

module.exports = { logoutRoute };
