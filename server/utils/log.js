// Structured logging per OracleVMOps LOGGING.md: one JSON object per line on stdout, which Cloud Logging and Argus
// both parse. Never pass request bodies, cookies, tokens or user emails; keys that look secret are redacted anyway.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
const SECRET_KEY = /token|secret|password|authorization|cookie/i;

const write = (level, event, msg, fields = {}) => {
    if (LEVELS[level] < minLevel) return;
    const line = { time: new Date().toISOString(), level, app: 'greatread', part: 'api', event, msg };
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || key in line) continue;
        line[key] = SECRET_KEY.test(key) ? '[redacted]' : value;
    }
    // Cloud Logging reads `severity`; Argus reads `level`.
    line.severity = level === 'warn' ? 'WARNING' : level.toUpperCase();
    process.stdout.write(`${JSON.stringify(line)}\n`);
};

const log = {
    debug: (event, msg, fields) => write('debug', event, msg, fields),
    info: (event, msg, fields) => write('info', event, msg, fields),
    warn: (event, msg, fields) => write('warn', event, msg, fields),
    error: (event, msg, fields) => write('error', event, msg, fields),
};

// For failures on our side (database, Stripe, storage): the error type and stack. The stack includes the message,
// so use errorType() instead when the error could quote what a caller sent.
const errorFields = (err) => ({ error: err?.name ?? typeof err, stack: err?.stack ?? String(err) });
const errorType = (err) => ({ error: err?.name ?? typeof err });

// The route pattern Express matched (never the raw URL, which can carry ids and tokens).
const routeOf = (req) => (req.route ? `${req.baseUrl}${req.route.path}` : '(unmatched)');

// One line per request when the response finishes. Health checks and preflights at debug, 5xx at error.
const requestLog = (req, res, next) => {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
        const route = routeOf(req);
        const quiet = req.method === 'OPTIONS' || (req.method === 'GET' && route === '/');
        const level = res.statusCode >= 500 ? 'error' : quiet ? 'debug' : 'info';
        write(level, 'request', `${req.method} ${route} ${res.statusCode}`, {
            ray: req.get('cf-ray'),
            method: req.method,
            route,
            status: res.statusCode,
            ms: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
            user: req.session?.userId,
        });
    });
    next();
};

module.exports = { log, errorFields, errorType, requestLog };
