const mongoose = require("mongoose");

async function connectDB() {
  // Make sure the connection setting exists
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  // Connect to the assignment database
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "comp3123_assignment1",
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected successfully");
}

module.exports = connectDB;