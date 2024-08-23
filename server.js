const express = require("express");
const path = require("path");
const scrape = require("./api/scrape");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API route for scraping
app.post("/scrape", scrape);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
