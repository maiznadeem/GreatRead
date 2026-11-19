const express = require('express');
const multer = require('multer');
const admin = require('../controllers/adminController');
const { requireAuth } = require('../utils/requireAuth');
const { adminWriteLimiter } = require('../utils/rateLimiters');
const { IMAGE_TYPES } = require('../utils/validate');

const adminRoute = express.Router();

const ALLOWED_MIMES = new Set(Object.values(IMAGE_TYPES).map((type) => type.mime));

// One file field named "image", 5 MB, held in memory; the real type is verified from its bytes in the controller.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 20,
        parts: 25,
        fieldSize: 4 * 1024 * 1024, // notes: up to 200 items of 5000 characters, JSON-encoded
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.has(file.mimetype)) return cb(null, true);
        cb(Object.assign(new Error('image must be a JPEG, PNG, WebP or GIF file.'), { status: 400 }));
    },
});
const image = upload.single('image');

adminRoute.use(requireAuth, adminWriteLimiter);

adminRoute.get('/stats', admin.getStats);

adminRoute.get('/books', admin.listBooks);
adminRoute.get('/books/:id', admin.getBook);
adminRoute.post('/books', image, admin.createBook);
adminRoute.put('/books/:id', image, admin.updateBook);
adminRoute.delete('/books/:id', admin.deleteBook);

adminRoute.get('/categories', admin.listCategories);
adminRoute.post('/categories', image, admin.createCategory);
adminRoute.put('/categories/:id', image, admin.updateCategory);
adminRoute.delete('/categories/:id', admin.deleteCategory);

adminRoute.get('/toppicks', admin.getTopPicks);
adminRoute.put('/toppicks', admin.updateTopPicks);

module.exports = { adminRoute };
