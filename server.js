// Load settings from .env
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;

// Start the local server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});