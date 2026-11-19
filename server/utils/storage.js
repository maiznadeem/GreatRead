const { Storage } = require('@google-cloud/storage');

// Application Default Credentials: the attached service account on Cloud Run,
// service account impersonation locally (see README).
const storage = new Storage();

module.exports = {
    storage,
    // Both buckets live in maiz-portfolio (us-central1). Purchases auto-delete after a day.
    BOOKS_BUCKET: process.env.GCS_BUCKET || 'greatread-books',
    PURCHASE_BUCKET: process.env.GCS_PURCHASE_BUCKET || 'greatread-purchases',
};
