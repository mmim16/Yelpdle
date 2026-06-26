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

function parseRating(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 1 && value <= 5 ? value : null;
  }

  if (typeof value === "string") {
    const match = value.match(/\d+(?:\.\d+)?/);
    if (!match) return null;

    const rating = Number(match[0]);
    return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
  }

  return null;
}

function getBusinessRating(business) {
  const candidates = [
    business.rating,
    business.rating_text,
    business.stars,
    business.review_rating,
    business.reviews_rating,
    business.extensions?.rating,
    ...(Array.isArray(business.extensions) ? business.extensions : [])
  ];

  for (const candidate of candidates) {
    const rating = parseRating(candidate);
    if (rating !== null) return rating;
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

    const playableResults = results
      .map(business => ({
        business,
        rating: getBusinessRating(business),
        placeID: business.place_ids?.[0]
      }))
      .filter(result => result.rating !== null && result.placeID);

    if (playableResults.length === 0) {
      console.log(`Attempt ${attempts + 1}: No businesses with valid ratings found, retrying...`);
      return fetchValidGame(res, attempts + 1, maxAttempts);
    }

    const pickRand = Math.floor(Math.random() * playableResults.length);
    const { business, rating: trueRating, placeID: businessID } = playableResults[pickRand];

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


const port = process.env.PORT || 10000;

app.get("/api/game", (req, res) => {
  fetchValidGame(res);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
