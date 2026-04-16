//backend should go
const { getJson } = require("serpapi");

getJson({
  engine: "yelp",
  find_desc: "food",
  find_loc: "New Brunswick, New Jersey, United States",
  api_key: "1caaf9f9790e745ee0ae0e72a6fd68b1db3b40c5147d1af18c64682548ab0b40"
}, (json) => {
  console.log(json["organic_results"]);
});