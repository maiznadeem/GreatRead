require('dotenv').config({ quiet: true });

// On Cloud Run all secrets arrive in one Secret Manager secret, mounted as APP_SECRETS (a JSON object of strings).
if (process.env.APP_SECRETS) {
    Object.assign(process.env, JSON.parse(process.env.APP_SECRETS));
    delete process.env.APP_SECRETS;
}

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
const helmet = require('helmet');

const { allowedOrigins } = require('./utils/config');
const { globalLimiter } = require('./utils/rateLimiters');
const { adminRoute } = require('./routes/adminRoute');
const { authRoute } = require('./routes/authRoute');
const { getRoute } = require('./routes/getRoute');
const { purchaseRoute } = require('./routes/purchaseRoute');
const { stripeWebhook } = require('./routes/webhookRoute');

const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const app = express();

app.disable('x-powered-by');

// Google's front end appends the real client IP as the last X-Forwarded-For entry and sets
// X-Forwarded-Proto, so trust exactly one hop: earlier (client-supplied) entries are ignored.
app.set('trust proxy', 1);

// This server only returns JSON: nothing may be loaded, framed or sniffed from its responses.
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: { 'default-src': ["'none'"], 'frame-ancestors': ["'none'"] },
    },
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true },
    referrerPolicy: { policy: 'no-referrer' },
}));

// Stripe needs the raw body to verify the signature, so this must come before express.json().
// It is also registered before the CORS, rate-limit and origin checks, which do not apply to Stripe.
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// Requests without an Origin header (server-to-server) pass CORS; the origin guard below still
// requires one for state-changing /auth and /admin calls.
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['RateLimit', 'RateLimit-Policy', 'Retry-After'],
    maxAge: 600,
}));

app.use(globalLimiter);

app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
    req.body ??= {};
    next();
});

// CSRF guard: a browser always sends Origin on cross-origin and on state-changing requests.
app.use(['/auth', '/admin'], (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (UNSAFE_METHODS.has(req.method) && !allowedOrigins.includes(req.get('Origin'))) {
        return res.status(403).json({ error: 'Forbidden origin' });
    }
    next();
});

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
    rolling: true,
    proxy: true,
    store: MongoStore.create({ clientPromise: mongoClientPromise, ttl: SESSION_IDLE_MS / 1000 }),
    cookie: {
        httpOnly: true,
        secure: 'auto',
        sameSite: 'strict',
        maxAge: SESSION_IDLE_MS,
    },
}));

// Health check. (Cloud Run reserves paths ending in 'z', so no /healthz.)
app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoute);
app.use('/admin', adminRoute);
app.use('/get', getRoute);
app.use('/purchase', purchaseRoute);

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    // body-parser errors can echo parts of the request body, so give them fixed messages.
    const bodyError = typeof err.type === 'string' && err.type.startsWith('entity.');
    const status = err.name === 'MulterError' ? 400 : err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    const body = {
        error: status >= 500 ? 'Internal server error' : bodyError ? 'Invalid request body.' : err.message,
    };
    if (status < 500 && typeof err.code === 'string' && err.constructor.name === 'HttpError') body.code = err.code;
    res.status(status).json(body);
});

mongoClientPromise
    .then(() => {
        app.listen(process.env.PORT || 8080, () => {
            console.log(`Server is running on port ${process.env.PORT || 8080}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });
