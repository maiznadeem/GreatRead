const express = require("express");
const { requestPasswordReset, resetPassword } = require("../services/authService");
const { resetLimiter } = require("../utils/rateLimiters");

const resetRoute = express.Router();

const GENERIC_MESSAGE = "If an account exists for that email, a password reset link has been sent.";

resetRoute.post("/requestResetPassword", resetLimiter, async (req, res) => {
    const { email } = req.body;
    if (typeof email !== "string" || !email || email.length > 254) {
        return res.status(400).json({ message: "Please enter a valid email." });
    }
    // Awaited: Cloud Run throttles CPU after the response, so a background send might never finish.
    try {
        await requestPasswordReset(email);
    } catch (error) {
        console.error("Error requesting password reset:", error.message);
    }
    return res.json({ message: GENERIC_MESSAGE });
});

resetRoute.post("/resetPassword", resetLimiter, async (req, res) => {
    try {
        return res.json(await resetPassword(req.body.userId, req.body.token, req.body.password));
    } catch (error) {
        if (error.status === 400) return res.status(400).json({ message: error.message });
        console.error("Error resetting password:", error.message);
        return res.status(500).json({ message: "An error occurred. Please try again." });
    }
});

module.exports = { resetRoute };
