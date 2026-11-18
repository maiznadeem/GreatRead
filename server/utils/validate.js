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

module.exports = { escapeRegex, isObjectId, isStringArray, toBookIds };
