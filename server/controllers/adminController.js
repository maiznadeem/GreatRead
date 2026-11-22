const { randomUUID } = require('crypto');

const { storage, BOOKS_BUCKET } = require('../utils/storage');
const { compressImage } = require('../utils/images');
const {
    HttpError, badRequest, LIMITS, escapeRegex, isObjectId, stringField, boolField, parseBookFields, detectImageType,
} = require('../utils/validate');
const Book = require('../models/Book');
const TopPicks = require('../models/TopPicks');
const Category = require('../models/Category');
const Note = require('../models/Note');
const { log, errorFields } = require('../utils/log.js');

const PUBLIC_URL_PREFIX = `https://storage.googleapis.com/${BOOKS_BUCKET}/`;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;
const TOP_PICK_COUNT = 3;

// Handlers may throw HttpError (or let anything else bubble to the 500 handler in index.js).

// ---- Helpers ----

const requireId = (id, what) => {
    if (!isObjectId(id)) throw badRequest(`Invalid ${what} id.`);
    return id;
};

const searchFilter = (term, fields) => {
    if (term === undefined || term === '') return {};
    if (typeof term !== 'string' || term.length > LIMITS.search) throw badRequest(`term must be at most ${LIMITS.search} characters.`);
    const trimmed = term.trim();
    if (!trimmed) return {};
    const regex = { $regex: escapeRegex(trimmed), $options: 'i' };
    return fields.length === 1 ? { [fields[0]]: regex } : { $or: fields.map((field) => ({ [field]: regex })) };
};

// Verifies the bytes really are a supported image; returns { mime, ext }.
function requireImage(file) {
    const type = file && detectImageType(file.buffer);
    if (!type) throw badRequest('image must be a JPEG, PNG, WebP or GIF file.');
    return type;
}

// Compresses an image and stores it under a generated name (never the client's filename); returns its public URL.
async function saveImage(file, folderName) {
    requireImage(file);
    let image;
    try {
        image = await compressImage(file.buffer, folderName);
    } catch (error) {
        throw badRequest('image could not be processed.');
    }
    const objectName = `${folderName}/${randomUUID()}.${image.ext}`;
    await storage.bucket(BOOKS_BUCKET).file(objectName).save(image.buffer, {
        contentType: image.mime,
        metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    });
    return PUBLIC_URL_PREFIX + objectName;
}

// Best effort: a leftover object must never fail a request whose database change already succeeded.
async function deleteImage(imageUrl) {
    if (!imageUrl || !imageUrl.startsWith(PUBLIC_URL_PREFIX)) return;
    try {
        await storage.bucket(BOOKS_BUCKET).file(imageUrl.slice(PUBLIC_URL_PREFIX.length)).delete({ ignoreNotFound: true });
    } catch (error) {
        log.warn('image_delete_failed', 'Could not delete image', { image: imageUrl, ...errorFields(error) });
    }
}

async function requireExistingCategories(names) {
    if (!names.length) return;
    const found = await Category.countDocuments({ name: { $in: names } });
    if (found !== names.length) throw badRequest('categories must all be existing category names.');
}

const titleMatch = (title) => ({ $regex: `^${escapeRegex(title)}$`, $options: 'i' });

async function rejectDuplicateTitle(title, body, excludeId) {
    if (body.allowDuplicate === 'true' || body.allowDuplicate === true) return;
    const filter = { title: titleMatch(title) };
    if (excludeId) filter._id = { $ne: excludeId };
    if (await Book.exists(filter)) {
        throw new HttpError(409, 'A book with this title already exists.', 'DUPLICATE_TITLE');
    }
}

const isDuplicateKey = (error) => error && error.code === 11000;

// ---- Stats ----

async function getStats(req, res) {
    const [books, categories, topPicks] = await Promise.all([
        Book.countDocuments(),
        Category.countDocuments(),
        TopPicks.findOne().lean(),
    ]);
    const { month, year } = topPicks?.date || {};
    res.json({ books, categories, topPicks: month && year ? { month, year } : null });
}

// ---- Books ----

const BOOK_SORTS = {
    title: { title: 1, _id: 1 },
    newest: { createdAt: -1, _id: -1 },
};

// Reads a positive integer query param, falling back to `fallback` and clamping to [1, max].
const intParam = (value, fallback, max) => {
    const n = typeof value === 'string' && /^\d{1,6}$/.test(value) ? Number(value) : fallback;
    return Math.min(Math.max(n, 1), max);
};

