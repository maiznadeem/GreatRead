require('dotenv').config();

const REQUIRED_ENV = ['SESSION_SECRET', 'MONGO_DB_URL', 'STRIPE_PRIVATE_KEY', 'STRIPE_WEBHOOK_SECRET'];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length) {
    console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const cors = require('cors');
const path = require('path');

const { adminRoute } = require('./routes/adminRoute');
const { loginRoute } = require('./routes/loginRoute');
const { resetRoute } = require('./routes/resetRoute');
const { logoutRoute } = require('./routes/logoutRoute');
const { getRoute } = require('./routes/getRoute');
const { purchaseRoute } = require('./routes/purchaseRoute');
const { stripeWebhook } = require('./routes/webhookRoute');

const app = express();

// Two proxies sit in front of the app (Cloudflare Worker, then Google's front end), so trust exactly two hops.
app.set('trust proxy', 2);

// Stripe needs the raw body to verify the signature, so this must come before express.json().
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    req.body ??= {};
    next();
});

const allowedOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://great-read-maiz.vercel.app,https://great-read-dev.vercel.app').split(','),
].map((origin) => origin && origin.trim().replace(/\/$/, '')).filter(Boolean);

// Requests without an Origin header (same-origin pages, server-to-server) are always allowed.
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
}));

const port = process.env.PORT || 8080;

const mongoClientPromise = mongoose
    .connect(process.env.MONGO_DB_URL)
    .then((m) => {
        console.log('Connected to MongoDB');
        return m.connection.getClient();
    });

app.use(session({
    name: 'greatread.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ clientPromise: mongoClientPromise, ttl: 8 * 60 * 60 }),
    cookie: {
        httpOnly: true,
        secure: 'auto',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
    },
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/reset/passwordReset', express.static(path.join(__dirname, 'public', 'resetPassword')));

function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.redirect('/authpage');
    }
}

app.use('/login', loginRoute);
app.use('/reset', resetRoute)
app.use('/logout', logoutRoute);
app.use('/get', getRoute);
app.use('/purchase', purchaseRoute);

app.use('/admin', isAuthenticated);
app.use('/admin', adminRoute);
app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.redirect('/admin');
    } else {
        res.redirect('/authpage');
    }
});
app.get('/authpage', (req, res) => {
    if (req.session.isAuthenticated) {
        res.redirect('/admin');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'authpage', 'index.html'));
    }
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.name === 'MulterError' ? 400 : err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

mongoClientPromise
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });
