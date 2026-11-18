const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const sendEmail = async (email, subject, payload, template) => {
    const source = await fs.promises.readFile(path.join(__dirname, template), "utf8");
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        return await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html: handlebars.compile(source)(payload),
        });
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
};

module.exports = sendEmail;
