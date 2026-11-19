const mongoose = require('mongoose');

const COLLECTION = 'rateLimits';

// Update pipeline for one hit: starts a new window when the stored one has expired (or the
// document does not exist yet, via upsert), otherwise increments. Every field in a single $set
// reads the document as it was before the stage, so `count` sees the old `expiresAt`.
const buildIncrementPipeline = (now, windowMs) => {
    const expired = { $lte: [{ $ifNull: ['$expiresAt', new Date(0)] }, now] };
    return [{
        $set: {
            count: { $cond: [expired, 1, { $add: [{ $ifNull: ['$count', 0] }, 1] }] },
            expiresAt: { $cond: [expired, new Date(now.getTime() + windowMs), '$expiresAt'] },
        },
    }];
};

// express-rate-limit store shared by every Cloud Run instance through MongoDB.
// One store per limiter: `prefix` keeps the limiters' counters apart.
class MongoRateLimitStore {
    // Express-rate-limit v8 only treats a store as shared-safe when it declares this.
    localKeys = false;

    // `getCollection` is injectable for tests; by default it resolves lazily so that
    // requiring this module never touches the database.
    constructor({ prefix, getCollection = () => mongoose.connection.collection(COLLECTION), now = () => new Date() }) {
        this.prefix = prefix;
        this.getCollection = getCollection;
        this.now = now;
        this.windowMs = 60 * 1000;
    }

    init(options) {
        this.windowMs = options.windowMs;
    }

    _id(key) {
        return `${this.prefix}:${key}`;
    }

    async increment(key) {
        await MongoRateLimitStore.ensureIndex(this.getCollection());
        // mongodb driver >= 6 returns the document itself (or null), not { value }.
        const doc = await this.getCollection().findOneAndUpdate(
            { _id: this._id(key) },
            buildIncrementPipeline(this.now(), this.windowMs),
            { upsert: true, returnDocument: 'after' },
        );
        return { totalHits: doc.count, resetTime: doc.expiresAt };
    }

    async decrement(key) {
        await this.getCollection().updateOne({ _id: this._id(key), count: { $gt: 0 } }, { $inc: { count: -1 } });
    }

    async resetKey(key) {
        await this.getCollection().deleteOne({ _id: this._id(key) });
    }

    // TTL index, created lazily once per process. A failure is retried on the next request and
    // never blocks counting (expired documents are also reset in the pipeline).
    static ensureIndex(collection) {
        if (!MongoRateLimitStore.indexPromise) {
            MongoRateLimitStore.indexPromise = collection
                .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
                .catch((error) => {
                    MongoRateLimitStore.indexPromise = null;
                    console.error('Could not create the rateLimits TTL index:', error.message);
                });
        }
        return MongoRateLimitStore.indexPromise;
    }
}

MongoRateLimitStore.indexPromise = null;

module.exports = { MongoRateLimitStore, buildIncrementPipeline };