// GET /admin/books?term=&page=1&limit=24&sort=title|newest
async function listBooks(req, res) {
    const filter = searchFilter(req.query.term, ['title', 'author']);
    const sort = Object.hasOwn(BOOK_SORTS, req.query.sort) ? BOOK_SORTS[req.query.sort] : BOOK_SORTS.title;
    const limit = intParam(req.query.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const total = await Book.countDocuments(filter);
    const pages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(intParam(req.query.page, 1, 100000), pages);
    const books = await Book.find(filter, 'title author publishingYear image categories')
        .collation({ locale: 'en' })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    res.json({ books, total, page, pages, limit });
}

async function getBook(req, res) {
    const book = await Book.findById(requireId(req.params.id, 'book')).populate('notes').lean();
    if (!book) throw new HttpError(404, 'Book not found.');
    res.json({
        book: {
            _id: book._id,
            title: book.title,
            author: book.author,
            publishingYear: book.publishingYear,
            categories: book.categories || [],
            amazon: book.amazon || '',
            perlego: book.perlego || '',
            quote: book.quote || '',
            image: book.image,
            notes: book.notes?.content || [],
            priority: book.priority || 0,
        },
    });
}

async function createBook(req, res) {
    const fields = parseBookFields(req.body);
    requireImage(req.file);
    await requireExistingCategories(fields.categories || []);
    await rejectDuplicateTitle(fields.title, req.body);

    const image = await saveImage(req.file, 'books');
    let note;
    try {
        note = await Note.create({ content: fields.notes || [] });
        const book = await Book.create({
            title: fields.title,
            author: fields.author,
            publishingYear: fields.publishingYear,
            categories: fields.categories || [],
            amazon: fields.amazon || '',
            perlego: fields.perlego || '',
            quote: fields.quote || '',
            image,
            notes: note._id,
        });
        res.status(201).json({ message: 'Book created.', id: book._id });
    } catch (error) {
        await deleteImage(image);
        if (note) await Note.deleteOne({ _id: note._id }).catch(() => {});
        throw error;
    }
}

async function updateBook(req, res) {
    const id = requireId(req.params.id, 'book');
    const fields = parseBookFields(req.body, { partial: true });
    const existing = await Book.findById(id);
    if (!existing) throw new HttpError(404, 'Book not found.');
    if (req.file) requireImage(req.file);
    if (fields.categories) await requireExistingCategories(fields.categories);
    if (fields.title) await rejectDuplicateTitle(fields.title, req.body, existing._id);

    const newImage = req.file ? await saveImage(req.file, 'books') : null;
    try {
        const { notes, ...bookFields } = fields;
        const update = { ...bookFields };
        if (newImage) update.image = newImage;
        if (notes) {
            const note = existing.notes
                ? await Note.findByIdAndUpdate(existing.notes, { content: notes }, { upsert: true, returnDocument: 'after' })
                : await Note.create({ content: notes });
            update.notes = note._id;
        }
        await Book.updateOne({ _id: id }, { $set: update }, { runValidators: true });
    } catch (error) {
        await deleteImage(newImage);
        throw error;
    }
    // Only now that the database points at the new image is the old object safe to remove.
    if (newImage) await deleteImage(existing.image);
    res.json({ message: 'Book updated.' });
}

async function deleteBook(req, res) {
    const id = requireId(req.params.id, 'book');
    const existing = await Book.findById(id);
    if (!existing) throw new HttpError(404, 'Book not found.');
    if (await TopPicks.exists({ books: existing._id })) {
        throw new HttpError(409, 'This book is a current top pick. Replace it in Top picks first.', 'TOP_PICK');
    }
    await Book.deleteOne({ _id: id });
    if (existing.notes) await Note.deleteOne({ _id: existing.notes }).catch((e) => log.warn('note_delete_failed', 'Could not delete note', errorFields(e)));
    await deleteImage(existing.image);
    res.json({ message: 'Book deleted.' });
}

// ---- Categories ----

async function listCategories(req, res) {
    const filter = searchFilter(req.query.term, ['name']);
    const [categories, counts] = await Promise.all([
        Category.find(filter).collation({ locale: 'en' }).sort({ name: 1 }).limit(1000).lean(),
        // setUnion de-duplicates names within a book so each book counts once per category.
        Book.aggregate([
            { $project: { categories: { $setUnion: [{ $ifNull: ['$categories', []] }, []] } } },
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
        ]),
    ]);
    const countByName = new Map(counts.map((row) => [row._id, row.count]));
    res.json({
        categories: categories.map((c) => ({
            _id: c._id,
            name: c.name,
            image: c.image,
            bestseller: !!c.bestseller,
            bookCount: countByName.get(c.name) || 0,
        })),
    });
}

const categoryName = (value) => stringField(value, 'name', LIMITS.categoryName, { required: true });

async function rejectDuplicateName(name, excludeId) {
    const filter = { name: titleMatch(name) };
    if (excludeId) filter._id = { $ne: excludeId };
    if (await Category.exists(filter)) {
        throw new HttpError(409, 'A category with this name already exists.', 'DUPLICATE_NAME');
    }
}

async function createCategory(req, res) {
    const body = req.body || {};
    if (body.name === undefined) throw badRequest('name is required.');
    const name = categoryName(body.name);
    const bestseller = body.bestseller === undefined ? false : boolField(body.bestseller, 'bestseller');
    requireImage(req.file);
    await rejectDuplicateName(name);

    const image = await saveImage(req.file, 'categories');
    try {
        const category = await Category.create({ name, image, bestseller });
        res.status(201).json({ message: 'Category created.', id: category._id });
    } catch (error) {
        await deleteImage(image);
        if (isDuplicateKey(error)) throw new HttpError(409, 'A category with this name already exists.', 'DUPLICATE_NAME');
        throw error;
    }
}

async function updateCategory(req, res) {
    const id = requireId(req.params.id, 'category');
    const body = req.body || {};
    const existing = await Category.findById(id);
    if (!existing) throw new HttpError(404, 'Category not found.');

    const update = {};
    if (body.name !== undefined) update.name = categoryName(body.name);
    if (body.bestseller !== undefined) update.bestseller = boolField(body.bestseller, 'bestseller');
    if (req.file) requireImage(req.file);
    const renamed = update.name !== undefined && update.name !== existing.name;
    if (renamed) await rejectDuplicateName(update.name, existing._id);

    const newImage = req.file ? await saveImage(req.file, 'categories') : null;
    if (newImage) update.image = newImage;
    try {
        await Category.updateOne({ _id: id }, { $set: update }, { runValidators: true });
    } catch (error) {
        await deleteImage(newImage);
        if (isDuplicateKey(error)) throw new HttpError(409, 'A category with this name already exists.', 'DUPLICATE_NAME');
        throw error;
    }
    if (renamed) {
        await Book.updateMany(
            { categories: existing.name },
            { $set: { 'categories.$[c]': update.name } },
            { arrayFilters: [{ c: existing.name }] },
        );
    }
    if (newImage) await deleteImage(existing.image);
    res.json({ message: 'Category updated.' });
}

async function deleteCategory(req, res) {
    const id = requireId(req.params.id, 'category');
    const existing = await Category.findById(id);
    if (!existing) throw new HttpError(404, 'Category not found.');
    await Category.deleteOne({ _id: id });
    await Book.updateMany({ categories: existing.name }, { $pull: { categories: existing.name } });
    await deleteImage(existing.image);
    res.json({ message: 'Category deleted.' });
}

// ---- Top picks ----

async function getTopPicks(req, res) {
    const topPicks = await TopPicks.findOne()
        .populate({ path: 'books', model: 'Book', select: 'title author image' })
        .lean();
    res.json({
        month: topPicks?.date?.month ?? null,
        year: topPicks?.date?.year ?? null,
        books: (topPicks?.books || []).map(({ _id, title, author, image }) => ({ _id, title, author, image })),
    });
}

const intInRange = (value, name, min, max) => {
    if (!Number.isInteger(value) || value < min || value > max) throw badRequest(`${name} must be a whole number from ${min} to ${max}.`);
    return value;
};

async function updateTopPicks(req, res) {
    const body = req.body || {};
    const month = intInRange(body.month, 'month', 1, 12);
    const year = intInRange(body.year, 'year', 2000, 2100);
    const { bookIds } = body;
    if (!Array.isArray(bookIds) || bookIds.length !== TOP_PICK_COUNT || !bookIds.every(isObjectId)
        || new Set(bookIds.map((id) => id.toLowerCase())).size !== TOP_PICK_COUNT) {
        throw badRequest(`bookIds must be ${TOP_PICK_COUNT} distinct book ids.`);
    }
    if (await Book.countDocuments({ _id: { $in: bookIds } }) !== TOP_PICK_COUNT) {
        throw badRequest('bookIds must all be existing books.');
    }

    const previous = await TopPicks.findOne().lean();
    if (previous?.books?.length) {
        await Book.updateMany({ _id: { $in: previous.books } }, { $set: { priority: 0 } });
    }
    await Book.updateMany({ _id: { $in: bookIds } }, { $set: { priority: 5 } });
    await TopPicks.findOneAndUpdate({}, { $set: { date: { month, year }, books: bookIds } }, { upsert: true });
    res.json({ message: 'Top picks updated.' });
}

module.exports = {
    getStats,
    listBooks,
    getBook,
    createBook,
    updateBook,
    deleteBook,
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getTopPicks,
    updateTopPicks,
};
