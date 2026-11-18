const { v4: uuidv4 } = require('uuid');

const { storage, BOOKS_BUCKET } = require('../utils/storage');
const { escapeRegex, isObjectId, isStringArray } = require('../utils/validate');
const Book = require('../models/Book');
const TopPicks = require('../models/TopPicks');
const Category = require('../models/Category');
const Note = require('../models/Note');

const IMAGE_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};
const MAX_SEARCH_LENGTH = 100;
const PUBLIC_URL_PREFIX = `https://storage.googleapis.com/${BOOKS_BUCKET}/`;

// Stores an uploaded image under a generated name (never the client's filename) and returns its public URL.
async function saveImage(file, folderName) {
    const objectName = `${folderName}/${uuidv4()}.${IMAGE_EXTENSIONS[file.mimetype]}`;
    await storage.bucket(BOOKS_BUCKET).file(objectName).save(file.buffer, { contentType: file.mimetype });
    return PUBLIC_URL_PREFIX + objectName;
}

async function deleteImage(imageUrl) {
    if (imageUrl && imageUrl.startsWith(PUBLIC_URL_PREFIX)) {
        await storage.bucket(BOOKS_BUCKET).file(imageUrl.slice(PUBLIC_URL_PREFIX.length)).delete({ ignoreNotFound: true });
    }
}

const parseCategories = (value) => {
    try {
        const categories = typeof value === 'string' ? JSON.parse(value) : value;
        return isStringArray(categories) ? categories : null;
    } catch {
        return null;
    }
};

const searchRegex = (term) => ({ $regex: escapeRegex(term.slice(0, MAX_SEARCH_LENGTH)), $options: 'i' });

const checkDuplicateTitle = async (req, res, next) => {
    try {
        const title = req.body.title;
        if (typeof title !== 'string' || !title || title.length > 300) {
            return res.status(400).json({ error: 'A valid title is required.' });
        }
        const existingBook = await Book.findOne({ title: { $regex: `^${escapeRegex(title)}$`, $options: 'i' } });
        if (existingBook) {
            return res.status(409).json({
                error: 'Book with the same title already exists. Do you want to proceed with the upload?',
                confirmationRequired: true,
            });
        }
        next();
    } catch (error) {
        console.error('Error checking duplicate title:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


async function uploadBook(req, res) {

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const image = await saveImage(req.file, 'books');

        const newBook = new Book({
            title: req.body.title,
            author: req.body.author,
            publishingYear: req.body.publishingYear,
            categories: req.body.categories,
            amazon: req.body.amazon,
            perlego: req.body.perlego,
            quote: req.body.quote,
            image,
        });

        const newNote = new Note({
            content: req.body.notesArray,
        });
        await newNote.save();
        newBook.notes = newNote._id;
        await newBook.save();

        res.status(200).json({ message: 'Book uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Could not upload the file.' });
    }
}

async function getBook(req, res) {
    const bookId = req.params.id;
    if (!isObjectId(bookId)) {
        return res.status(400).json({ error: 'Invalid book id.' });
    }
    try {
        const book = await Book.findById(bookId).populate('notes');
        if (book) {
            res.json(book);
        } else {
            res.status(404).json({ error: 'Book not found' });
        }
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ error: 'Could not fetch the book.' });
    }
}

async function updateBook(req, res) {
    const bookId = req.body.bookId;
    const categories = parseCategories(req.body.categories);
    if (!isObjectId(bookId) || !categories) {
        return res.status(400).json({ error: 'Invalid book id or categories.' });
    }
    try {
        const existingBook = await Book.findById(bookId);
        if (!existingBook) {
            return res.status(404).json({ error: 'Book not found.' });
        }
        let imageUrl = existingBook.image;
        if (req.file) {
            await deleteImage(imageUrl);
            imageUrl = await saveImage(req.file, 'books');
        }
        let notesArray = [];
        if (req.body.notesArray) {
            notesArray = req.body.notesArray;
        }
        const existingNote = await Note.findById(existingBook.notes);
        let noteId = null;
        if (existingNote) {
            existingNote.content = notesArray;
            await existingNote.save();
            noteId = existingNote._id;
        } else {
            const newNote = new Note({ content: notesArray });
            await newNote.save();
            noteId = newNote._id;
        }
        const updatedBook = {
            title: req.body.updateTitle,
            author: req.body.updateAuthor,
            publishingYear: req.body.updatePublishingYear,
            categories: categories,
            amazon: req.body.amazon,
            perlego: req.body.perlego,
            quote: req.body.quote,
            image: imageUrl,
            notes: noteId,
        };
        await Book.findByIdAndUpdate(bookId, updatedBook);

        res.status(200).json({ message: 'Book updated successfully' });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Could not update the book.' });
    }
}

