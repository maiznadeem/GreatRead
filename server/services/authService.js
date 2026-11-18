const User = require("../models/User");
const Token = require("../models/Token");
const sendEmail = require("../utils/email/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const bcryptSalt = Number(process.env.BCRYPT_SALT) || 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const INVALID_LINK = "The link is invalid or has expired. Please request a new one.";

const requestError = (message) => Object.assign(new Error(message), { status: 400 });

// Never returns the reset link: it is only delivered by email.
const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) return;

    await Token.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString("hex");
    await new Token({
        userId: user._id,
        token: await bcrypt.hash(resetToken, bcryptSalt),
    }).save();

    const link = `${process.env.SERVER_URL}/reset/passwordReset?token=${resetToken}&id=${user._id}`;

    await sendEmail(
        user.email,
        "Password Reset Request",
        { name: user.name, link },
        "./template/requestResetPassword"
    );
};

const resetPassword = async (userId, token, password) => {
    if (typeof userId !== "string" || !/^[0-9a-fA-F]{24}$/.test(userId) || typeof token !== "string" || !token) {
        throw requestError(INVALID_LINK);
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        throw requestError(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`);
    }

    const passwordResetToken = await Token.findOne({ userId });
    if (!passwordResetToken || !(await bcrypt.compare(token, passwordResetToken.token))) {
        throw requestError(INVALID_LINK);
    }
    // Single use: only the request that deletes the token may proceed.
    if (!(await Token.findOneAndDelete({ _id: passwordResetToken._id }))) {
        throw requestError(INVALID_LINK);
    }

    await User.updateOne({ _id: userId }, { $set: { password: await bcrypt.hash(password, bcryptSalt) } });

    try {
        const user = await User.findById(userId);
        await sendEmail(user.email, "Password Reset Successfully", { name: user.name }, "./template/resetPassword");
    } catch (error) {
        console.error("Error sending password reset confirmation:", error.message);
    }
    return { message: "Password reset was successful" };
};

module.exports = {
    requestPasswordReset,
    resetPassword,
};
