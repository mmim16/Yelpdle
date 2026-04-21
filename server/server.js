const { getJson } = require("serpapi");
const express = require("express");
const cors = require('cors');
const app = express();
app.use(cors());

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


const MAX_REVIEW_LENGTH = 300;
const API_KEY = process.env.YELP_KEY;

const SEARCH_TERMS = [
  "restaurants", "food", "breakfast", "lunch", "dinner",
  "pizza", "sushi", "tacos", "burgers", "coffee",
  "bakery", "seafood", "bbq", "ramen", "brunch"
];

function getPhotoUrl(rev) {
  if (rev.photos && rev.photos.length > 0) {
    return rev.photos[0].link || null;
  }
  return null;
}

function buildHints(reviewJson) {
  const allReviews = reviewJson["reviews"] || [];

  const mapped = allReviews
    .map(rev => ({
      text: rev.comment?.text || "",
      photo: getPhotoUrl(rev),
      user: rev.user?.name || "Anonymous"
    }))
    .filter(r => r.text.trim().length > 10);

  if (mapped.length === 0) return null;

  const shortWithPhoto    = mapped.filter(r => r.photo && r.text.length <= MAX_REVIEW_LENGTH);
  const shortWithoutPhoto = mapped.filter(r => !r.photo && r.text.length <= MAX_REVIEW_LENGTH);
  const longWithPhoto     = mapped.filter(r => r.photo && r.text.length > MAX_REVIEW_LENGTH);
  const longWithoutPhoto  = mapped.filter(r => !r.photo && r.text.length > MAX_REVIEW_LENGTH);

  const textPool  = [...shortWithoutPhoto, ...longWithoutPhoto, ...shortWithPhoto, ...longWithPhoto];
  const imagePool = [...shortWithPhoto, ...longWithPhoto];

  const imageHint = imagePool[0] || null;
  const textOnly  = imageHint ? textPool.filter(r => r !== imageHint) : textPool;

  const hint1 = textOnly[0] || null;
  const hint2 = textOnly[1] || null;
  const hint3 = imageHint || textOnly[2] || null;

  const hints = [hint1, hint2, hint3].filter(Boolean);

  if (hints.length === 0) return null;

  // Truncate long text hints
  return hints.map((h, i) => {
    const isImageHint = i === 2 && h.photo;
    if (!isImageHint && h.text.length > MAX_REVIEW_LENGTH) {
      return { ...h, text: h.text.slice(0, MAX_REVIEW_LENGTH).trimEnd() + "…" };
    }
    return h;
  });
}

// Tries up to maxAttempts times to find a business with valid hints
function fetchValidGame(res, attempts = 0, maxAttempts = 5) {
  if (attempts >= maxAttempts) {
    return res.status(500).json({ error: "Could not find a business with valid reviews. Try again." });
  }

  const randomTerm   = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
  const randomOffset = Math.floor(Math.random() * 5) * 10;

  getJson({
    engine: "yelp",
    find_desc: randomTerm,
    find_loc: "New Jersey, United States",
    start: randomOffset,
    api_key: API_KEY
  }, (searchJson) => {

    const results = searchJson["organic_results"] || [];
    if (results.length === 0) {
      console.log(`Attempt ${attempts + 1}: No businesses found, retrying...`);
      return fetchValidGame(res, attempts + 1, maxAttempts);
    }

    const pickRand  = Math.floor(Math.random() * results.length);
    const business  = results[pickRand];
    const businessID = business.place_ids[0];
    const trueRating = business.rating;

    const reviewStart = Math.floor(Math.random() * 3) * 10;

    getJson({
      engine: "yelp_reviews",
      place_id: businessID,
      start: reviewStart,
      api_key: API_KEY
    }, (reviewJson) => {

      const hints = buildHints(reviewJson);

      if (!hints) {
        console.log(`Attempt ${attempts + 1}: No valid hints for "${business.title}", retrying...`);
        return fetchValidGame(res, attempts + 1, maxAttempts);
      }

      console.log(`Success on attempt ${attempts + 1}: "${business.title}" with ${hints.length} hints`);

      res.json({
        name: business.title,
        rating: trueRating,
        reviews: hints
      });
    });
  });
}

app.get("/api/game", (req, res) => {
  fetchValidGame(res);
});

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// Point to the 'dist' folder Vite created
const distPath = path.resolve(__dirname, '../client/vite-project/dist');
app.use(express.static(distPath));

// For any route that isn't an API route, send the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
