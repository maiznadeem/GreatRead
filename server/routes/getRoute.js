const express = require('express');
const mongoose = require('mongoose');
const getRoute = express.Router();
const Book = require('../models/Book');
const TopPicks = require('../models/TopPicks');
const Quote = require('../models/Quote');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const stripe = require('../utils/stripe');
const { fulfillPayment } = require('../controllers/purchaseController');
const { escapeRegex, isObjectId, isStringArray, toBookIds } = require('../utils/validate');
const { getPaymentLimiter } = require('../utils/rateLimiters');

const MAX_SEARCH_LENGTH = 100;
const MAX_OFFSET = 100000;

getRoute.post('/books', async (req, res) => {
    const { offset, limit, categories, searchTerm } = req.body;
    if ((searchTerm != null && typeof searchTerm !== 'string')
        || (categories != null && !isStringArray(categories))) {
        return res.status(400).json({ error: 'Invalid request.' });
    }
    try {
        let offsetNum = Math.min(Math.max(parseInt(offset) || 0, 0), MAX_OFFSET);
        let limitNum = Math.min(Math.max(parseInt(limit) || 96, 1), 200);

        let query = Book.find().sort({ priority: -1, _id: 1 });

        let totalCountQuery = Book.find();

        if (searchTerm) {
            const searchRegex = new RegExp(escapeRegex(searchTerm.slice(0, MAX_SEARCH_LENGTH)), 'i');
            query = query.or([{ title: searchRegex }, { author: searchRegex }]);
            totalCountQuery = totalCountQuery.or([{ title: searchRegex }, { author: searchRegex }]);
        }

        if (categories && categories.length > 0) {
            query = query.where('categories').in(categories);
            totalCountQuery = totalCountQuery.where('categories').in(categories);
        }

        query = query.skip(offsetNum).limit(limitNum);

        let books = await query.exec();

        const totalCount = await totalCountQuery.countDocuments().exec();

        res.json({
            books,
            totalCount,
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



getRoute.get('/toppicks', async (req, res) => {
    try {
        const topPicks = await TopPicks.findOne().populate({
            path: 'books',
            model: 'Book'
        }).exec();     
        if (!topPicks) {
            return res.status(404).json({ message: 'No top picks found' });
        }
        res.json(topPicks);
    } catch (error) {
        console.error('Error fetching top picks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

getRoute.get('/quotes', async (req, res) => {
    try {
        const quotes = await Quote.find();
        res.json(quotes);
    } catch (error) {
        console.error('Error fetching quotes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

getRoute.get('/randomquotes', async (req, res) => {
    try {
        // Sampled by the database so the whole collection is never loaded into memory.
        const response = await Book.aggregate([
            { $sample: { size: 12 } },
            { $project: { _id: 0, title: 1, quote: 1 } },
        ]);
        res.json(response);
    } catch (error) {
        console.error('Error fetching random quotes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

getRoute.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ bestseller: false });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


async function getRandomBooksByCategoriesFromDB(categories, goal, bookIds) {
    try {
        // Sampled by the database; aggregate() does not cast ids, so convert them explicitly.
        return await Book.aggregate([
            {
                $match: {
                    categories: { $in: categories },
                    _id: { $nin: bookIds.map((id) => new mongoose.Types.ObjectId(id)) },
                },
            },
            { $sample: { size: goal } },
        ]);
    } catch (error) {
        console.error('Error fetching books by categories:', error);
        throw new Error('Could not fetch books by categories from the database.');
    }
}

getRoute.post('/getRandomBooks', async (req, res) => {
    const { categories, goal, books } = req.body;
    const bookIds = toBookIds(books ?? [], 100);
    const goalNum = Number(goal);
    if (!isStringArray(categories) || !bookIds || !Number.isInteger(goalNum) || goalNum < 1 || goalNum > 100) {
        return res.status(400).json({ error: 'Invalid request.' });
    }
    try {
        const randomBooks = await getRandomBooksByCategoriesFromDB(categories, goalNum, bookIds);
        res.json(randomBooks);
    } catch (error) {
        console.error('Error fetching random books by categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

getRoute.post('/getPayment', getPaymentLimiter, async (req, res) => {
    const { sessionId } = req.body;

    if (!isObjectId(sessionId)) {
        return res.status(400).json({ error: 'Invalid payment id' });
    }

    try {
        let payment = await Payment.findById(sessionId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const wasFetchedBefore = payment.fetchedBefore;

        if (!payment.success && payment.stripeId) {
            try {
                const session = await stripe.checkout.sessions.retrieve(payment.stripeId);
                if (session.payment_status === 'paid') {
                    await Payment.updateOne({ _id: payment._id }, { $set: { success: true } });
                    payment.success = true;
                }
            } catch (err) {
                console.error('Error verifying Stripe session:', err.message);
            }
        }

        let processing = false;
        let generationFailed = false;
        if (payment.success && !payment.urls?.length) {
            const fulfilled = await fulfillPayment(payment);
            if (fulfilled) {
                payment = fulfilled;
                generationFailed = !payment.urls?.length;
            } else {
                processing = true;
            }
        }

        if (!wasFetchedBefore) {
            await Payment.updateOne({ _id: payment._id }, { $set: { fetchedBefore: true } });
        }

        await payment.populate({ path: 'books', select: '-notes' });
        const result = payment.toObject();
        result.fetchedBefore = wasFetchedBefore;
        if (!result.success) {
            result.urls = [];
        }
        if (processing) {
            result.urls = [];
            result.processing = true;
        }
        if (generationFailed) {
            result.generationFailed = true;
        }

        return res.json(result);
    } catch (error) {
        console.error('Error retrieving payment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = { getRoute };