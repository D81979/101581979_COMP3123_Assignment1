const { createHash } = require("crypto");
const mongoose = require("mongoose");
const connectDB = require("../config/db");

let indexPromise;

async function getCollection() {
  await connectDB();
  const collection = mongoose.connection.db.collection("rate_limits");

  // MongoDB removes expired counters automatically.
  if (!indexPromise) {
    indexPromise = collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    ).catch((error) => {
      indexPromise = null;
      throw error;
    });
  }
  await indexPromise;
  return collection;
}

class MongoRateLimitStore {
  constructor(name) {
    // Keep local, preview, and production counters separate.
    const environment = process.env.VERCEL
      ? process.env.VERCEL_ENV || "production"
      : "local";
    this.prefix = `${environment}:${name}:`;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  getWindow(key) {
    const windowStart = Math.floor(Date.now() / this.windowMs) * this.windowMs;
    const hash = createHash("sha256").update(key).digest("hex");
    return {
      id: `${this.prefix}${windowStart}:${hash}`,
      resetTime: new Date(windowStart + this.windowMs),
    };
  }

  async increment(key) {
    const collection = await getCollection();
    const { id, resetTime } = this.getWindow(key);
    const filter = { _id: id };
    const update = {
      $inc: { hits: 1 },
      $setOnInsert: { expiresAt: resetTime },
    };
    const options = {
      upsert: true,
      returnDocument: "after",
      includeResultMetadata: false,
    };

    let counter;
    try {
      // One atomic operation keeps concurrent requests accurate.
      counter = await collection.findOneAndUpdate(filter, update, options);
    } catch (error) {
      if (error.code !== 11000) throw error;
      // Another instance may have inserted the first counter at the same time.
      counter = await collection.findOneAndUpdate(filter, update, options);
    }

    return { totalHits: counter.hits, resetTime };
  }

  async decrement(key) {
    const collection = await getCollection();
    const { id } = this.getWindow(key);
    await collection.updateOne(
      { _id: id, hits: { $gt: 0 } },
      { $inc: { hits: -1 } }
    );
  }

  async resetKey(key) {
    const collection = await getCollection();
    const { id } = this.getWindow(key);
    await collection.deleteOne({ _id: id });
  }
}

module.exports = MongoRateLimitStore;
