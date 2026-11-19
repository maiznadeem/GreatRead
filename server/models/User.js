const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const bcryptSalt = process.env.BCRYPT_SALT;
const userSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            trim: true,
            unique: true,
            required: true,
        },
        password: { type: String },
    },
    {
        timestamps: true,
    }
);
// Mongoose 9 async hooks take no `next` callback.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, Number(bcryptSalt) || 10);
});
module.exports = mongoose.model("User", userSchema);