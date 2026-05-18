const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

mongoose.Promise = global.Promise;

const MONGODB_URL = process.env.DATABASE;

if (!MONGODB_URL) {
  console.error(
    "DATABASE is not set. Add it in Vercel Project Settings → Environment Variables (config.env is not deployed)."
  );
} else {
  const globalCache = global;

  if (!globalCache._mongooseCache) {
    globalCache._mongooseCache = { conn: null, promise: null };
  }

  const cache = globalCache._mongooseCache;

  if (!cache.conn) {
    if (!cache.promise) {
      cache.promise = mongoose
        .connect(MONGODB_URL, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(function (mongooseInstance) {
          console.log("Database Connected Successfully");
          return mongooseInstance;
        })
        .catch(function (e) {
          cache.promise = null;
          console.error("Database connection error:", e.message);
          console.error(
            "Check MongoDB Atlas credentials and Network Access (allow 0.0.0.0/0 for Vercel)."
          );
          return null;
        });
    }

    cache.conn = cache.promise;
  }
}

module.exports = mongoose;
