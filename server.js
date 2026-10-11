// Load private settings before starting
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start the API after the database connects
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    // Keep connection credentials out of the terminal
    console.error(
      "Startup failed. Check your .env, Atlas database user, and IP access."
    );
    console.error("Error type:", error.name);
    process.exit(1);
  }
}

startServer();