const mongoose = require("mongoose");

// Share one connection attempt between simultaneous requests.
let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: "comp3123_assignment1",
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
  }

  try {
    return await connectionPromise;
  } finally {
    // Allow a fresh attempt after a failed or disconnected connection.
    connectionPromise = null;
  }
}

module.exports = connectDB;
