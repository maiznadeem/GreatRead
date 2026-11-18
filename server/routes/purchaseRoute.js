const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { purchaseLimiter } = require('../utils/rateLimiters');

const purchaseRoute = express.Router();

purchaseRoute.post('/', purchaseLimiter, purchaseController.authorizePurchase);

module.exports = { purchaseRoute };