async function deleteBook(req, res) {
    const bookId = req.params.id;
    if (!isObjectId(bookId)) {
        return res.status(400).json({ error: 'Invalid book id.' });
    }
    try {
        const existingBook = await Book.findById(bookId);
        if (!existingBook) {
            return res.status(404).json({ error: 'Book not found.' });
        }
        await deleteImage(existingBook.image);
        await existingBook.deleteOne();

        res.status(200).json({ message: 'Book deleted successfully.' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Could not delete the book.' });
    }
}

async function searchBook(req, res) {
    try {
        const searchTerm = req.query.term;
        if (searchTerm !== undefined && typeof searchTerm !== 'string') {
            return res.status(400).json({ error: 'Invalid search term.' });
        }
        let books;
        if (!searchTerm || searchTerm.trim() === "") {
            books = await Book.find({}, { title: 1, author: 1 });
        } else {
            books = await Book.find({
                $or: [
                    { title: searchRegex(searchTerm) },
                    { author: searchRegex(searchTerm) },
                ],
            }, { title: 1, author: 1 });
        }
        res.json(books);
    } catch (error) {
        console.error('Error searching books:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function addCategory(req, res) {
    try {
        const { categoryName, isBestSeller } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No category image file uploaded.' });
        }
        if (typeof categoryName !== 'string' || !categoryName.trim()) {
            return res.status(400).json({ error: 'A category name is required.' });
        }

        const categoryImage = await saveImage(req.file, 'categories');

        const newCategory = new Category({
            name: categoryName,
            image: categoryImage,
            bestseller: isBestSeller || false,
        });

        await newCategory.save();

        res.status(200).json({ message: 'Category added successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Could not add the category.' });
    }
}


async function searchCategory(req, res) {
    try {
        const searchTerm = req.query.term;
        if (searchTerm !== undefined && typeof searchTerm !== 'string') {
            return res.status(400).json({ error: 'Invalid search term.' });
        }
        let categories;
        if (!searchTerm || searchTerm.trim() === "") {
            categories = await Category.find({}, { image: 0 });
        } else {
            categories = await Category.find({
                name: searchRegex(searchTerm),
            }, { image: 0 });
        }
        res.json(categories);
    } catch (error) {
        console.error('Error searching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteCategory(req, res) {
    const categoryId = req.body.categoryId;
    if (!isObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid category id' });
    }
    try {
        const existingCategory = await Category.findById(categoryId);
        if (!existingCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        await deleteImage(existingCategory.image);
        await existingCategory.deleteOne();
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateTopPicks(req, res) {
    const { month, year, book1Id, book2Id, book3Id } = req.body;
    if (![book1Id, book2Id, book3Id].every(isObjectId)) {
        return res.status(400).json({ message: 'Invalid book ids.' });
    }
    try {
        const existingTopPicks = await TopPicks.findOne();
        if (!existingTopPicks) {
            return res.status(404).json({ message: 'TopPicks document not found.' });
        }

        const previousBooks = existingTopPicks.books;
        if (previousBooks.length === 3) {
            await Promise.all(previousBooks.map(bookId =>
                Book.findByIdAndUpdate(bookId, { priority: 0 })
            ));
        }

        existingTopPicks.date.month = month;
        existingTopPicks.date.year = year;
        existingTopPicks.books = [book1Id, book2Id, book3Id];

        await Promise.all([
            Book.findByIdAndUpdate(book1Id, { priority: 5 }),
            Book.findByIdAndUpdate(book2Id, { priority: 5 }),
            Book.findByIdAndUpdate(book3Id, { priority: 5 })
        ]);

        await existingTopPicks.save();

        res.status(200).json({ message: 'TopPicks updated successfully.' });
    } catch (error) {
        console.error('Error updating TopPicks:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    IMAGE_EXTENSIONS,
    checkDuplicateTitle,
    uploadBook,
    getBook,
    updateBook,
    deleteBook,
    searchBook,
    addCategory,
    searchCategory,
    deleteCategory,
    updateTopPicks,
};
