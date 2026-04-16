import { useState } from "react";
//import axios from "axios"; //fetch yelp reviews

export default function Game() {
  //Variables
  const [review, setReview] = useState(""); //holds review text
  const [rating, setRating] = useState(null);   //holds actual rating
  const [guess, setGuess] = useState(null);     //holds user's guess
  const [score, setScore] = useState(0);       //holds score
  const [showResult, setShowResult] = useState(false); //controls result display
  const [showReview, setShowReview] = useState(false); //controls review display
  const [message, setMessage] = useState(""); //holds feedback message
  
  //Functions
  async function getReview() {  //gets the review from yelp api
  //  const output = await axios.get("http://localhost:5000/review");
  //  setReview(output.data.text);       //saves the review
  //  setRating(output.data.rating);       //saves the rating
    setGuess(null);
    setMessage("");
    setShowResult(false);
    setShowReview(true);
  }

  function getGuess(num) {  //gets the guess from the user
    setGuess(num);
  }

  function submitAnswer(){  //Submits and shows the result section
    if (guess === rating) {
      setScore(score + 1);
      setMessage("Yay, you got it correct :)");
    }
    else {
      setMessage("Oh no, you were not correct :(");
    }
    setShowResult(true);
  }

  function getStarIcon(num){
    if(!num) return null;
    return Array.from({length:num}).map((_, i)=> (<span key={i} style={styles.starIcon}>⭐</span>));
  }

  //UI
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Yelp Star Guesser</h1>
        <p>{getStarIcon(5)}</p>

        {/*User clicks get review button, then it dissapears and the review shows*/}
        {!showReview && (
          <button style={styles.button} onClick={getReview}>Get Yelp Review</button>
        )}
        {showReview && ( 
          <div style={styles.reviewBox}>{review}</div>
        )}

        {/* Star buttons */}
        {showReview && (
          <div style={styles.row}> 
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => getGuess(num)}
                disabled={showResult} //user can't click these buttons after submitting their review
                style={{
                  ...styles.starButton,
                  backgroundColor: guess === num ? "#d6f0ff" : "#efeffd",
                  transform: guess === num ? "scale(1.05)" : "scale(1)",
                }}>
                <span style={styles.starIcon}>⭐</span> {num}
              </button>
          ))}
          </div>
        )}

        {/* Submit Button */}
        {showReview && !showResult && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              style={{
                ...styles.button,
                opacity: guess ? 1 : 0.5,
                cursor: guess ? "pointer" : "not-allowed",
                marginTop: "20px",
              }}
              onClick={submitAnswer} disabled={!guess}  //user can't submit a guess without selecting a star rating
              >Submit Guess
            </button>
          </div>
        )}

        {/* Results */}
        {showResult && (
          <>
            <div style={styles.result}>
              <p>{message}</p>
              <p>
                Your guess: {guess} stars {getStarIcon(guess)}
              </p>
              <p>
                Actual rating: {rating} stars {getStarIcon(rating)}
              </p>
            </div>

            <button style={styles.button} onClick={getReview}  //reset the game with a new review
              >Get Another Review
            </button>

            <div style={styles.score}>Score: {score}</div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom right, #a9a9fd, #c7e5f6)", 
    fontFamily: "Delius, Comic Sans MS, cursive, sans-serif",
  },

  card: {
    width: "420px",
    padding: "25px",
    borderRadius: "25px",   //rounded corners
    backgroundColor: "#d9d9ff",
    boxShadow: "0 10px 30px rgba(160, 117, 252, 0.45)",
    textAlign: "center",
    border: "3px solid #b7b7f5",
  },

  title: {
    fontSize: "45px",
    marginBottom: "15px",
    color: "#908eff", // lavender purple
    fontWeight: "bold",
  },

  button: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "15px",
    backgroundColor: "#8db2fd", // baby blue
    color: "white",
    cursor: "pointer",
    marginBottom: "20px",
    display: "block",
    margin: "20px auto 0",
    fontWeight: "bold",
    boxShadow: "0 4px 10px rgba(78, 129, 232, 0.3)",
  },

  reviewBox: {
    padding: "18px",
    borderRadius: "15px",
    backgroundColor: "#efeffd",
    border: "2px solid #c6c6fc",
    marginBottom: "20px",
    minHeight: "80px",
    color: "#444",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
  },

  starButton: {
    flex: 1,
    padding: "10px",
    borderRadius: "15px",
    border: "2px solid #c6c6fc",
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: "#a4a4fe",
  },

  starIcon: {
    opacity: 0.75,
  },

  result: {
    marginTop: "20px",
    padding: "10px",
    borderRadius: "15px",
    backgroundColor: "#efeffd",
    border: "2px solid #c6c6fc",
    color: "#444",
  },

  score: {
    marginTop: "20px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#908eff",
  },
};