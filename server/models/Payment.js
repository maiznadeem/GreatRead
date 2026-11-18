const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    stripeId: {
        type: String,
    },
    url: {
        type: String,
    },
    amount: {
        type: String,
        required: true,
    },
    success: {
        type: Boolean,
        default: false,
    },
    previewOptions: {
        type: Object,
        required: true,
    },
    selectedButton: {
        type: String,
        default: null,
    },
    books: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
    }],
    categories: [{
        type: String,
    }],
    urls: [{
        type: String,
    }],
    urlsGeneratedAt: {
        type: Date,
    },
    generatingAt: {
        type: Date,
    },
    fetchedBefore: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
