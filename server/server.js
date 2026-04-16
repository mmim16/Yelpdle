//backend should go
const { getJson } = require("serpapi");
const express = require("express");
const cors = require('cors');
const app = express();
app.use(cors());

app.get("/api/game", (req, res) => {
    //first find a business

    getJson({
        engine: "yelp",
        find_desc: "food",
        find_loc: "New Brunswick, New Jersey, United States",
        api_key: "1caaf9f9790e745ee0ae0e72a6fd68b1db3b40c5147d1af18c64682548ab0b40"
    }, (searchJson) => {

        const business = searchJson["organic_results"][0];
        const businessID = business.place_ids[0];
        const trueRating = business.rating;

        //business's reviews

        getJson({
            engine: "yelp_reviews",
            place_id: businessID,
            api_key: "1caaf9f9790e745ee0ae0e72a6fd68b1db3b40c5147d1af18c64682548ab0b40"
        }, (reviewJson) => {
            const gameData = {
                name: business.title,
                rating: trueRating,
                reviews: reviewJson["reviews"].map(rev => ({
                    text: rev.comment,
                    photo: rev.images ? rev.images[0] : null,
                    user: rev.username
                }))
            };

            res.json(gameData);
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log('Live server; listening on http://localhost:${PORT}');
});