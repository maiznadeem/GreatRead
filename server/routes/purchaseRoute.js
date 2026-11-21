const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { purchaseLimiter } = require('../utils/rateLimiters');
const { requireRecaptcha } = require('../utils/recaptcha');

const purchaseRoute = express.Router();

purchaseRoute.post('/', purchaseLimiter, requireRecaptcha('purchase'), purchaseController.authorizePurchase);

module.exports = { purchaseRoute };
