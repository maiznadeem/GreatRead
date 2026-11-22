const stripe = require('../utils/stripe');
const Payment = require('../models/Payment');
const { fulfillPayment } = require('../controllers/purchaseController');
const { log, errorFields, errorType } = require('../utils/log.js');

const PAID_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

// Mounted with express.raw() so the signature is verified against the exact body.
const stripeWebhook = async (req, res) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        log.warn('webhook_signature_invalid', 'Stripe webhook signature did not verify', errorType(err));
        return res.sendStatus(400);
    }

    try {
        const session = event.data.object;
        if (PAID_EVENTS.includes(event.type) && session.payment_status === 'paid') {
            const payment = await Payment.findOneAndUpdate(
                { stripeId: session.id },
                { $set: { success: true } },
                { returnDocument: 'after' }
            );
            if (payment) {
                await fulfillPayment(payment);
                log.info('payment_succeeded', 'Payment successful', { session: session.id });
            } else {
                log.warn('payment_not_found', 'Payment not found for Stripe session', { session: session.id });
            }
        } else {
            log.debug('webhook_unhandled', 'Unhandled Stripe event type', { type: event.type });
        }
        res.sendStatus(200);
    } catch (error) {
        log.error('webhook_failed', 'Could not handle Stripe webhook event', errorFields(error));
        res.sendStatus(500);
    }
};

module.exports = { stripeWebhook };
