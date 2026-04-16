import { useState } from "react";
import "./styles.css";
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
    let stars = [];
    for (let i = 0; i < num; i++) {
      stars.push(<span key={i}>⭐</span>);
    }
    return stars;
  }

  function getStarButtons() {
    let buttons = [];
    let numbers = [1, 2, 3, 4, 5];

    for (let i = 0; i < numbers.length; i++) {
      let num = numbers[i];

      let className = "starButton";

      if (guess === num) {
        className = "starButton selected";
      }

      let button = (
        <button
          key={num}
          className={className}
          onClick={() => getGuess(num)}
          disabled={showResult}
        >
          ⭐ {num}
        </button>
      );

      buttons.push(button);
    }

    return buttons;
  }
  //UI
  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Yelp Star Guesser</h1>
        <p className="stars">{getStarIcon(5)}</p>

        {/*User clicks get review button, then it dissapears and the review shows*/}
        {!showReview && (
          <button className="button" onClick={getReview}>Get Yelp Review</button>
        )}
        {showReview && ( 
          <div className="reviewBox">{review}</div>
        )}

        {/* Star buttons */}
        {showReview && (
          <div className="row"> 
            {getStarButtons()}
        </div>
      )}

        {/* Submit Button */}
        {showReview && !showResult && (
          <div className="center">
            <button className="button"
              onClick={submitAnswer} disabled={!guess}  //user can't submit a guess without selecting a star rating
              >Submit Guess
            </button>
          </div>
        )}

        {/* Results */}
        {showResult && (
          <>
            <div className="result">
              <p>{message}</p>
              <p>
                Your guess: {guess} stars {getStarIcon(guess)}
              </p>
              <p>
                Actual rating: {rating} stars {getStarIcon(rating)}
              </p>
            </div>

            <button className="button" onClick={getReview}  //reset the game with a new review
              >Get Another Review
            </button>

            <div className="score">Score: {score}</div>
          </>
        )}
      </div>
    </div>
  );
}