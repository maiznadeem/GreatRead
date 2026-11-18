const { Storage } = require('@google-cloud/storage');

// Application Default Credentials: the attached service account on Cloud Run,
// GOOGLE_APPLICATION_CREDENTIALS locally.
const storage = new Storage();

module.exports = {
    storage,
    BOOKS_BUCKET: process.env.GCS_BUCKET || 'great-read-bucket',
    PURCHASE_BUCKET: process.env.GCS_PURCHASE_BUCKET || 'great-read-purchase',
};
