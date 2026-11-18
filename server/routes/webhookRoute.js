const stripe = require('../utils/stripe');
const Payment = require('../models/Payment');
const { fulfillPayment } = require('../controllers/purchaseController');

const PAID_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

// Mounted with express.raw() so the signature is verified against the exact body.
const stripeWebhook = async (req, res) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Error verifying webhook signature:', err.message);
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
                console.log('Payment successful. Session ID:', session.id);
            } else {
                console.log('Payment not found. Session ID:', session.id);
            }
        } else {
            console.log('Unhandled event type:', event.type);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook event:', error.message);
        res.sendStatus(500);
    }
};

module.exports = { stripeWebhook };
