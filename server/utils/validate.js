const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const isStringArray = (value, max = 100) =>
    Array.isArray(value) && value.length <= max && value.every((s) => typeof s === 'string' && s.length <= 100);

// Accepts an array of ObjectId strings or objects with a valid _id; returns the ids, or null if invalid.
const toBookIds = (books, max) => {
    if (!Array.isArray(books) || books.length > max) return null;
    const ids = books.map((book) => (typeof book === 'string' ? book : book && book._id));
    return ids.every(isObjectId) ? ids : null;
};

// ---- Admin input validation: every failure is a 400 { error } naming the field ----

class HttpError extends Error {
    constructor(status, message, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

const badRequest = (message) => new HttpError(400, message);

const LIMITS = {
    title: 300,
    author: 200,
    quote: 2000,
    url: 2000,
    categoryName: 100,
    notes: 200,
    note: 5000,
    search: 100,
};

// A required/optional string field; returns the trimmed value ('' allowed only when !required).
const stringField = (value, name, max, { required = false } = {}) => {
    if (typeof value !== 'string') throw badRequest(`${name} must be text.`);
    const trimmed = value.trim();
    if (required && !trimmed) throw badRequest(`${name} is required.`);
    if (trimmed.length > max) throw badRequest(`${name} must be at most ${max} characters.`);
    return trimmed;
};

const yearField = (value, name = 'publishingYear', now = new Date()) => {
    const ok = (typeof value === 'number' && Number.isInteger(value))
        || (typeof value === 'string' && /^\d{1,4}$/.test(value.trim()));
    const year = ok ? Number(value) : NaN;
    if (!Number.isInteger(year) || year < 0 || year > now.getFullYear() + 1) {
        throw badRequest(`${name} must be a whole year between 0 and ${now.getFullYear() + 1}.`);
    }
    return year;
};

// Empty string clears the link; otherwise an absolute http(s) URL.
const urlField = (value, name) => {
    const url = stringField(value, name, LIMITS.url);
    if (!url) return '';
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        throw badRequest(`${name} must be a valid http(s) URL.`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw badRequest(`${name} must be a valid http(s) URL.`);
    }
    return url;
};

// Multipart fields arrive as JSON-encoded strings; JSON bodies may send the array directly.
const jsonArray = (value, name) => {
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            throw badRequest(`${name} must be a JSON array.`);
        }
    }
    if (!Array.isArray(value)) throw badRequest(`${name} must be a JSON array.`);
    return value;
};

const categoriesField = (value) => {
    const list = jsonArray(value, 'categories');
    if (list.length > 100) throw badRequest('categories has too many entries.');
    const names = list.map((name) => stringField(name, 'categories entries', LIMITS.categoryName, { required: true }));
    return [...new Set(names)];
};

const notesField = (value) => {
    const list = jsonArray(value, 'notes');
    if (list.length > LIMITS.notes) throw badRequest(`notes may have at most ${LIMITS.notes} items.`);
    return list.map((note) => {
        if (typeof note !== 'string') throw badRequest('notes entries must be text.');
        if (note.length > LIMITS.note) throw badRequest(`notes entries must be at most ${LIMITS.note} characters.`);
        return note;
    });
};

const boolField = (value, name) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    throw badRequest(`${name} must be "true" or "false".`);
};

// Validates the book form. `partial` (PUT): absent fields are left out so they stay unchanged.
// Categories are only checked for shape here; the controller checks they exist.
const parseBookFields = (body, { partial = false, now = new Date() } = {}) => {
    const input = body && typeof body === 'object' ? body : {};
    const out = {};
    const has = (key) => input[key] !== undefined;
    const field = (key, parse, required) => {
        if (has(key)) out[key] = parse(input[key]);
        else if (required && !partial) throw badRequest(`${key} is required.`);
    };
    field('title', (v) => stringField(v, 'title', LIMITS.title, { required: true }), true);
    field('author', (v) => stringField(v, 'author', LIMITS.author, { required: true }), true);
    field('publishingYear', (v) => yearField(v, 'publishingYear', now), true);
    field('categories', categoriesField);
    field('amazon', (v) => urlField(v, 'amazon'));
    field('perlego', (v) => urlField(v, 'perlego'));
    field('quote', (v) => stringField(v, 'quote', LIMITS.quote));
    field('notes', notesField);
    return out;
};

// ---- Uploaded images: trust the bytes, not the client-supplied mimetype ----

const IMAGE_TYPES = {
    jpeg: { mime: 'image/jpeg', ext: 'jpg' },
    png: { mime: 'image/png', ext: 'png' },
    gif: { mime: 'image/gif', ext: 'gif' },
    webp: { mime: 'image/webp', ext: 'webp' },
};

const startsWith = (buffer, bytes, offset = 0) =>
    buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);

// Returns { mime, ext } for JPEG/PNG/GIF/WebP, or null.
const detectImageType = (buffer) => {
    if (!Buffer.isBuffer(buffer)) return null;
    if (startsWith(buffer, [0xff, 0xd8, 0xff])) return IMAGE_TYPES.jpeg;
    if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return IMAGE_TYPES.png;
    if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return IMAGE_TYPES.gif;
    if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) return IMAGE_TYPES.webp;
    return null;
};

module.exports = {
    escapeRegex,
    isObjectId,
    isStringArray,
    toBookIds,
    HttpError,
    badRequest,
    LIMITS,
    stringField,
    yearField,
    urlField,
    categoriesField,
    notesField,
    boolField,
    parseBookFields,
    detectImageType,
    IMAGE_TYPES,
};
